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

// ── Cast extraction helpers ────────────────────────────────────

/**
 * Crew-role keywords — lines whose left side (role label) contains
 * any of these are crew, not cast.  Shared with Habima; extended
 * with Lessin-specific entries (`מאת`).
 */
const crewKeywords = [
  "מאת",
  "מחזה",
  "בימוי",
  "עיצוב",
  "מוסיקה",
  "תאורה",
  "תלבושות",
  "וידאו",
  "תנועה",
  "קריינות",
  "צילום",
  'עפ"י',
  "ע.במאי",
  "דרמטורג",
  "תרגום",
  "הפקה",
  "כוריאוגרפיה",
  "עריכה",
  "הלחנה",
  "ליווי",
  "עיבוד",
  "פוסטר",
  "לחן",
  "מילים",
  "עיבוד מוסיקלי",
  "ניהול מוסיקלי",
  "עיצוב סאונד",
  "סאונד",
  "הנחיה",
  "ייעוץ",
  "פיקוח",
  "תסריט",
  "עריכת",
  "ניהול",
  "במאי",
  "מעצב",
  "מלחין",
  "מתרגם",
  "כתיבה",
  "תפאורה",
  "קונספט",
  "עוזר",
  "עוזרת",
  "הפקת",
];

// ── Detail page scraper ────────────────────────────────────────

/**
 * Scrape a single Beit Lessin show page for title, duration,
 * description, image, and cast.
 *
 * @param {import('puppeteer').Browser} browser
 * @param {string} url  Full URL of the show page
 * @returns {Promise<{title: string, durationMinutes: number|null, description: string, imageUrl: string|null, cast: string}>}
 */
export async function scrapeShowDetails(browser, url) {
  const page = await browser.newPage();
  await setupRequestInterception(page, { allowImages: true });

  await page.goto(url, { waitUntil: "networkidle2", timeout: 60_000 });
  await page.waitForSelector("h1", { timeout: 30_000 });

  const data = await page.evaluate((_crewKeywords) => {
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
    const descStopMarkers = [
      "יוצרים ושחקנים",
      "משך ההצגה",
      "הביקורות משבחות",
      "מועמדויות",
    ];
    const startIdx = body.indexOf("על ההצגה");
    if (startIdx !== -1) {
      let rest = body.slice(startIdx + "על ההצגה".length).trim();
      let endIdx = rest.length;
      for (const marker of descStopMarkers) {
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

    // ── Cast extraction ──
    // The "יוצרים ושחקנים" section lists role: name pairs.
    // We filter out crew roles and keep only actors.
    let cast = "";
    const castSectionMarkers = ["יוצרים ושחקנים", "יוצרים ומשתתפים"];
    const castStopMarkers = [
      "משך ההצגה",
      "להזמנת מנוי",
      "להורדת התכנייה",
      "קופה וכרטיסים",
      "רוצים לראות עוד",
      "מנויים מקבלים",
    ];

    let castSectionStart = -1;
    for (const marker of castSectionMarkers) {
      const idx = body.indexOf(marker);
      if (idx !== -1) {
        castSectionStart = idx + marker.length;
        break;
      }
    }

    if (castSectionStart !== -1) {
      let castText = body.slice(castSectionStart);

      // Trim at the earliest stop marker
      for (const stop of castStopMarkers) {
        const idx = castText.indexOf(stop);
        if (idx !== -1) castText = castText.slice(0, idx);
      }

      const lines = castText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const actors = [];

      for (const line of lines) {
        if (!line.includes(":") && !line.includes("：")) continue;

        // Split on the LAST colon to handle role names that might contain colons
        const colonIdx = line.lastIndexOf(":");
        if (colonIdx === -1) continue;

        const left = line.slice(0, colonIdx).trim();
        const right = line.slice(colonIdx + 1).trim();

        if (!left || !right) continue;

        // Check if the left side is a crew role
        const isCrew = _crewKeywords.some((kw) => left.includes(kw));
        if (isCrew) continue;

        // right side contains actor name(s), possibly with / for alternates
        // Normalize slash separators: ensure spaces around /
        const cleaned = right
          .replace(/\s*\/\s*/g, " / ")
          .replace(/\s+/g, " ")
          .trim();

        if (cleaned) actors.push(cleaned);
      }

      cast = actors.join(", ");
    }

    return { title, durationText, description, cast };
  }, crewKeywords);

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
