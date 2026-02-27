/**
 * Khan Theatre (תיאטרון החאן) scraping helpers — show listing and
 * detail extraction.
 *
 * Centralises all Khan-specific scraping logic so it can be
 * imported by any script that needs it.
 *
 * Listing page: https://www.khan.co.il/shows
 *   - Each show is an <article data-group="showsGroups"> card
 *   - Show links live in `.article-body h2 a[href*="/shows/"]`
 *   - Titles are clean but may carry prefixes like
 *     "תיאטרון החאן מציג - " or "תיאטרון החאן מארח - "
 *
 * Detail page structure:
 *   - Title:       h1.line-title
 *   - Description: div.lego-col paragraphs after an "על ההצגה" section
 *   - Duration:    textual Hebrew inside description (e.g. "כשעה וארבעים")
 *   - Image:       og:image meta tag (filter out default_vertical.jpg)
 */

import { fixDoubleProtocol, extractImageFromPage } from "./image.mjs";
import { setupRequestInterception } from "./browser.mjs";
import { parseLessinDuration } from "./duration.js";

// ── Constants ──────────────────────────────────────────────────

export const KHAN_THEATRE = "תיאטרון החאן";
export const KHAN_BASE = "https://www.khan.co.il";
export const SHOWS_URL = "https://www.khan.co.il/shows";

// ── Title prefixes to strip ────────────────────────────────────

const TITLE_PREFIXES = [
  /^תיאטרון החאן מציג\s*[-–—]\s*/,
  /^תיאטרון החאן מארח\s*[-–—]\s*/,
];

/**
 * Strip known theatre-specific prefixes from a show title.
 * @param {string} title
 * @returns {string}
 */
function cleanTitle(title) {
  let cleaned = title;
  for (const re of TITLE_PREFIXES) {
    cleaned = cleaned.replace(re, "");
  }
  return cleaned.trim();
}

// ── Non-show title blocklist ───────────────────────────────────

const NON_SHOW_TITLES = ["עונת המנויים"];

// ── Listing page scraper ───────────────────────────────────────

/**
 * Scrape the Khan Theatre shows page.
 * Returns an array of `{ title, url }` with deduplicated titles,
 * sorted alphabetically in Hebrew.
 *
 * Uses Pattern A (direct link scraping) — the /shows page lists each
 * show once as an <article> card with a clean title in the h2 link.
 *
 * @param {import("puppeteer").Browser} browser
 * @returns {Promise<Array<{ title: string, url: string }>>}
 */
export async function fetchShows(browser) {
  const page = await browser.newPage();
  await setupRequestInterception(page);

  await page.goto(SHOWS_URL, {
    waitUntil: "networkidle2",
    timeout: 60_000,
  });
  await page.waitForSelector('a[href*="/shows/"]', { timeout: 30_000 });

  const shows = await page.evaluate((base) => {
    const titleMap = new Map(); // title → url (deduplicate by title)

    document
      .querySelectorAll('.article-body h2 a[href*="/shows/"]')
      .forEach((a) => {
        let text = a.textContent.trim();
        if (!text || text.length < 2) return;
        text = text.replace(/\s+/g, " ").trim();

        const href = a.getAttribute("href") || "";
        const url = href.startsWith("http") ? href : `${base}${href}`;

        if (!titleMap.has(text)) {
          titleMap.set(text, url);
        }
      });

    return [...titleMap.entries()].map(([title, url]) => ({ title, url }));
  }, KHAN_BASE);

  await page.close();

  // Clean titles and filter non-show entries outside the browser context
  const cleaned = shows
    .map((s) => ({ ...s, title: cleanTitle(s.title) }))
    .filter((s) => !NON_SHOW_TITLES.includes(s.title));

  return cleaned.sort((a, b) => a.title.localeCompare(b.title, "he"));
}

// ── Detail page scraper ────────────────────────────────────────

/**
 * Scrape a single Khan Theatre show detail page.
 * Returns `{ title, durationMinutes, description, imageUrl }`.
 *
 * Duration is in textual Hebrew (e.g. "כשעה וארבעים"), parsed with
 * the shared `parseLessinDuration` utility outside the browser context.
 *
 * @param {import("puppeteer").Browser} browser
 * @param {string} url
 * @returns {Promise<{ title: string, durationMinutes: number | null, description: string, imageUrl: string | null }>}
 */
export async function scrapeShowDetails(browser, url) {
  const page = await browser.newPage();
  await setupRequestInterception(page, { allowImages: true });

  await page.goto(url, { waitUntil: "networkidle2", timeout: 60_000 });
  await page.waitForSelector("h1", { timeout: 30_000 });

  const data = await page.evaluate(() => {
    // ── Title ──
    const h1 =
      document.querySelector("h1.line-title") || document.querySelector("h1");
    let title = h1 ? h1.textContent.trim() : "";
    title = title
      .replace(/\n+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();

    const body = document.body.innerText;

    // ── Duration ──
    // Khan uses textual Hebrew durations (e.g. "כשעה וארבעים (ללא הפסקה)").
    // Extract the raw text; actual parsing happens in Node with parseLessinDuration.
    let durationText = null;
    const durationMatch = body.match(/משך ההצגה:?\s*([^\n]+)/);
    if (durationMatch) {
      durationText = durationMatch[1].trim();
    }

    // ── Description ──
    let description = "";
    const startMarker = "על ההצגה";
    const stopMarkers = [
      "משך ההצגה",
      "הצגה ראשונה",
      "תפאורה:",
      "הפקת מקור:",
      "תאורה:",
      "עיצוב תלבושות:",
      "עיצוב במה:",
      "לבוש:",
      "מוזיקה:",
      "כוריאוגרפיה:",
      "עיצוב תנועה:",
      "עיצוב אור:",
      "עיצוב שיער ואיפור:",
      "הפקה:",
      "בימוי:",
      "עיבוד:",
      "תרגום:",
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

      // Strip leading title repetition(s)
      while (description.startsWith(title) && title.length > 0) {
        description = description.slice(title.length).trim();
      }

      // Clean up
      description = description.replace(/\*צילום:.*$/gm, "");
      description = description.replace(/צילום:.*$/gm, "");
      description = description.replace(/^\*[^\n]*$/gm, "");
      description = description.replace(/\n{3,}/g, "\n\n").trim();
    }

    // Fallback: extract text after the h1 title
    if (!description && title) {
      const titleIdx = body.indexOf(title);
      if (titleIdx !== -1) {
        let rest = body.slice(titleIdx + title.length).trim();

        const fallbackStops = [
          "משך ההצגה",
          "הצגה ראשונה",
          "תפאורה:",
          "הפקת מקור:",
          "תאורה:",
          "עיצוב תלבושות:",
          "בימוי:",
          "לפרטים ורכישה",
          "הצגות נוספות",
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

    return { title, durationMinutes: null, durationText, description };
  });

  // ── Cast extraction ──
  const cast = await page.evaluate(() => {
    const body = document.body.innerText;
    const creditLabels = [
      "בימוי:",
      "עיבוד:",
      "תרגום:",
      "תפאורה:",
      "תאורה:",
      "עיצוב תלבושות:",
      "עיצוב במה:",
      "לבוש:",
      "מוזיקה:",
      "כוריאוגרפיה:",
      "עיצוב תנועה:",
      "עיצוב אור:",
      "עיצוב שיער ואיפור:",
      "הפקה:",
      "הפקת מקור:",
      "משחק:",
      "שחקנים:",
      "בהשתתפות:",
    ];

    // Find the first credit label in the body text
    let firstIdx = body.length;
    for (const label of creditLabels) {
      const i = body.indexOf(label);
      if (i !== -1 && i < firstIdx) firstIdx = i;
    }
    if (firstIdx === body.length) return null;

    // Take the block of text starting from the first credit label
    let rest = body.slice(firstIdx);

    // Stop at footer / unrelated sections
    const footerStops = [
      "לפרטים ורכישה",
      "הצגות נוספות",
      "כל הזכויות",
      "תיאטרון החאן",
    ];
    let endIdx = rest.length;
    for (const stop of footerStops) {
      const i = rest.indexOf(stop);
      if (i !== -1 && i < endIdx) endIdx = i;
    }

    rest = rest.slice(0, endIdx).trim();

    // Keep only lines that look like "role: name" credit lines
    const lines = rest
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const creditLines = lines.filter((line) =>
      creditLabels.some((label) => line.startsWith(label)),
    );

    return creditLines.length > 0 ? creditLines.join("\n") : null;
  });
  data.cast = cast;

  // ── Parse textual duration outside the browser context ──
  if (data.durationText) {
    data.durationMinutes = parseLessinDuration(data.durationText);
  }
  delete data.durationText;

  // ── Title cleanup (strip theatre prefixes) ──
  data.title = cleanTitle(data.title);

  // ── Image URL (using shared extraction logic) ──
  const imageUrl = await page.evaluate(extractImageFromPage);

  // Filter out the default placeholder image
  if (imageUrl && !imageUrl.includes("default_vertical")) {
    data.imageUrl = fixDoubleProtocol(imageUrl);
  } else {
    data.imageUrl = null;
  }

  await page.close();
  return data;
}
