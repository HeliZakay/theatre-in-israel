/**
 * Gesher Theatre (תיאטרון גשר) scraping helpers — repertoire listing
 * and show detail extraction.
 *
 * Centralises all Gesher-specific scraping logic so it can be
 * imported by any script that needs it.
 *
 * Listing pattern: Pattern B (h2 + parent walk).
 * The repertoire page lists shows as cards with h2 headings and
 * separate `a[href*="/repertoire/a/view/"]` links.
 *
 * Duration format: Hebrew textual (e.g. "כשעתיים כולל הפסקה",
 * "שעה ו-40 דקות ללא הפסקה") — reuses the Lessin duration parser.
 *
 * Description: extracted from the `#body` div on the detail page,
 * with tagline from `#Summary h4` prepended.
 *
 * Image: og:image meta tag (malformed double-protocol URL fixed by
 * `fixDoubleProtocol`).
 */

import { fixDoubleProtocol, extractImageFromPage } from "./image.mjs";
import { setupRequestInterception } from "./browser.mjs";
import { parseLessinDuration } from "./duration.js";

// ── Constants ──────────────────────────────────────────────────

export const GESHER_THEATRE = "תיאטרון גשר";
export const GESHER_BASE = "https://www.gesher-theatre.co.il";
export const REPERTOIRE_URL =
  "https://www.gesher-theatre.co.il/he/repertoire/a/shows/";

// ── Repertoire page scraper ────────────────────────────────────

/**
 * Scrape the Gesher repertoire page.
 * Returns an array of `{ title, url }` with deduplicated titles,
 * sorted alphabetically in Hebrew.
 *
 * Uses Pattern B (h2 + parent walk): show titles live in `<h2>`
 * elements; for each h2 we walk up the DOM to find the nearest
 * `<a>` whose href matches `/repertoire/a/view/`.
 *
 * @param {import("puppeteer").Browser} browser
 * @returns {Promise<Array<{ title: string, url: string }>>}
 */
export async function fetchShows(browser) {
  const page = await browser.newPage();
  await setupRequestInterception(page);

  await page.goto(REPERTOIRE_URL, {
    waitUntil: "networkidle2",
    timeout: 60_000,
  });
  await page.waitForSelector('a[href*="/repertoire/a/view/"]', {
    timeout: 30_000,
  });

  const shows = await page.evaluate((base) => {
    const map = new Map();

    // Non-show h2 texts to skip
    const skipTexts = new Set([
      "הצגות קרובות",
      "הצגות נוספות שאולי יעניינו אותך",
      "ביקורות",
      "יוצרים",
      "שחקנים",
      "לפרטים ורכישה",
      "לצפייה בטריילר",
      "דלג לתוכן",
      "דלג לסרגל הניווט",
    ]);

    const headings = document.querySelectorAll("h2");

    for (const h2 of headings) {
      let title = h2.textContent.trim();
      if (!title) continue;
      title = title.replace(/\s+/g, " ").trim();

      if (skipTexts.has(title) || title.length < 2) continue;

      // Walk up to find a parent container with a show link
      let container = h2.parentElement;
      let link = null;
      for (let i = 0; i < 5 && container; i++) {
        link = container.querySelector('a[href*="/repertoire/a/view/"]');
        if (link) break;
        container = container.parentElement;
      }

      if (!link) continue;

      const href = link.getAttribute("href") || "";
      if (!href.includes("/repertoire/a/view/")) continue;

      const url = href.startsWith("http") ? href : `${base}${href}`;

      if (!map.has(title)) {
        map.set(title, url);
      }
    }

    // Fallback: collect any /repertoire/a/view/ links not yet captured
    const allLinks = document.querySelectorAll(
      'a[href*="/repertoire/a/view/"]',
    );
    for (const a of allLinks) {
      const href = a.getAttribute("href") || "";
      if (!href.includes("/repertoire/a/view/")) continue;

      const url = href.startsWith("http") ? href : `${base}${href}`;

      const existingUrls = new Set([...map.values()]);
      if (existingUrls.has(url)) continue;

      // Try to find a title from a nearby h2
      let container = a.parentElement;
      let h2 = null;
      for (let i = 0; i < 5 && container; i++) {
        h2 = container.querySelector("h2");
        if (h2) break;
        container = container.parentElement;
      }

      if (h2) {
        let title = h2.textContent.trim().replace(/\s+/g, " ");
        if (title && title.length >= 2 && !map.has(title)) {
          map.set(title, url);
        }
      }
    }

    return [...map.entries()].map(([title, url]) => ({ title, url }));
  }, GESHER_BASE);

  await page.close();
  return shows.sort((a, b) => a.title.localeCompare(b.title, "he"));
}

// ── Detail page scraper ────────────────────────────────────────

/**
 * Scrape a single Gesher show detail page.
 * Returns `{ title, durationMinutes, description, imageUrl }`.
 *
 * Page structure:
 *   h1            — show title
 *   #Summary h4   — short tagline (e.g. "מאת חנוך לוין")
 *   #body         — description paragraphs + duration/premiere at end
 *   .showTeam     — creators & cast (stop marker)
 *
 * Duration appears as free-text Hebrew inside a `<strong>` in #body:
 *   "משך ההצגה: כשעתיים כולל הפסקה"
 *   "משך ההצגה: שעה ו-40 דקות ללא הפסקה"
 *
 * @param {import("puppeteer").Browser} browser
 * @param {string} url
 * @returns {Promise<{ title: string, durationMinutes: number|null, description: string, imageUrl: string|null }>}
 */
export async function scrapeShowDetails(browser, url) {
  const page = await browser.newPage();
  await setupRequestInterception(page, { allowImages: true });

  await page.goto(url, { waitUntil: "networkidle2", timeout: 60_000 });
  await page.waitForSelector("h1", { timeout: 30_000 });

  const data = await page.evaluate(() => {
    // ── Title ──
    const h1 = document.querySelector("h1");
    let title = h1 ? h1.textContent.trim() : "";
    title = title
      .replace(/\n+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();

    // ── Tagline from #Summary h4 ──
    const summaryEl = document.querySelector("#Summary h4");
    const tagline = summaryEl ? summaryEl.textContent.trim() : "";

    // ── Description from #body ──
    const bodyEl = document.querySelector("#body");
    let bodyText = bodyEl ? bodyEl.innerText.trim() : "";

    // ── Duration text (extract before cleaning from description) ──
    let durationText = null;
    const durationMatch = bodyText.match(/משך ההצגה:\s*([^\n]+)/);
    if (durationMatch) {
      durationText = durationMatch[1].trim();
    }

    // Strip duration, premiere, and promotional lines from description
    bodyText = bodyText
      .replace(/משך ההצגה:[^\n]*/g, "")
      .replace(/הצגה ראשונה[^\n]*/g, "")
      .replace(/בכורה[^\n]*/g, "")
      .replace(/ההצגה\s*"[^"]*"\s*מתקיימת\s+ב[^\n]*/g, "")
      .replace(/ההצגה מתקיימת\s+ב[^\n]*/g, "")
      .replace(/\*צילום:[^\n]*/g, "")
      .replace(/^\*[^\n]*$/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    // If no #body content, fall back to body.innerText with stop markers
    if (!bodyText) {
      const body = document.body.innerText;
      const stopMarkers = [
        "ביקורות",
        "יוצרים",
        "שחקנים",
        "הצגות נוספות",
        "הצגות קרובות",
        "משך ההצגה",
      ];

      const titleIdx = body.indexOf(title);
      if (titleIdx !== -1) {
        let rest = body.slice(titleIdx + title.length).trim();
        let endIdx = rest.length;
        for (const marker of stopMarkers) {
          const idx = rest.indexOf(marker);
          if (idx !== -1 && idx < endIdx) endIdx = idx;
        }
        bodyText = rest.slice(0, endIdx).trim();
      }
    }

    // Combine tagline + body for a richer description
    let description = "";
    if (tagline && bodyText) {
      description = `${tagline}\n\n${bodyText}`;
    } else {
      description = tagline || bodyText;
    }

    return { title, durationText, description };
  });

  // Parse duration in Node context using the shared Hebrew parser
  data.durationMinutes = parseLessinDuration(data.durationText);
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
