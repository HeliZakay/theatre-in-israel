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
    waitUntil: "networkidle2",
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

  await page.goto(url, { waitUntil: "networkidle2", timeout: 60_000 });
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
