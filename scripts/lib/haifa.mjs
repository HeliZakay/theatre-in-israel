/**
 * Haifa Theatre (תיאטרון חיפה) scraping helpers — schedule listing and
 * show detail extraction.
 *
 * Centralises all Haifa-specific scraping logic so it can be
 * imported by any script that needs it.
 */

import { fixDoubleProtocol, extractImageFromPage } from "./image.mjs";
import { setupRequestInterception } from "./browser.mjs";

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
    waitUntil: "networkidle2",
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
