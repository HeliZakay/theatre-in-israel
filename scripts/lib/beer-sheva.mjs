/**
 * Beer Sheva Theatre scraping helpers — show listing and show detail extraction.
 *
 * Centralises all Beer-Sheva-specific scraping logic so it can be
 * imported by any script that needs it.
 *
 * Site: https://b7t.co.il/ (WordPress + Elementor)
 * Listing page: /show_categories/2025-2026/ (current season)
 * Show URLs pattern: /shows/{slug}/
 * Duration: not available on site (always null)
 * Description: no "על ההצגה" marker — uses title position in body.innerText
 */

import { fixDoubleProtocol, extractImageFromPage } from "./image.mjs";
import { setupRequestInterception } from "./browser.mjs";

// ── Constants ──────────────────────────────────────────────────

export const BEER_SHEVA_THEATRE = "תיאטרון באר שבע";
export const BEER_SHEVA_BASE = "https://b7t.co.il";
export const SHOWS_URL = "https://b7t.co.il/show_categories/2025-2026/";

// ── Shows listing page scraper ─────────────────────────────────

/**
 * Scrape the Beer Sheva Theatre current season page.
 * Returns an array of `{ title, url }` with deduplicated titles,
 * sorted alphabetically in Hebrew.
 *
 * Uses Pattern A (direct link scraping) — titles are inside
 * `<h2 class="elementor-heading-title"><a href="/shows/...">` tags.
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
    const map = new Map();

    // Non-show entries that may appear in listings
    const blocklist = ["סיור מאחורי הקלעים"];

    // Pattern A: direct link scraping from h2 headings
    const links = document.querySelectorAll(
      'h2.elementor-heading-title a[href*="/shows/"]',
    );

    for (const a of links) {
      let title = a.textContent.trim();
      if (!title) continue;
      // Normalize whitespace
      title = title.replace(/\s+/g, " ").trim();

      if (title.length < 2) continue;
      if (blocklist.some((b) => title.includes(b))) continue;

      const href = a.getAttribute("href") || "";
      if (!href.includes("/shows/")) continue;

      const url = href.startsWith("http") ? href : `${base}${href}`;

      if (!map.has(title)) {
        map.set(title, url);
      }
    }

    // Fallback: also check plain a[href*="/shows/"] links not yet captured
    const allLinks = document.querySelectorAll('a[href*="/shows/"]');
    for (const a of allLinks) {
      const href = a.getAttribute("href") || "";
      if (!href.includes("/shows/")) continue;

      const url = href.startsWith("http") ? href : `${base}${href}`;

      const existingUrls = new Set([...map.values()]);
      if (existingUrls.has(url)) continue;

      // Try to find a title from a nearby heading
      let container = a.parentElement;
      let heading = null;
      for (let i = 0; i < 5 && container; i++) {
        heading =
          container.querySelector("h2.elementor-heading-title") ||
          container.querySelector("h2") ||
          container.querySelector("h3");
        if (heading) break;
        container = container.parentElement;
      }

      if (heading) {
        let title = heading.textContent.trim().replace(/\s+/g, " ");
        if (
          title &&
          title.length >= 2 &&
          !map.has(title) &&
          !blocklist.some((b) => title.includes(b))
        ) {
          map.set(title, url);
        }
      }
    }

    return [...map.entries()].map(([title, url]) => ({ title, url }));
  }, BEER_SHEVA_BASE);

  await page.close();
  return shows.sort((a, b) => a.title.localeCompare(b.title, "he"));
}

// ── Detail page scraper ────────────────────────────────────────

/**
 * Scrape a single Beer Sheva Theatre show detail page.
 * Returns `{ title, durationMinutes, description, imageUrl }`.
 *
 * Duration is not available on this site (always null).
 * Description uses title position in body.innerText (no "על ההצגה" marker).
 * Image uses og:image meta tag (via extractImageFromPage).
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
    const h1 = document.querySelector("h1");
    let title = h1 ? h1.textContent.trim() : "";
    // Collapse newlines in multi-line h1 elements to a single space
    title = title
      .replace(/\n+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();

    // ── Duration ──
    // Not available on Beer Sheva Theatre site
    const durationMinutes = null;

    // ── Description ──
    // No "על ההצגה" marker — use title position in body.innerText
    // (same approach as Habima / Hebrew Theatre)
    let description = "";
    const body = document.body.innerText;
    const stopMarkers = [
      "יוצרים",
      "משתתפים",
      "תוכניית ההצגה",
      "רכישת כרטיסים",
      "טריילר",
      "גלרייה",
      "צוות היוצרים",
    ];

    const titleIdx = body.indexOf(title);
    if (titleIdx !== -1) {
      let rest = body.slice(titleIdx + title.length).trim();

      // Find the earliest stop marker
      let endIdx = rest.length;
      for (const marker of stopMarkers) {
        const idx = rest.indexOf(marker);
        if (idx !== -1 && idx < endIdx) endIdx = idx;
      }

      description = rest.slice(0, endIdx).trim();

      // Clean up
      // Remove photo credit lines
      description = description.replace(/\*?צילום:.*$/gm, "");
      description = description.replace(/צילום פוסטר:.*$/gm, "");
      // Remove asterisked lines
      description = description.replace(/^\*[^\n]*$/gm, "");
      // Remove promotional/ticket lines
      description = description.replace(/לרכישת כרטיסים[^\n]*/g, "");
      description = description.replace(/להזמנת כרטיסים[^\n]*/g, "");
      // Collapse excess newlines
      description = description.replace(/\n{3,}/g, "\n\n").trim();
    }

    return { title, durationMinutes, description };
  });

  // ── Cast extraction ──
  const cast = await page.evaluate(() => {
    const body = document.body.innerText;
    const sectionMarkers = ["צוות היוצרים", "יוצרים", "משתתפים"];
    const footerStops = [
      "תוכניית ההצגה",
      "רכישת כרטיסים",
      "טריילר",
      "גלרייה",
      "הצגות נוספות",
    ];

    const parts = [];
    for (const marker of sectionMarkers) {
      const idx = body.indexOf(marker);
      if (idx === -1) continue;

      let rest = body.slice(idx + marker.length).trim();

      // Find the earliest stop (another section marker or footer)
      let endIdx = rest.length;
      for (const stop of [...sectionMarkers, ...footerStops]) {
        const i = rest.indexOf(stop);
        if (i !== -1 && i < endIdx) endIdx = i;
      }

      const text = rest.slice(0, endIdx).trim();
      if (text) parts.push(text);
    }

    return parts.length > 0 ? parts.join("\n") : null;
  });
  data.cast = cast;

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
