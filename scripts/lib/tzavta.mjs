/**
 * Tzavta Theatre scraping helpers — show listing and show detail extraction.
 *
 * Centralises all Tzavta-specific scraping logic so it can be
 * imported by any script that needs it.
 *
 * Listing page: https://www.tzavta.co.il/category/1 (תיאטרון category)
 * Each show card is an <a class="shows_link" href="/event/{id}"> containing
 * an <h2 class="shows_info_title"> with the show title — Pattern A (direct links).
 *
 * Detail page structure:
 *   - Title: h1.show_title
 *   - Subtitle: div.show_title_txt
 *   - Description: div.show_content_insert (plain text before credits markers)
 *   - Duration: various formats, see parseTzavtaDuration()
 *   - Image: og:image meta tag + <img class="shows_pict">
 */

import { fixDoubleProtocol, extractImageFromPage } from "./image.mjs";
import { setupRequestInterception } from "./browser.mjs";
import { formatDate } from "./date.mjs";

// ── Constants ──────────────────────────────────────────────────

export const TZAVTA_THEATRE = "תיאטרון צוותא";
export const TZAVTA_BASE = "https://www.tzavta.co.il";
export const LISTING_URL = "https://www.tzavta.co.il/category/1";

// ── Duration parser ────────────────────────────────────────────

/**
 * Parse Tzavta duration text into minutes.
 *
 * Observed formats on Tzavta detail pages:
 *   "משך ההצגה: כ- 60 דקות"   → 60
 *   "משך הצגה: 120ד' כולל הפסקה" → 120
 *   "משך הצגה: כ 75 ד"         → 75
 *   "משך ההצגה: שעה וחצי"      → 90  (fallback)
 *
 * @param {string|null} text  Raw body text from the page
 * @returns {number|null}
 */
export function parseTzavtaDuration(text) {
  if (!text) return null;

  // Primary: find a number after the duration marker
  // Matches "משך ההצגה:" or "משך הצגה:" with optional "כ-" / "כ " prefix
  const numMatch = text.match(
    /משך\s+ה?הצגה:?\s*(?:כ-?\s*)?(\d+)\s*(?:דקות|ד['׳]?|$)/,
  );
  if (numMatch) {
    return parseInt(numMatch[1], 10);
  }

  // Fallback: textual Hebrew durations
  const textMatch = text.match(/משך\s+ה?הצגה:?\s*([^\n]+)/);
  if (textMatch) {
    const line = textMatch[1].trim();
    if (/שעה וחצי/.test(line)) return 90;
    if (/שעתיים/.test(line)) return 120;
    if (/שעה/.test(line)) return 60;
  }

  return null;
}

// ── Non-show title filters ─────────────────────────────────────

const NON_SHOW_PREFIXES = ["קול קורא"];

/**
 * Returns true if the title belongs to a non-show entry
 * (e.g. call for submissions, gift cards).
 */
function isNonShow(title) {
  return NON_SHOW_PREFIXES.some((prefix) => title.startsWith(prefix));
}

// ── Shows listing page scraper ─────────────────────────────────

/**
 * Fetch the list of current theatre shows from the Tzavta category page.
 *
 * Uses Pattern A (direct link scraping): each show card is an <a> tag
 * wrapping an <h2 class="shows_info_title"> with the clean title.
 *
 * @param {import('puppeteer').Browser} browser
 * @returns {Promise<Array<{title: string, url: string}>>}
 */
export async function fetchShows(browser) {
  const page = await browser.newPage();
  await setupRequestInterception(page);

  await page.goto(LISTING_URL, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForSelector('a[href*="/event/"]', { timeout: 30_000 });

  const shows = await page.evaluate((base) => {
    const map = new Map();
    const links = document.querySelectorAll('a[href*="/event/"]');

    for (const link of links) {
      // Only process show cards (skip nav/footer links that also contain /event/)
      const h2 = link.querySelector("h2.shows_info_title");
      if (!h2) continue;

      let title = h2.textContent.trim();
      if (!title) continue;
      title = title.replace(/\s+/g, " ").trim();
      if (title.length < 2) continue;

      const href = link.getAttribute("href") || "";
      if (!href.includes("/event/")) continue;

      const url = href.startsWith("http") ? href : `${base}${href}`;

      if (!map.has(title)) {
        map.set(title, url);
      }
    }

    return [...map.entries()].map(([title, url]) => ({ title, url }));
  }, TZAVTA_BASE);

  await page.close();

  // Filter out non-show entries in Node context (avoids serialising the filter
  // function into the browser)
  const filtered = shows.filter((s) => !isNonShow(s.title));

  return filtered.sort((a, b) => a.title.localeCompare(b.title, "he"));
}

// ── Detail page scraper ────────────────────────────────────────

/**
 * Scrape a single Tzavta show detail page for title, duration,
 * description, cast, and image.
 *
 * @param {import('puppeteer').Browser} browser
 * @param {string} url  Full URL of the show page
 * @returns {Promise<{title: string, durationMinutes: number|null, description: string, imageUrl: string|null, cast: string|null}>}
 */
export async function scrapeShowDetails(browser, url) {
  const page = await browser.newPage();
  await setupRequestInterception(page, { allowImages: true });

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector("h1", { timeout: 30_000 });

  const data = await page.evaluate(() => {
    // ── Title ──
    const h1 = document.querySelector("h1.show_title");
    let title = h1 ? h1.textContent.trim() : "";
    title = title
      .replace(/\n+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();

    // ── Raw duration text (parsed in Node context) ──
    const body = document.body.innerText;
    let durationText = null;
    const durationLineMatch = body.match(/משך\s+ה?הצגה:?\s*([^\n]+)/);
    if (durationLineMatch) {
      durationText = durationLineMatch[0].trim();
    }

    // ── Description ──
    // The show_content_insert div holds description paragraphs followed by
    // credits (bold "מאת:", "בימוי:", etc.) and then duration / review quotes.
    // We extract the text before the first credits marker.
    let description = "";
    const contentDiv = document.querySelector(".show_content_insert");
    if (contentDiv) {
      const text = contentDiv.innerText.trim();

      const stopMarkers = [
        "מאת:",
        "מאת ",
        "בכיכובם של",
        "בכיכוב:",
        "שחקנים:",
        "בימוי:",
        "בימוי ",
        "לחנים:",
        "לחנים ",
        "משך ההצגה",
        "משך הצגה",
        "הביקורות משבחות",
        "זוכת פרס",
      ];

      let endIdx = text.length;
      for (const marker of stopMarkers) {
        const idx = text.indexOf(marker);
        if (idx !== -1 && idx < endIdx) endIdx = idx;
      }

      description = text.slice(0, endIdx).trim();

      // Clean up promotional / boilerplate lines
      description = description.replace(/צילום.*$/gm, "");
      description = description.replace(/^\*[^\n]*$/gm, "");
      description = description.replace(/\n{3,}/g, "\n\n").trim();
    }

    // ── Cast ──
    let cast = null;
    if (contentDiv) {
      const text = contentDiv.innerText.trim();

      const castMarkers = [
        "בכיכובם של:",
        "בכיכובם של",
        "בכיכוב:",
        "שחקנים/ות יוצרים/ות:",
        "שחקנים/ות:",
        "שחקנים יוצרים:",
        "שחקנים:",
        "בהשתתפות:",
        "יוצרים־מבצעים:",
        "יוצרים-מבצעים:",
        "משתתפים:",
      ];

      let castStart = -1;
      let markerLen = 0;
      for (const marker of castMarkers) {
        const idx = text.indexOf(marker);
        if (idx !== -1 && (castStart === -1 || idx < castStart)) {
          castStart = idx;
          markerLen = marker.length;
        }
      }

      if (castStart !== -1) {
        let raw = text.slice(castStart + markerLen);

        const endCastMarkers = [
          "מאת:",
          "מאת ",
          "בימוי:",
          "בימוי ",
          "במאי:",
          "במאי ",
          "כותב:",
          "כותב ",
          "מילים:",
          "מילים ",
          "לחנים:",
          "לחנים ",
          "לחן:",
          "לחן ",
          "מוזיקה:",
          "מוזיקה ",
          "עיבוד:",
          "עיבוד ",
          "תאורה:",
          "תפאורה:",
          "תלבושות:",
          "תלבושות ",
          "הלבשה:",
          "עיצוב ",
          "עיצוב:",
          "כוריאוגרפיה:",
          "סאונד:",
          "הפקה:",
          "להקה:",
          "ניהול מוסיקלי",
          "משך ה",
          "צילום:",
          "תרגום:",
          "נוסח עברי",
          "ע. במאי",
          "עוזר במאי",
          "עוזרת במאי",
          "כתיבה ",
          "הלחנה ",
          "ניהול ",
          "תנועה:",
          "עבודה קולית",
          "מערכונים ",
          "דרמטורג",
          "ליווי אמנותי",
          "ליווי אומנותי",
          "הביקורות",
          "זוכת פרס",
          "זוכה פרס",
        ];

        let endIdx = raw.length;
        for (const marker of endCastMarkers) {
          const idx = raw.indexOf(marker);
          if (idx !== -1 && idx < endIdx) endIdx = idx;
        }

        // Also stop at double-newline
        const dblNewline = raw.indexOf("\n\n");
        if (dblNewline !== -1 && dblNewline < endIdx) endIdx = dblNewline;

        raw = raw.slice(0, endIdx).trim();
        raw = raw.replace(/\n+/g, ", ");
        raw = raw.replace(/,\s*,/g, ",");
        raw = raw.replace(/\s{2,}/g, " ");
        raw = raw.trim();
        raw = raw.replace(/,\s*$/, "");
        // Remove trailing period or stray punctuation
        raw = raw.replace(/[.\s]+$/, "").trim();

        // Strip trailing credit roles that leaked past end-markers
        const creditRoles = [
          "בימוי",
          "עיצוב",
          "תפאורה",
          "תלבושות",
          "יוזמה",
          "הפקה",
          "סאונד",
          "כוריאוגרפיה",
          "דרמטורגיה",
        ];
        let changed = true;
        while (changed) {
          changed = false;
          for (const role of creditRoles) {
            if (raw.endsWith(role) || raw.endsWith(role + " ו")) {
              const suffix = raw.endsWith(role + " ו") ? role + " ו" : role;
              raw = raw
                .slice(0, -suffix.length)
                .trim()
                .replace(/,\s*$/, "")
                .trim();
              changed = true;
            }
          }
          // Also strip trailing " ו" (lonely Hebrew "and")
          if (raw.endsWith(" ו")) {
            raw = raw.slice(0, -2).trim().replace(/,\s*$/, "").trim();
            changed = true;
          }
        }

        cast = raw || null;
      }
    }

    return { title, durationText, description, cast };
  });

  // Parse duration in Node context (access to our custom parser)
  data.durationMinutes = parseTzavtaDuration(data.durationText);
  delete data.durationText;

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

// ── Events scraper ─────────────────────────────────────────────

/**
 * Scrape performance dates/times from a Tzavta Theatre show detail page.
 *
 * Website format — each upcoming performance is a `li.show_date_group` inside
 * `ul.show_date_list`. Each li contains three `.show_date_block` divs:
 *   [0]: day name + date (DD.MM.YYYY) in `.show_date_num`
 *   [1]: label "שעה" + time (HH:MM) in `.show_date_num`
 *   [2]: label "אולם" + hall name in `.show_date_num` (or "נדחה" = postponed)
 *
 * Ticket URLs are not external — the site uses an internal ticketing system
 * (`href="javascript:void(0);"`) so ticketUrl is always null.
 *
 * Tzavta Theatre is a fixed venue (תיאטרון צוותא, תל אביב).
 *
 * @param {import("puppeteer").Browser} browser
 * @param {string} url — show detail page URL
 * @param {{ debug?: boolean }} [options]
 * @returns {Promise<{
 *   events: Array<{ date: string, hour: string, venueName: string, venueCity: string, ticketUrl: null, rawText: string }>,
 *   title: string,
 *   debugHtml?: string
 * }>}
 */
export async function scrapeShowEvents(browser, url, { debug = false } = {}) {
  const page = await browser.newPage();
  await setupRequestInterception(page);

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector("h1", { timeout: 15_000 });
  // Wait for the dates list (gracefully absent if show has no upcoming dates)
  await page
    .waitForSelector("ul.show_date_list", { timeout: 8_000 })
    .catch(() => {});

  const result = await page.evaluate((debugMode) => {
    const output = { events: [], title: "", debugHtml: null };

    // ── Page title ──
    const h1 = document.querySelector("h1.show_title");
    output.title = h1 ? h1.textContent.replace(/\s+/g, " ").trim() : "";

    // DD.MM.YYYY
    const DATE_RE = /(\d{2})\.(\d{2})\.(\d{4})/;
    // HH:MM
    const TIME_RE = /(\d{1,2}:\d{2})/;

    const list = document.querySelector("ul.show_date_list");
    if (!list) {
      if (debugMode) output.debugHtml = document.body.innerHTML.slice(0, 10_000);
      return output;
    }

    const items = list.querySelectorAll("li.show_date_group");
    const events = [];

    for (const li of items) {
      // Each li has three .show_date_block divs; .show_date_num holds the value
      const nums = li.querySelectorAll(".show_date_num");
      // nums[0] = date, nums[1] = time, nums[2] = hall
      const dateText = nums[0] ? nums[0].textContent.trim() : "";
      const timeText = nums[1] ? nums[1].textContent.trim() : "";
      const hallText = nums[2] ? nums[2].textContent.trim() : "";

      // Skip postponed / cancelled slots ("נדחה", "נדחה ל 15/4", etc.)
      if (hallText.startsWith("נדחה")) continue;

      const rawText = li.textContent?.replace(/\s+/g, " ").trim() || "";
      const dateMatch = dateText.match(DATE_RE) || rawText.match(DATE_RE);
      const timeMatch = timeText.match(TIME_RE) || rawText.match(TIME_RE);
      if (!dateMatch) continue;

      events.push({
        day: parseInt(dateMatch[1], 10),
        month: parseInt(dateMatch[2], 10),
        year: parseInt(dateMatch[3], 10),
        hour: timeMatch ? timeMatch[1] : "",
        rawText: rawText.slice(0, 250),
      });
    }

    if (debugMode) {
      output.debugHtml = list.outerHTML;
    }

    output.events = events;
    return output;
  }, debug);

  await page.close();

  // Build final event objects — deduplicate by date+hour
  const processed = [];
  const seen = new Set();

  for (const e of result.events) {
    const dateStr = formatDate(e.day, e.month, e.year);
    const key = `${dateStr}|${e.hour}`;

    if (!seen.has(key)) {
      seen.add(key);
      processed.push({
        date: dateStr,
        hour: e.hour,
        venueName: TZAVTA_THEATRE,
        venueCity: "תל אביב",
        ticketUrl: null,
        rawText: e.rawText,
      });
    }
  }

  result.events = processed;
  return result;
}

/**
 * Scrape only cast data from a Tzavta show detail page.
 * Extracts from the show_content_insert div using cast/end markers.
 * Used by the cast backfill pipeline.
 *
 * @param {import("puppeteer").Browser} browser
 * @param {string} url — detail page URL
 * @returns {Promise<string | null>}
 */
export async function scrapeCast(browser, url) {
  const page = await browser.newPage();
  await setupRequestInterception(page);
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForSelector("h1", { timeout: 30_000 });

    const cast = await page.evaluate(() => {
      const contentDiv = document.querySelector(".show_content_insert");
      if (!contentDiv) return "";
      const text = contentDiv.innerText;

      const castMarkers = [
        "בכיכובם של:",
        "בכיכובם של",
        "בכיכוב:",
        "שחקנים/ות יוצרים/ות:",
        "שחקנים/ות:",
        "שחקנים יוצרים:",
        "שחקנים:",
        "בהשתתפות:",
        "יוצרים־מבצעים:",
        "יוצרים-מבצעים:",
        "משתתפים:",
      ];

      let castStart = -1;
      let markerLen = 0;
      for (const marker of castMarkers) {
        const idx = text.indexOf(marker);
        if (idx !== -1 && (castStart === -1 || idx < castStart)) {
          castStart = idx;
          markerLen = marker.length;
        }
      }
      if (castStart === -1) return "";

      let castText = text.slice(castStart + markerLen);

      const endMarkers = [
        "מאת:",
        "מאת ",
        "בימוי:",
        "בימוי ",
        "לחנים:",
        "לחנים ",
        "עיבוד:",
        "עיבוד ",
        "תאורה:",
        "תפאורה:",
        "הלבשה:",
        "עיצוב ",
        "עיצוב:",
        "כוריאוגרפיה:",
        "סאונד:",
        "הפקה:",
        "להקה:",
        "ניהול מוסיקלי",
        "משך ה",
        "צילום:",
        "תרגום:",
        "נוסח עברי",
        "ע. במאי",
        "עוזר במאי",
        "עוזרת במאי",
        "כתיבה ",
        "הלחנה ",
        "ניהול ",
        "תנועה:",
        "עבודה קולית",
        "מערכונים ",
        "דרמטורג",
        "במאי:",
        "במאי ",
        "כותב:",
        "כותב ",
        "מילים:",
        "מילים ",
        "לחן:",
        "לחן ",
        "מוזיקה:",
        "מוזיקה ",
        "תלבושות:",
        "תלבושות ",
        "ליווי אמנותי",
        "ליווי אומנותי",
        "הביקורות",
        "זוכת פרס",
        "זוכה פרס",
      ];

      let endIdx = castText.length;
      for (const marker of endMarkers) {
        const idx = castText.indexOf(marker);
        if (idx !== -1 && idx < endIdx) endIdx = idx;
      }

      const dblNewline = castText.indexOf("\n\n");
      if (dblNewline !== -1 && dblNewline < endIdx) endIdx = dblNewline;

      castText = castText.slice(0, endIdx).trim();
      castText = castText.replace(/\n+/g, ", ");
      castText = castText.replace(/,\s*,/g, ",");
      castText = castText.replace(/\s{2,}/g, " ");
      castText = castText.trim();
      castText = castText.replace(/,\s*$/, "").trim();
      castText = castText.replace(/[.\s]+$/, "").trim();

      const creditRoles = [
        "בימוי",
        "עיצוב",
        "תפאורה",
        "תלבושות",
        "יוזמה",
        "הפקה",
        "סאונד",
        "כוריאוגרפיה",
        "דרמטורגיה",
      ];
      let changed = true;
      while (changed) {
        changed = false;
        for (const role of creditRoles) {
          if (castText.endsWith(role) || castText.endsWith(role + " ו")) {
            const suffix = castText.endsWith(role + " ו") ? role + " ו" : role;
            castText = castText
              .slice(0, -suffix.length)
              .trim()
              .replace(/,\s*$/, "")
              .trim();
            changed = true;
          }
        }
        if (castText.endsWith(" ו")) {
          castText = castText.slice(0, -2).trim().replace(/,\s*$/, "").trim();
          changed = true;
        }
      }

      return castText;
    });

    return cast || null;
  } finally {
    await page.close();
  }
}
