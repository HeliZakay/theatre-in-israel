/**
 * Cameri Theatre scraping helpers — schedule listing and show detail extraction.
 *
 * Centralises all Cameri-specific scraping logic so it can be
 * imported by any script that needs it.
 */

import { fixDoubleProtocol, extractImageFromPage } from "./image.mjs";
import { setupRequestInterception } from "./browser.mjs";

// ── Re-export shared browser helpers for backward compatibility ─
export { launchBrowser, setupRequestInterception } from "./browser.mjs";

// ── Constants ──────────────────────────────────────────────────

export const CAMERI_THEATRE = "תיאטרון הקאמרי";
export const CAMERI_BASE = "https://www.cameri.co.il";
export const SCHEDULE_URL =
  "https://www.cameri.co.il/%D7%9C%D7%95%D7%97_%D7%94%D7%A6%D7%92%D7%95%D7%AA_%D7%9E%D7%9C%D7%90";

// ── Schedule page scraper ──────────────────────────────────────

/**
 * Scrape the Cameri schedule page.
 * Returns an array of `{ title, url }` with deduplicated titles,
 * sorted alphabetically in Hebrew.
 *
 * @param {import("puppeteer").Browser} browser
 * @returns {Promise<Array<{ title: string, url: string }>>}
 */
export async function fetchSchedule(browser) {
  const page = await browser.newPage();
  await setupRequestInterception(page);

  await page.goto(SCHEDULE_URL, { waitUntil: "networkidle2", timeout: 30_000 });
  await page.waitForSelector('a[href*="show_"]', { timeout: 15_000 });

  const shows = await page.evaluate((base) => {
    const map = new Map();
    document.querySelectorAll('a[href*="/show_"]').forEach((a) => {
      let text = a.textContent.trim();
      if (!text) return;
      if (text.includes("לפרטים ותאריכים")) return;
      text = text.replace(/^חדש\s+/, "");

      if (!map.has(text)) {
        const href = a.getAttribute("href") || "";
        const url = href.startsWith("http") ? href : `${base}${href}`;
        map.set(text, url);
      }
    });
    return [...map.entries()].map(([title, url]) => ({ title, url }));
  }, CAMERI_BASE);

  await page.close();
  return shows.sort((a, b) => a.title.localeCompare(b.title, "he"));
}

// ── Detail page scraper ────────────────────────────────────────

/**
 * Scrape a single Cameri show detail page.
 * Returns `{ title, durationMinutes, description, imageUrl }`.
 *
 * @param {import("puppeteer").Browser} browser
 * @param {string} url
 * @returns {Promise<{ title: string, durationMinutes: number | null, description: string, imageUrl: string | null, cast: string | null }>}
 */
export async function scrapeShowDetails(browser, url) {
  const page = await browser.newPage();
  await setupRequestInterception(page, { allowImages: false });

  await page.goto(url, { waitUntil: "networkidle2", timeout: 30_000 });
  await page.waitForSelector("h1", { timeout: 15_000 });

  const data = await page.evaluate((extractImage) => {
    // ── Title ──
    const h1 = document.querySelector("h1");
    let title = h1 ? h1.textContent.trim() : "";
    title = title.replace(/^חדש\s+/, "");

    // ── Duration ──
    let durationMinutes = null;
    const body = document.body.innerText;
    const durationMatch = body.match(/משך ההצגה:\s*(\d+)\s*דקות/);
    if (durationMatch) {
      durationMinutes = parseInt(durationMatch[1], 10);
    }

    // ── Description ──
    let description = "";
    const aboutMarker = "על ההצגה";
    const stopMarkers = ["צוות ושחקנים", "משך ההצגה", "גלריית תמונות"];
    const aboutIdx = body.indexOf(aboutMarker);
    if (aboutIdx !== -1) {
      let rest = body.slice(aboutIdx + aboutMarker.length).trim();
      let endIdx = rest.length;
      for (const marker of stopMarkers) {
        const idx = rest.indexOf(marker);
        if (idx !== -1 && idx < endIdx) endIdx = idx;
      }
      description = rest
        .slice(0, endIdx)
        .trim()
        .replace(/\n{3,}/g, "\n\n")
        .replace(/\*צילום:.*$/gm, "")
        .replace(/^\*[^\n]*$/gm, "")
        .replace(/תכניה/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    }

    // ── Cast ──
    let cast = null;
    const castMarker = "משתתפים";
    const castStopMarkers = ["נגנים", "גלריית תמונות", "ביקורות"];
    const castIdx = body.indexOf(castMarker);
    if (castIdx !== -1) {
      let castRest = body.slice(castIdx + castMarker.length).trim();
      let castEndIdx = castRest.length;
      for (const marker of castStopMarkers) {
        const idx = castRest.indexOf(marker);
        if (idx !== -1 && idx < castEndIdx) castEndIdx = idx;
      }
      const rawCast = castRest.slice(0, castEndIdx).trim();
      if (rawCast) {
        cast = rawCast
          .replace(/\n/g, " ")
          .replace(/\s{2,}/g, " ")
          .replace(/,\s*$/, "")
          .trim();
      }
    }

    // ── Image URL (using shared extraction logic) ──
    const imageUrl = extractImage();

    return { title, durationMinutes, description, imageUrl, cast };
  }, extractImageFromPage);

  // Fix double-protocol URLs outside the browser context
  if (data.imageUrl) {
    data.imageUrl = fixDoubleProtocol(data.imageUrl);
  }

  await page.close();
  return data;
}

/**
 * Scrape only cast data from a Cameri show detail page.
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
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60_000 });
    await page.waitForSelector("h1", { timeout: 30_000 });

    const cast = await page.evaluate(() => {
      const body = document.body.innerText;
      const castMarker = "משתתפים";
      const castStopMarkers = ["נגנים", "גלריית תמונות", "ביקורות"];
      const castIdx = body.indexOf(castMarker);
      if (castIdx === -1) return "";

      let castRest = body.slice(castIdx + castMarker.length).trim();
      let castEndIdx = castRest.length;
      for (const marker of castStopMarkers) {
        const idx = castRest.indexOf(marker);
        if (idx !== -1 && idx < castEndIdx) castEndIdx = idx;
      }
      const rawCast = castRest.slice(0, castEndIdx).trim();
      if (!rawCast) return "";

      return rawCast
        .replace(/\n/g, " ")
        .replace(/\s{2,}/g, " ")
        .replace(/,\s*$/, "")
        .trim();
    });

    return cast || null;
  } finally {
    await page.close();
  }
}
