/**
 * Hasimta Theatre scraping helpers — show listing and show detail extraction.
 *
 * תיאטרון הסימטה is a theatre in Old Jaffa (יפו העתיקה).
 * Website built on WordPress + Elementor + JetEngine, with shows
 * as a custom post type and ticketing via EventBuzz (eventbuzz.co.il).
 *
 * Listing: WordPress REST API at /wp-json/wp/v2/shows?show-type=23
 * (show-type 23 = הצגות / plays — excludes jazz and ensemble).
 *
 * Detail pages: /shows/{hebrew-slug}/ with dates in DD/M/YY format,
 * ticket links to eventbuzz.co.il, and credits in <strong>label:</strong> format.
 */

import { setupRequestInterception } from "./browser.mjs";
import { fixDoubleProtocol } from "./image.mjs";
import { parseLessinDuration } from "./duration.mjs";

// ── Constants ──────────────────────────────────────────────────

export const HASIMTA_THEATRE = "תיאטרון הסימטה";
const API_URL =
  "https://hasimta.com/wp-json/wp/v2/shows?show-type=23&per_page=100";

// ── HTML entity decoding ────────────────────────────────────────

const ENTITIES = {
  "&amp;": "&",
  "&#038;": "&",
  "&#8211;": "–",
  "&#8212;": "—",
  "&#8216;": "\u2018",
  "&#8217;": "\u2019",
  "&#8220;": "\u201C",
  "&#8221;": "\u201D",
  "&quot;": '"',
  "&#039;": "'",
  "&lt;": "<",
  "&gt;": ">",
};

function decodeEntities(html) {
  if (!html) return "";
  return html.replace(/&#?\w+;/g, (m) => ENTITIES[m] || m);
}

// ── Shows listing ───────────────────────────────────────────────

/**
 * Fetch the list of current plays from the Hasimta Theatre website.
 *
 * Uses the WordPress REST API to get all shows with show-type=23 (הצגות).
 *
 * @param {import('puppeteer').Browser} _browser — unused (API-based listing)
 * @returns {Promise<Array<{title: string, url: string}>>}
 */
export async function fetchListing(_browser) {
  const res = await fetch(API_URL);
  const shows = await res.json();

  return shows
    .filter((s) => s.status === "publish")
    .map((s) => ({
      title: decodeEntities(
        typeof s.title === "object" ? s.title.rendered : s.title,
      ),
      url: s.link,
    }))
    .sort((a, b) => a.title.localeCompare(b.title, "he"));
}

// ── Credit markers ──────────────────────────────────────────────

const CREDIT_PREFIXES = [
  "מחזה:",
  "כתיבה:",
  "בימוי:",
  "בימוי ודרמטורגיה:",
  "דרמטורגיה:",
  "שחקנים:",
  "בהשתתפות:",
  "בכיכוב:",
  "משחק:",
  "תאורה:",
  "תפאורה:",
  "תלבושות:",
  "מוסיקה:",
  "עיצוב תאורה:",
  "עיצוב סאונד:",
  "עיצוב תפאורה:",
  "עיצוב תלבושות:",
  "עיצוב תפאורה ותלבושות:",
  "עיצוב במה:",
  "כוריאוגרפיה:",
  "הפקה:",
  "ניהול הפקה:",
  "תודות מיוחדות:",
  "צילום:",
  "עיבוד:",
  "תרגום:",
  "ייעוץ:",
  "לחנים:",
  "ניהול מוסיקלי:",
  "עוזרת בימוי:",
  "עוזר בימוי:",
  "מנהל במה:",
  "וידאו אמנות:",
];

const CAST_MARKERS = [
  "שחקנים:",
  "שחקניות:",
  "שחקנים/ות:",
  "בהשתתפות:",
  "בכיכוב:",
  "משחק:",
];

// ── Detail page scraper ────────────────────────────────────────

/**
 * Scrape show details (title, duration, description, image, cast)
 * from a Hasimta Theatre detail page.
 *
 * @param {import('puppeteer').Browser} browser
 * @param {string} url
 * @returns {Promise<{title: string, durationMinutes: number|null, description: string, imageUrl: string|null, cast: string|null}>}
 */
export async function scrapeShowDetails(browser, url) {
  const page = await browser.newPage();
  await setupRequestInterception(page, { allowImages: true });

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector("h1", { timeout: 30_000 });

  // Small delay for Elementor client-side rendering to settle
  await new Promise((r) => setTimeout(r, 1500));

  const data = await page.evaluate(
    (creditPrefixes, castMarkers) => {
      // ── Title ──
      const h1 = document.querySelector("h1");
      const title = h1 ? h1.textContent.trim().replace(/\s+/g, " ") : "";

      // ── Duration (raw text) ──
      let rawDuration = null;
      const bodyText = document.body.innerText;
      const durMatch = bodyText.match(/משך ההצגה:\s*(.+?)(?:\n|$)/);
      if (durMatch) {
        rawDuration = durMatch[1]
          .replace(/כולל הפסקה\.?/, "")
          .replace(/ללא הפסקה\.?/, "")
          .replace(/בערך/, "")
          .replace(/\.\s*$/, "")
          .trim();
      }

      // ── Description ──
      const allPs = [...document.querySelectorAll("p")];
      const descParts = [];

      for (const p of allPs) {
        const text = p.textContent.trim();
        if (!text || text.length < 20) continue;
        if (p.closest("nav") || p.closest("footer") || p.closest("header"))
          continue;
        // Skip duration lines
        if (text.includes("משך ההצגה:")) continue;
        // Skip date/time lines
        if (/^\d{1,2}\/\d{1,2}\/\d{2}/.test(text)) continue;
        // Skip purchase/ticket lines
        if (text.includes("רכישה") || text.includes("לרכישת כרטיסים")) continue;
        if (text.includes("eventbuzz")) continue;
        // Skip credit lines (starts with <strong>label:</strong>)
        const firstStrong = p.querySelector("strong");
        if (firstStrong) {
          const strongText = firstStrong.textContent.trim();
          if (
            creditPrefixes.some((prefix) =>
              strongText.startsWith(prefix.replace(":", "")),
            )
          )
            continue;
        }
        // Skip lines that are just credit text
        if (creditPrefixes.some((prefix) => text.startsWith(prefix))) continue;
        // Skip cookie/tracking text
        if (text.includes("עוגיות") && text.includes("מדיניות")) continue;

        descParts.push(text.replace(/\s+/g, " ").trim());
      }
      const description = descParts.join("\n\n");

      // ── Cast ──
      let cast = null;
      for (const marker of castMarkers) {
        const idx = bodyText.indexOf(marker);
        if (idx === -1) continue;

        let raw = bodyText.slice(idx + marker.length).trim();

        // Stop at the next credit label, double-newline, or single newline
        let endIdx = raw.length;
        for (const prefix of creditPrefixes) {
          const pi = raw.indexOf(prefix);
          if (pi !== -1 && pi < endIdx) endIdx = pi;
        }
        const dblNewline = raw.indexOf("\n\n");
        if (dblNewline !== -1 && dblNewline < endIdx) endIdx = dblNewline;
        const singleNewline = raw.indexOf("\n");
        if (singleNewline !== -1 && singleNewline < endIdx)
          endIdx = singleNewline;

        cast = raw.slice(0, endIdx).trim();
        cast = cast.replace(/[.\u200F\u200E]+$/, "").trim();
        cast = cast.replace(/,\s*$/, "").trim();
        if (cast) break;
        cast = null;
      }

      // ── Image ──
      let imageUrl = null;

      // Strategy 1: og:image
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) {
        const content = ogImage.getAttribute("content");
        if (content && content.startsWith("http")) imageUrl = content;
      }

      // Strategy 2: CSS background-image with wp-content/uploads
      if (!imageUrl) {
        const styledEls = document.querySelectorAll(
          '[style*="background-image"]',
        );
        for (const el of styledEls) {
          const style = el.getAttribute("style") || "";
          const match = style.match(
            /background-image:\s*url\(["']?(.*?)["']?\)/,
          );
          if (!match) continue;
          const src = match[1];
          if (!src.includes("wp-content/uploads")) continue;
          if (/logo|icon/i.test(src)) continue;
          imageUrl = src;
          break;
        }
      }

      // Strategy 3: large <img> in content area
      if (!imageUrl) {
        const imgs = document.querySelectorAll("img");
        for (const img of imgs) {
          const src = img.src || "";
          if (!src.includes("wp-content/uploads")) continue;
          if (/logo|icon/i.test(src)) continue;
          if (img.closest("nav") || img.closest("footer")) continue;
          const rect = img.getBoundingClientRect();
          if (rect.width > 200 && rect.height > 150) {
            imageUrl = src;
            break;
          }
        }
      }

      return { title, rawDuration, description, imageUrl, cast };
    },
    CREDIT_PREFIXES,
    CAST_MARKERS,
  );

  await page.close();

  const durationMinutes = parseLessinDuration(data.rawDuration);
  const imageUrl = data.imageUrl ? fixDoubleProtocol(data.imageUrl) : null;

  return {
    title: data.title,
    durationMinutes,
    description: data.description,
    imageUrl,
    cast: data.cast,
  };
}

// ── Event scraper ──────────────────────────────────────────────

/**
 * Scrape performance dates/times from a Hasimta Theatre show detail page.
 *
 * Dates are displayed as plain text in DD/M/YY format with HH:MM times.
 * Ticket links go to eventbuzz.co.il, one per date.
 *
 * @param {import('puppeteer').Browser} browser
 * @param {string} url
 * @param {{ debug?: boolean }} [opts]
 * @returns {Promise<{ events: Array<{ date: string, hour: string, ticketUrl?: string }>, title: string, debugHtml?: string }>}
 */
export async function scrapeShowEvents(browser, url, opts = {}) {
  const { debug } = opts;
  const page = await browser.newPage();
  await setupRequestInterception(page);

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector("h1", { timeout: 30_000 });

  // Wait for Elementor content to render
  await new Promise((r) => setTimeout(r, 1500));

  const raw = await page.evaluate(() => {
    const title =
      document.querySelector("h1")?.textContent.trim().replace(/\s+/g, " ") ||
      "";
    const bodyText = document.body.innerText;

    // Find all date+time groups: DD/M/YY followed by HH:MM
    const dateTimeRegex =
      /(\d{1,2})\/(\d{1,2})\/(\d{2})\s*\n?\s*(\d{1,2}:\d{2})/g;
    const dateMatches = [];
    let m;
    while ((m = dateTimeRegex.exec(bodyText)) !== null) {
      dateMatches.push({
        day: parseInt(m[1], 10),
        month: parseInt(m[2], 10),
        year: 2000 + parseInt(m[3], 10),
        hour: m[4],
      });
    }

    // Find all eventbuzz ticket links (preserving DOM order)
    const ticketLinks = [
      ...document.querySelectorAll('a[href*="eventbuzz.co.il"]'),
    ].map((a) => a.href);

    let debugHtml = null;
    if (dateMatches.length === 0) {
      debugHtml = document.body.innerHTML.slice(0, 5000);
    }

    return { title, dateMatches, ticketLinks, debugHtml };
  });

  await page.close();

  const seen = new Set();
  const events = [];

  for (let i = 0; i < raw.dateMatches.length; i++) {
    const { day, month, year, hour } = raw.dateMatches[i];
    const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const ticketUrl = raw.ticketLinks[i] || undefined;

    const key = `${date}|${hour}`;
    if (seen.has(key)) continue;
    seen.add(key);

    events.push({ date, hour, ...(ticketUrl ? { ticketUrl } : {}) });
  }

  return {
    events,
    title: raw.title,
    ...(debug && raw.debugHtml ? { debugHtml: raw.debugHtml } : {}),
  };
}
