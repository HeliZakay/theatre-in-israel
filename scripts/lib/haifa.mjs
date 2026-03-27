/**
 * Haifa Theatre (תיאטרון חיפה) scraping helpers — schedule listing and
 * show detail extraction.
 *
 * Centralises all Haifa-specific scraping logic so it can be
 * imported by any script that needs it.
 */

import { fixDoubleProtocol, extractImageFromPage } from "./image.mjs";
import { setupRequestInterception } from "./browser.mjs";
import { resolveVenueCity } from "./venues.mjs";
import { parseShortYear } from "./date.mjs";

// ── Constants ──────────────────────────────────────────────────

export const HAIFA_THEATRE = "תיאטרון חיפה";
export const HAIFA_BASE = "https://www.ht1.co.il";
export const SCHEDULE_URL = "https://www.ht1.co.il/Show";

// ── Schedule page scraper ──────────────────────────────────────

/**
 * Scrape the Haifa Theatre schedule page.
 * Returns an array of `{ title, url }` with deduplicated titles,
 * sorted alphabetically in Hebrew.
 *
 * Uses Pattern A (direct link scraping) — show links on the schedule
 * page contain clean titles as their link text. Each show appears
 * multiple times (one per performance date), so we deduplicate by URL.
 *
 * @param {import("puppeteer").Browser} browser
 * @returns {Promise<Array<{ title: string, url: string }>>}
 */
export async function fetchShows(browser) {
  const page = await browser.newPage();
  await setupRequestInterception(page);

  await page.goto(SCHEDULE_URL, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForSelector('a[href*="/Event/Index/"]', { timeout: 30_000 });

  const shows = await page.evaluate((base) => {
    const urlMap = new Map(); // URL → title (keep first seen)

    document.querySelectorAll('a[href*="/Event/Index/"]').forEach((a) => {
      let text = a.textContent.trim();
      if (!text) return;
      text = text.replace(/\s+/g, " ").trim();

      // Skip non-title link texts (ticket buttons, date links, etc.)
      if (
        text === "כרטיסים" ||
        text === "עוד >" ||
        text === "עוד" ||
        text.length < 2 ||
        /^\d{2}\.\d{2}$/.test(text) // date links like "04.03"
      )
        return;

      const href = a.getAttribute("href") || "";
      const url = href.startsWith("http") ? href : `${base}${href}`;

      if (!urlMap.has(url)) {
        urlMap.set(url, text);
      }
    });

    return [...urlMap.entries()].map(([url, title]) => ({ title, url }));
  }, HAIFA_BASE);

  await page.close();
  return shows.sort((a, b) => a.title.localeCompare(b.title, "he"));
}

// ── Detail page scraper ────────────────────────────────────────

/**
 * Scrape a single Haifa Theatre show detail page.
 * Returns `{ title, durationMinutes, description, imageUrl, cast }`.
 *
 * @param {import("puppeteer").Browser} browser
 * @param {string} url
 * @returns {Promise<{ title: string, durationMinutes: number | null, description: string, imageUrl: string | null, cast: string | null }>}
 */
export async function scrapeShowDetails(browser, url) {
  const page = await browser.newPage();
  await setupRequestInterception(page, { allowImages: true });

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector("h1", { timeout: 30_000 });

  const data = await page.evaluate(() => {
    // ── Title ──
    const h1 = document.querySelector("h1");
    let title = h1 ? h1.textContent.trim() : "";
    // Collapse newlines in multi-line h1 elements to a single space
    title = title
      .replace(/\n+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();

    const body = document.body.innerText;

    // ── Duration ──
    // Haifa Theatre detail pages don't consistently show duration,
    // but try the standard pattern just in case.
    let durationMinutes = null;
    const durationMatch = body.match(/משך ההצגה[:\s]*(\d+)\s*דקות/);
    if (durationMatch) {
      durationMinutes = parseInt(durationMatch[1], 10);
    }

    // ── Description ──
    // Detail pages use a tab layout with "על ההצגה" / "שחקנים ויוצרים"
    // tabs. The "על ההצגה" text appears in the body as a tab label,
    // followed by the description content.
    let description = "";
    const startMarker = "על ההצגה";
    const stopMarkers = [
      "יצירה ועיצוב",
      "צילום ועיצוב",
      "צילום ועריכת",
      "בהשתתפות:",
      "בימוי ועריכה",
      "תיאטרון חיפה - התיאטרון של חיפה והצפון",
      "עקבו אחרינו",
    ];

    const startIdx = body.indexOf(startMarker);
    if (startIdx !== -1) {
      let rest = body.slice(startIdx + startMarker.length).trim();

      // Find the earliest stop marker
      let endIdx = rest.length;
      for (const marker of stopMarkers) {
        const idx = rest.indexOf(marker);
        if (idx !== -1 && idx < endIdx) endIdx = idx;
      }

      description = rest.slice(0, endIdx).trim();

      // Strip leading title repetition(s) — the tab content often
      // starts with an h3 repeating the show title
      while (description.startsWith(title) && title.length > 0) {
        description = description.slice(title.length).trim();
      }

      // Clean up
      // Remove photo credit lines
      description = description.replace(/\*צילום:.*$/gm, "");
      description = description.replace(/צילום:.*$/gm, "");
      // Remove asterisked lines
      description = description.replace(/^\*[^\n]*$/gm, "");
      // Collapse excess newlines
      description = description.replace(/\n{3,}/g, "\n\n").trim();
    }

    // Fallback: if "על ההצגה" marker wasn't found, try extracting
    // text after the h1 title (like Habima's approach)
    if (!description && title) {
      const titleIdx = body.indexOf(title);
      if (titleIdx !== -1) {
        let rest = body.slice(titleIdx + title.length).trim();

        const fallbackStops = [
          "שחקנים ויוצרים",
          "יצירה ועיצוב",
          "צילום ועיצוב",
          "צילום ועריכת",
          "בהשתתפות:",
          "בימוי ועריכה",
          "תיאטרון חיפה - התיאטרון של חיפה והצפון",
          "עקבו אחרינו",
          "כרטיסים",
        ];

        let endIdx = rest.length;
        for (const marker of fallbackStops) {
          const idx = rest.indexOf(marker);
          if (idx !== -1 && idx < endIdx) endIdx = idx;
        }

        description = rest.slice(0, endIdx).trim();
        description = description.replace(/\*צילום:.*$/gm, "");
        description = description.replace(/צילום:.*$/gm, "");
        description = description.replace(/^\*[^\n]*$/gm, "");
        description = description.replace(/\n{3,}/g, "\n\n").trim();
      }
    }

    // ── Cast ──
    // Haifa show pages list cast under "בהשתתפות:" as a comma-separated
    // list of actor names. Alternates use "/" (e.g. "עידן אלתרמן/משה אשכנזי").
    // The text may span multiple lines before the next section.
    let cast = null;
    const castMarker = "בהשתתפות:";
    const castIdx = body.indexOf(castMarker);
    if (castIdx !== -1) {
      let rest = body.slice(castIdx + castMarker.length).trim();

      // Stop markers for end of cast section
      const castStopMarkers = [
        "נגנים:",
        "נגינה בהקלטות:",
        "נגינה:",
        "צילום:",
        "צילום ועיצוב",
        "צילום ועריכת",
        "תיאטרון חיפה - התיאטרון של חיפה והצפון",
        "עקבו אחרינו",
        "משך ההצגה",
        "כרטיסים",
      ];

      let endIdx = rest.length;
      for (const marker of castStopMarkers) {
        const idx = rest.indexOf(marker);
        if (idx !== -1 && idx < endIdx) endIdx = idx;
      }

      cast = rest.slice(0, endIdx).trim();
      // Collapse newlines into a single space (cast often wraps)
      cast = cast
        .replace(/\n+/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();
      // Remove trailing period
      cast = cast.replace(/\.\s*$/, "").trim();
      // If empty after cleaning, set to null
      if (!cast) cast = null;
    }

    return { title, durationMinutes, description, cast };
  });

  // ── Image URL (using shared extraction logic) ──
  // extractImageFromPage must be passed as the pageFunction (not as a
  // serialised argument) because Puppeteer cannot serialise functions.
  const imageUrl = await page.evaluate(extractImageFromPage);

  // Fix double-protocol URLs outside the browser context
  if (imageUrl) {
    data.imageUrl = fixDoubleProtocol(imageUrl);
  } else {
    data.imageUrl = null;
  }

  await page.close();
  return data;
}

// ── Events scraper ─────────────────────────────────────────────

/**
 * Scrape performance dates/times from a Haifa Theatre show detail page.
 *
 * Page structure (confirmed via DOM inspection):
 *   <ul id="showsList">
 *     <li class="show_item">
 *       <div class="show_info_gr">
 *         <div class="show_time_gr">
 *           <div class="show_date">19.03.26</div>  ← DD.MM.YY (two-digit year)
 *           <div class="time_circle"></div>
 *           <div>ה</div>                            ← Hebrew day letter
 *           <div class="time_circle"></div>
 *           <div>20:30</div>                        ← HH:MM
 *         </div>
 *         <div>תיאטרון חיפה - במה ראשית</div>   ← venue (varies per event!)
 *       </div>
 *       <a onclick="window.open('https://ht1.smarticket.co.il/event/...', '_blank')" href="#" class="show_list_link">כרטיסים</a>
 *     </li>
 *   </ul>
 *   <a id="moreDatesNew" ...>עוד 9 מועדים</a>  ← loads more via AJAX when clicked
 *
 * Some shows perform at guest venues (e.g. "בית החייל ת״א"), so
 * we extract the venue name per event from the DOM.
 *
 * @param {import("puppeteer").Browser} browser
 * @param {string} url — show detail page URL
 * @param {{ debug?: boolean }} [options]
 * @returns {Promise<{
 *   events: Array<{ date: string, hour: string, venueName: string, venueCity: string, ticketUrl: string|null, rawText: string }>,
 *   debugHtml?: string
 * }>}
 */
export async function scrapeShowEvents(browser, url, { debug = false } = {}) {
  const page = await browser.newPage();
  await setupRequestInterception(page);

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector("h1", { timeout: 15_000 });
  // Wait for the shows list to appear
  await page.waitForSelector("#showsList", { timeout: 10_000 }).catch(() => {});

  // Click "עוד מועדים" (#moreDatesNew) to load all performances
  // The button disappears once all dates are loaded.
  for (let attempt = 0; attempt < 20; attempt++) {
    const clicked = await page.evaluate(() => {
      const btn = document.querySelector("#moreDatesNew");
      if (btn && btn.offsetParent !== null) {
        btn.click();
        return true;
      }
      return false;
    });
    if (!clicked) break;
    // Wait for the new rows to render
    await new Promise((r) => setTimeout(r, 1_200));
  }

  const result = await page.evaluate((debugMode) => {
    const output = { events: [], debugHtml: null };
    const events = [];

    const DATE_RE = /(\d{2})\.(\d{2})\.(\d{2})/;
    const TIME_RE = /(\d{1,2}:\d{2})/;
    // Ticket URL lives in onclick: window.open('URL', '_blank')
    const ONCLICK_RE = /window\.open\('([^']+)'/;

    const items = document.querySelectorAll("#showsList li.show_item");

    for (const li of items) {
      const dateEl = li.querySelector(".show_date");
      if (!dateEl) continue;

      const dateText = dateEl.textContent.trim();
      const dateMatch = dateText.match(DATE_RE);
      if (!dateMatch) continue;

      // Time is the last non-empty text node in .show_time_gr that isn't
      // the date or a day letter (Hebrew single char). Simplest: regex the
      // whole time group text.
      const timeGr = li.querySelector(".show_time_gr");
      const timeGrText = timeGr ? timeGr.textContent : "";
      const timeMatch = timeGrText.match(TIME_RE);

      // Venue is the sibling div of .show_time_gr inside .show_info_gr
      const infoGr = li.querySelector(".show_info_gr");
      let venue = "";
      if (infoGr) {
        for (const child of infoGr.children) {
          if (!child.classList.contains("show_time_gr")) {
            venue = child.textContent.trim();
            break;
          }
        }
      }

      // Ticket URL from onclick attribute
      const ticketLink = li.querySelector("a.show_list_link");
      let ticketUrl = null;
      if (ticketLink) {
        const onclick = ticketLink.getAttribute("onclick") || "";
        const onclickMatch = onclick.match(ONCLICK_RE);
        if (onclickMatch) ticketUrl = onclickMatch[1];
      }

      const rawText = li.textContent?.replace(/\s+/g, " ").trim() || "";

      events.push({
        day: parseInt(dateMatch[1], 10),
        month: parseInt(dateMatch[2], 10),
        yearShort: parseInt(dateMatch[3], 10),
        hour: timeMatch ? timeMatch[1] : "",
        venue,
        ticketUrl,
        rawText: rawText.slice(0, 250),
      });
    }

    // Fallback: body-text regex if #showsList wasn't found
    if (events.length === 0) {
      const seen = new Set();
      const bodyText = document.body.innerText;
      const rowRe = /(\d{2})\.(\d{2})\.(\d{2})\D{0,30}?(\d{1,2}:\d{2})/g;
      let m;
      while ((m = rowRe.exec(bodyText)) !== null) {
        const key = `${m[1]}.${m[2]}.${m[3]}|${m[4]}`;
        if (!seen.has(key)) {
          seen.add(key);
          events.push({
            day: parseInt(m[1], 10),
            month: parseInt(m[2], 10),
            yearShort: parseInt(m[3], 10),
            hour: m[4],
            ticketUrl: null,
            rawText: bodyText
              .slice(Math.max(0, m.index - 5), m.index + m[0].length + 50)
              .trim(),
          });
        }
      }
    }

    if (debugMode) {
      const list = document.querySelector("#showsList");
      output.debugHtml = list
        ? list.outerHTML
        : document.body.innerHTML.slice(0, 10_000);
    }

    output.events = events;
    return output;
  }, debug);

  await page.close();

  // Build final event objects (Node context) — derive full year from 2-digit short
  const processed = [];
  const seen = new Set();

  for (const e of result.events) {
    const year = parseShortYear(e.yearShort);
    const dateStr = `${year}-${String(e.month).padStart(2, "0")}-${String(e.day).padStart(2, "0")}`;
    const key = e.ticketUrl || `${dateStr}|${e.hour}`;

    if (!seen.has(key)) {
      seen.add(key);
      // Use extracted venue, stripping stage suffixes like "- במה ראשית"
      let venueName = e.venue || HAIFA_THEATRE;
      // Haifa Theatre pages often append stage name (e.g. "תיאטרון חיפה - במה ראשית")
      // Normalise back to the base theatre name when it's the home venue
      if (venueName.startsWith(HAIFA_THEATRE)) {
        venueName = HAIFA_THEATRE;
      }
      const venueCity = resolveVenueCity(venueName);
      processed.push({
        date: dateStr,
        hour: e.hour,
        venueName,
        venueCity,
        ticketUrl: e.ticketUrl,
        rawText: e.rawText,
      });
    }
  }

  result.events = processed;
  return result;
}
