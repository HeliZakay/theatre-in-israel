/**
 * Beit Lessin Theatre scraping helpers — show listing and show detail extraction.
 *
 * Centralises all Beit Lessin-specific scraping logic so it can be
 * imported by any script that needs it.
 */

import { fixDoubleProtocol, extractImageFromPage } from "./image.mjs";
import { setupRequestInterception } from "./browser.mjs";
import { parseLessinDuration } from "./duration.js";

// Re-export so existing consumers can still import from here
export { parseLessinDuration };

// ── Constants ──────────────────────────────────────────────────

export const LESSIN_THEATRE = "תיאטרון בית ליסין";
export const LESSIN_BASE = "https://www.lessin.co.il";
export const SHOWS_URL = "https://www.lessin.co.il/";

// ── Shows listing page scraper ─────────────────────────────────

/**
 * Fetch the list of current shows from the Beit Lessin main page.
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
  await page.waitForSelector('a[href*="/shows/"]', { timeout: 30_000 });

  const shows = await page.evaluate((base) => {
    const suffixRe = /\s*\((?:הצגות אחרונות|הצגה אורחת)\)\s*$/;
    const map = new Map();

    const headings = document.querySelectorAll("h3");
    for (const h3 of headings) {
      let title = h3.textContent.trim();
      if (!title) continue;
      title = title.replace(/\s+/g, " ").trim();
      if (
        title === "לרכישה" ||
        title === "לתאריכים ורכישה" ||
        title === "רוצים לראות עוד?" ||
        title === "הזמנה מהירה" ||
        title === "GIFT CARD" ||
        title === "לוח הצגות" ||
        title === "אזור אישי" ||
        title === "דלג לתוכן" ||
        title.length < 2
      )
        continue;
      title = title.replace(suffixRe, "").trim();

      let container = h3.parentElement;
      let link = null;
      for (let i = 0; i < 5 && container; i++) {
        link = container.querySelector('a[href*="/shows/"]');
        if (link) break;
        container = container.parentElement;
      }
      if (!link) continue;
      const href = link.getAttribute("href") || "";
      if (!href.includes("/shows/")) continue;
      const url = href.startsWith("http") ? href : `${base}${href}`;
      // Skip if this title is already mapped, or if this URL is already claimed by another title
      const existingUrls = new Set([...map.values()]);
      if (!map.has(title) && !existingUrls.has(url)) {
        map.set(title, url);
      }
    }

    // Fallback: collect any show links not yet captured
    const allLinks = document.querySelectorAll('a[href*="/shows/"]');
    for (const a of allLinks) {
      const href = a.getAttribute("href") || "";
      if (!href.includes("/shows/")) continue;
      const url = href.startsWith("http") ? href : `${base}${href}`;
      const existingUrls = new Set([...map.values()]);
      if (existingUrls.has(url)) continue;

      let container = a.parentElement;
      let h3 = null;
      for (let i = 0; i < 5 && container; i++) {
        h3 = container.querySelector("h3");
        if (h3) break;
        container = container.parentElement;
      }
      if (h3) {
        let title = h3.textContent.trim().replace(/\s+/g, " ");
        title = title.replace(suffixRe, "").trim();
        if (title && title.length >= 2 && !map.has(title)) {
          map.set(title, url);
        }
      }
    }

    return [...map.entries()].map(([title, url]) => ({ title, url }));
  }, LESSIN_BASE);

  await page.close();
  return shows.sort((a, b) => a.title.localeCompare(b.title, "he"));
}

// ── Detail page scraper ────────────────────────────────────────

/**
 * Scrape a single Beit Lessin show page for title, duration,
 * description, and image.
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
    const suffixRe = /\s*\((?:הצגות אחרונות|הצגה אורחת)\)\s*$/;

    const h1 = document.querySelector("h1");
    let title = h1 ? h1.textContent.trim() : "";
    title = title.replace(suffixRe, "").trim();
    title = title
      .replace(/\n+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();

    const body = document.body.innerText;

    // Extract raw duration text for parsing in Node context
    let durationText = null;
    const durationLineMatch = body.match(/משך ההצגה:\s*([^\n]+)/);
    if (durationLineMatch) {
      durationText = durationLineMatch[1].trim();
    }

    // Extract description using "על ההצגה" as start marker
    let description = "";
    const stopMarkers = [
      "יוצרים ושחקנים",
      "משך ההצגה",
      "הביקורות משבחות",
      "מועמדויות",
    ];
    const startIdx = body.indexOf("על ההצגה");
    if (startIdx !== -1) {
      let rest = body.slice(startIdx + "על ההצגה".length).trim();
      let endIdx = rest.length;
      for (const marker of stopMarkers) {
        const idx = rest.indexOf(marker);
        if (idx !== -1 && idx < endIdx) endIdx = idx;
      }
      description = rest.slice(0, endIdx).trim();

      // Clean up photo credits and promotional lines
      description = description.replace(/\*צילום:.*$/gm, "");
      description = description.replace(/צילום פוסטר:.*$/gm, "");
      description = description.replace(/^\*[^\n]*$/gm, "");
      description = description.replace(/לא תותר הכניסה למאחרים[^\n]*/g, "");
      description = description.replace(/מוצג בהסדר עם[^\n]*/g, "");
      description = description.replace(/50 הצגות בלבד[^\n]*/g, "");
      description = description.replace(/\n{3,}/g, "\n\n").trim();
    }

    return { title, durationText, description };
  });

  // Parse duration in Node context
  data.durationMinutes = parseLessinDuration(data.durationText);
  delete data.durationText;

  const imageUrl = await page.evaluate(extractImageFromPage);
  if (imageUrl) {
    data.imageUrl = fixDoubleProtocol(imageUrl);
  } else {
    data.imageUrl = null;
  }

  // ── Cast ──
  data.cast = await page.evaluate(() => {
    const body = document.body.innerText;
    const castMarker = "יוצרים ושחקנים";
    const idx = body.indexOf(castMarker);
    if (idx === -1) return null;

    let rest = body.slice(idx);

    const endMarkers = [
      "משך ההצגה",
      "הביקורות משבחות",
      "מועמדויות",
      "לרכישת כרטיסים",
      "תאריכי הצגות",
    ];
    let endIdx = rest.length;
    for (const marker of endMarkers) {
      const eIdx = rest.indexOf(marker);
      if (eIdx !== -1 && eIdx < endIdx) endIdx = eIdx;
    }

    const castText = rest.slice(0, endIdx).trim();
    return castText || null;
  });

  await page.close();
  return data;
}
