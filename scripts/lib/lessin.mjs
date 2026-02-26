/**
 * Beit Lessin Theatre scraping helpers — show listing and show detail extraction.
 *
 * Centralises all Beit Lessin-specific scraping logic so it can be
 * imported by any script that needs it.
 */

import { fixDoubleProtocol, extractImageFromPage } from "./image.mjs";
import { setupRequestInterception } from "./browser.mjs";

// ── Constants ──────────────────────────────────────────────────

export const LESSIN_THEATRE = "תיאטרון בית ליסין";
export const LESSIN_BASE = "https://www.lessin.co.il";
export const SHOWS_URL = "https://www.lessin.co.il/";

// ── Duration parser ────────────────────────────────────────────

/**
 * Parse a Hebrew textual duration string into minutes.
 *
 * Handles both numeric forms ("90 דקות") and textual forms
 * ("כשעה וחצי", "שעה ו-25 דקות", "כשעתיים", etc.).
 *
 * @param {string | null} text  Raw text after "משך ההצגה:"
 * @returns {number | null}     Duration in minutes, or null if unparsable
 */
export function parseLessinDuration(text) {
  if (!text) return null;

  // Try plain numeric form first: "90 דקות" / "120 דקות"
  const numericMatch = text.match(/(\d+)\s*דקות/);
  if (numericMatch) {
    return parseInt(numericMatch[1], 10);
  }

  // Textual minute words → numeric values
  const wordToMinutes = {
    עשר: 10,
    עשרים: 20,
    חצי: 30,
    שלושים: 30,
    רבע: 15,
    ארבעים: 40,
    חמישים: 50,
  };

  let hours = 0;
  let minutes = 0;

  // Detect hour base
  if (/שעתיים/.test(text)) {
    hours = 2;
  } else if (/שעה/.test(text)) {
    hours = 1;
  }

  if (hours === 0) return null;

  minutes = hours * 60;

  // Check for added textual minutes after the hour base
  // e.g. "כשעה וחצי", "כשעה ורבע", "כשעה וחמישים", "שעה ו-25 דקות"
  const afterHour = text.replace(/.*שעתיים|.*שעה/, "").trim();

  if (!afterHour || afterHour === text) {
    // No additional minutes — just the hour base
    return minutes;
  }

  // Try numeric addition: "ו-25 דקות" / "ו25 דקות"
  const addedNumeric = afterHour.match(/(\d+)/);
  if (addedNumeric) {
    return minutes + parseInt(addedNumeric[1], 10);
  }

  // Try textual addition
  for (const [word, value] of Object.entries(wordToMinutes)) {
    if (afterHour.includes(word)) {
      return minutes + value;
    }
  }

  // Hour base only (no parsable addition)
  return minutes;
}

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
      if (!map.has(title)) {
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

  await page.close();
  return data;
}
