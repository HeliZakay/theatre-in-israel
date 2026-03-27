/**
 * Tmuna Theatre scraping helpers — show listing and show detail extraction.
 *
 * Centralises all Tmuna-specific scraping logic so it can be
 * imported by any script that needs it.
 *
 * Tmuna (תיאטרון תמונע) is a venue that hosts theatre, dance,
 * children's shows, ensemble productions, and also music concerts
 * and literature events. Only theatrical categories are scraped.
 *
 * Listing page: schedule table at ?pg=show with <a href*="ArticleID">
 * links and <td class="categoryTd"> for category filtering.
 *
 * Detail pages: ?CategoryID=X&ArticleID=Y with h1.ArticleTitle,
 * standard "משך ההצגה: X דקות" duration, description in
 * .Show-Tabs-Content-Inner, and og:image meta tags.
 */

import { fixDoubleProtocol, extractImageFromPage } from "./image.mjs";
import { setupRequestInterception } from "./browser.mjs";

// ── Constants ──────────────────────────────────────────────────

export const TMUNA_THEATRE = "תיאטרון תמונע";
export const TMUNA_BASE = "https://www.tmu-na.org.il";
export const SHOWS_URL = "https://www.tmu-na.org.il/?pg=show";

/**
 * Categories to exclude from scraping — music concerts and
 * literature events are not theatrical productions.
 */
const EXCLUDED_CATEGORIES = ["מוסיקה", "ספרות"];

// ── Shows listing page scraper ─────────────────────────────────

/**
 * Fetch the list of current shows from the Tmuna schedule page.
 *
 * Uses Pattern A (direct link scraping) — the schedule table has
 * show names as link text inside `<a href*="ArticleID">` elements,
 * with categories in sibling `<td class="categoryTd">`.
 *
 * Filters out music and literature events, keeping only theatrical
 * productions (theatre, ensemble, dance, children's, work groups).
 *
 * @param {import('puppeteer').Browser} browser
 * @returns {Promise<Array<{title: string, url: string}>>}
 */
export async function fetchShows(browser) {
  const page = await browser.newPage();
  await setupRequestInterception(page);

  await page.goto(SHOWS_URL, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForSelector('a[href*="ArticleID"]', { timeout: 30_000 });

  const shows = await page.evaluate((excludedCategories) => {
    const map = new Map();

    const rows = document.querySelectorAll("tr");
    for (const tr of rows) {
      const link = tr.querySelector('a[href*="ArticleID"]');
      if (!link) continue;

      // Check category — skip music and literature
      const categoryTd = tr.querySelector(".categoryTd");
      const category = categoryTd ? categoryTd.textContent.trim() : "";
      if (excludedCategories.includes(category)) continue;

      let title = link.textContent.trim();
      if (!title || title.length < 2) continue;

      // Normalize whitespace
      title = title.replace(/\s+/g, " ").trim();

      const url = link.href;

      // Deduplicate — same show appears on multiple dates
      if (!map.has(title)) {
        map.set(title, url);
      }
    }

    return [...map.entries()].map(([title, url]) => ({ title, url }));
  }, EXCLUDED_CATEGORIES);

  await page.close();
  return shows.sort((a, b) => a.title.localeCompare(b.title, "he"));
}

// ── Events scraper ─────────────────────────────────────────────

/**
 * Scrape performance dates/times from a Tmuna Theatre show detail page.
 *
 * Website format — schedule table after "מופעים קרובים:" heading:
 *   <table cellspacing="0" cellpadding="2" border="0">
 *     <tr>
 *       <td>DD/MM/YYYY</td>    ← col 0: date (full year always present)
 *       <td>שבת</td>           ← col 1: day name (Hebrew)
 *       <td>20:00</td>         ← col 2: time
 *       <td>60 ₪</td>          ← col 3: price / status
 *       <td><input class="buttonshow" onclick="...EventCode=XXXXX..."></td>
 *     </tr>
 *   </table>
 *
 * Ticket URL: extracted from the `onclick` attribute of `input.buttonshow`.
 * Cancelled rows: col 3 text contains "בוטלה" — skipped.
 * Year is always provided in full (DD/MM/YYYY) — no inference needed.
 *
 * Tmuna is a fixed venue (תיאטרון תמונע, תל אביב).
 *
 * @param {import("puppeteer").Browser} browser
 * @param {string} url — show detail page URL
 * @param {{ debug?: boolean }} [options]
 * @returns {Promise<{
 *   events: Array<{ date: string, hour: string, venueName: string, venueCity: string, ticketUrl: string|null, rawText: string }>,
 *   title: string,
 *   debugHtml?: string
 * }>}
 */
export async function scrapeShowEvents(browser, url, { debug = false } = {}) {
  const page = await browser.newPage();
  await setupRequestInterception(page);

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector("h1", { timeout: 15_000 });
  // Give the schedule table a moment to render (graceful if absent)
  await page.waitForSelector("input.buttonshow, table[cellpadding='2']", { timeout: 10_000 }).catch(() => {});

  const result = await page.evaluate((debugMode) => {
    const output = { events: [], title: "", debugHtml: null };
    const events = [];

    // ── Page title ──
    const h1 = document.querySelector("h1.ArticleTitle") || document.querySelector("h1");
    output.title = h1 ? h1.textContent.replace(/\s+/g, " ").trim() : "";

    const DATE_RE = /(\d{2})\/(\d{2})\/(\d{4})/;
    const TIME_RE = /(\d{1,2}:\d{2})/;

    // ── Locate the schedule table ──
    // The page has a <div><b>מופעים קרובים:</b></div> immediately before the table.
    let scheduleTable = null;

    for (const b of document.querySelectorAll("b")) {
      if (!b.textContent.trim().includes("מופעים קרובים")) continue;
      const parent = b.parentElement;
      let sib = parent ? parent.nextElementSibling : null;
      while (sib) {
        if (sib.tagName === "TABLE") {
          scheduleTable = sib;
          break;
        }
        sib = sib.nextElementSibling;
      }
      break;
    }

    // Fallback: any table with the characteristic attributes
    if (!scheduleTable) {
      scheduleTable = document.querySelector("table[cellpadding='2'][border='0']");
    }

    if (!scheduleTable) {
      if (debugMode) output.debugHtml = document.body.innerHTML.slice(0, 10_000);
      output.events = events;
      return output;
    }

    for (const tr of scheduleTable.querySelectorAll("tr")) {
      const cells = tr.querySelectorAll("td");
      if (cells.length < 3) continue;

      const dateText = cells[0].textContent.trim();
      const timeText = cells[2].textContent.trim();
      const dateMatch = dateText.match(DATE_RE);
      const timeMatch = timeText.match(TIME_RE);
      if (!dateMatch) continue;

      // Skip cancelled events
      const statusText = cells.length >= 4 ? cells[3].textContent.trim() : "";
      if (statusText.includes("בוטלה")) continue;

      // Extract ticket URL from the button onclick
      let ticketUrl = null;
      const btn = tr.querySelector("input.buttonshow");
      if (btn) {
        const onclick = btn.getAttribute("onclick") || "";
        const m = onclick.match(/window\.location\.href='([^']+)'/);
        if (m) {
          let href = m[1];
          if (href.startsWith("//")) href = "https:" + href;
          ticketUrl = href;
        }
      }

      events.push({
        day: parseInt(dateMatch[1], 10),
        month: parseInt(dateMatch[2], 10),
        year: parseInt(dateMatch[3], 10),
        hour: timeMatch ? timeMatch[1] : "",
        ticketUrl,
        rawText: tr.textContent.replace(/\s+/g, " ").trim().slice(0, 250),
      });
    }

    if (debugMode) {
      output.debugHtml = scheduleTable.outerHTML;
    }

    output.events = events;
    return output;
  }, debug);

  await page.close();

  // Build final event objects — deduplicate by ticketUrl or date+hour
  const processed = [];
  const seen = new Set();

  for (const e of result.events) {
    const dateStr = `${e.year}-${String(e.month).padStart(2, "0")}-${String(e.day).padStart(2, "0")}`;
    const key = e.ticketUrl || `${dateStr}|${e.hour}`;

    if (!seen.has(key)) {
      seen.add(key);
      processed.push({
        date: dateStr,
        hour: e.hour,
        venueName: TMUNA_THEATRE,
        venueCity: "תל אביב",
        ticketUrl: e.ticketUrl,
        rawText: e.rawText,
      });
    }
  }

  result.events = processed;
  return result;
}

// ── Detail page scraper ────────────────────────────────────────

/**
 * Scrape a single Tmuna show detail page.
 * Returns `{ title, durationMinutes, description, imageUrl }`.
 *
 * Detail page structure:
 * - Title: `<h1 class="ArticleTitle">`
 * - Duration: `משך ההצגה: X דקות` in `#ctlBody`
 * - Description: `.Show-Tabs-Content-Inner` div (first tab content)
 * - Image: og:image meta tag (reliable) + extractImageFromPage fallbacks
 *
 * @param {import('puppeteer').Browser} browser
 * @param {string} url  Full URL of the show page
 * @returns {Promise<{title: string, durationMinutes: number|null, description: string, imageUrl: string|null}>}
 */
export async function scrapeShowDetails(browser, url) {
  const page = await browser.newPage();
  await setupRequestInterception(page, { allowImages: true });

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector("h1", { timeout: 30_000 });

  const data = await page.evaluate(() => {
    // ── Title ──
    const h1 =
      document.querySelector("h1.ArticleTitle") || document.querySelector("h1");
    let title = h1 ? h1.textContent.trim() : "";
    title = title
      .replace(/\n+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();

    // ── Duration ──
    // Standard format: "משך ההצגה: X דקות" in body text
    let durationMinutes = null;
    const body = document.body.innerText;
    const durationMatch = body.match(/משך ההצגה:\s*(\d+)\s*דקות/);
    if (durationMatch) {
      durationMinutes = parseInt(durationMatch[1], 10);
    }

    // ── Description ──
    // Primary: extract from the tab content div which holds the
    // show description, reviews, and credits.
    const tabContent = document.querySelector(".Show-Tabs-Content-Inner");
    let description = "";

    if (tabContent) {
      description = tabContent.innerText.trim();
    } else {
      // Fallback: use body text after the h1 title
      const titleIdx = body.indexOf(title);
      if (titleIdx !== -1) {
        description = body.slice(titleIdx + title.length).trim();
      }
    }

    // Stop at the earliest stop marker
    const stopMarkers = [
      "ביקורות וכתבות",
      "\nמאת:",
      "\nמאת ובבימוי:",
      "\nעיצוב:",
      "\nצילום פלאייר:",
      "הדפס",
      "הוסף תגובה",
      "לוח מופעים",
    ];

    let endIdx = description.length;
    for (const marker of stopMarkers) {
      const idx = description.indexOf(marker);
      if (idx !== -1 && idx < endIdx) endIdx = idx;
    }
    description = description.slice(0, endIdx).trim();

    // Clean up — remove metadata/promotional lines
    description = description.replace(/\*צילום:.*$/gm, "");
    description = description.replace(/^\*[^\n]*$/gm, "");
    description = description.replace(/הנחה ל.*$/gm, "");
    description = description.replace(/מותנה בהצגת תעודה.*$/gm, "");
    description = description.replace(/ניתן לחנות.*$/gm, "");
    description = description.replace(/פתיחת דלתות:.*$/gm, "");
    description = description.replace(/מופע עמידה.*$/gm, "");
    description = description.replace(/\n{3,}/g, "\n\n").trim();

    // ── Cast ──
    // Credits appear in a "//" -separated format, e.g.
    //   מאת: ... // בימוי: ... // שחקנים: name1, name2 ושם3
    const castMarkers = [
      "שחקנים ושחקניות:",
      "שחקנים/ות:",
      "שחקניות:",
      "שחקנים:",
      "משחקות:",
      "משחק:",
      "בכיכוב:",
      "בהשתתפות:",
    ];

    let cast = null;

    // Strategy 1: split by "//" and find a segment starting with a cast marker
    const segments = body.split("//").map((s) => s.trim());
    for (const marker of castMarkers) {
      if (cast) break;
      for (const seg of segments) {
        if (seg.startsWith(marker)) {
          cast = seg.slice(marker.length).trim();
          break;
        }
      }
    }

    // Strategy 2: line-based fallback — look for lines starting with a cast marker
    if (!cast) {
      const lines = body.split("\n").map((l) => l.trim());
      for (const marker of castMarkers) {
        if (cast) break;
        for (const line of lines) {
          if (line.startsWith(marker)) {
            cast = line.slice(marker.length).trim();
            break;
          }
        }
      }
    }

    // Clean cast text — truncate at end-of-cast markers
    if (cast) {
      const endMarkers = [
        "תודות:",
        "תודות ",
        "הדפס",
        "הוסף תגובה",
        "לוח מופעים",
        "ביקורות",
        "מן העיתונות",
        "הרשמה לניוזלטר",
        "תיאטרון תמונע",
        "דלג על",
        "**גילאי",
        "**גילאים",
        "*גילאי",
        "גילאי ",
        "קראתי ואני",
        "מדיניות פרטיות",
        "דרונט דיגיטל",
        "שונצינו 8",
      ];

      let endIdx = cast.length;
      for (const marker of endMarkers) {
        const idx = cast.indexOf(marker);
        if (idx !== -1 && idx < endIdx) endIdx = idx;
      }

      // Also stop at double-newline
      const dblNewline = cast.indexOf("\n\n");
      if (dblNewline !== -1 && dblNewline < endIdx) endIdx = dblNewline;

      // Also stop at the show title echoed back
      if (title) {
        const titleIdx = cast.indexOf(title);
        if (titleIdx !== -1 && titleIdx < endIdx) endIdx = titleIdx;
      }

      cast = cast.slice(0, endIdx).trim();

      // Remove trailing punctuation, bidi marks, stray title echoes
      cast = cast.replace(/[.\u200F\u200E]+$/, "");
      cast = cast.replace(/\s{2,}/g, " ").trim();
      // Strip trailing comma
      cast = cast.replace(/,\s*$/, "").trim();

      if (!cast) cast = null;
    }

    return { title, durationMinutes, description, cast };
  });

  // ── Image URL (using shared extraction logic) ──
  const imageUrl = await page.evaluate(extractImageFromPage);
  if (imageUrl) {
    data.imageUrl = fixDoubleProtocol(imageUrl);
  } else {
    data.imageUrl = null;
  }

  await page.close();
  return data;
}
