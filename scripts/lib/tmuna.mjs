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
    waitUntil: "networkidle2",
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

  await page.goto(url, { waitUntil: "networkidle2", timeout: 60_000 });
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

    // Clean cast text
    if (cast) {
      cast = cast.replace(/[.\u200F\u200E]+$/, ""); // trailing period / bidi marks
      cast = cast.replace(/\s{2,}/g, " ").trim();
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
