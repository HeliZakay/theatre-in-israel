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

    // ── Cast ──
    const castLinks = [
      ...document.querySelectorAll('a[href*="/ensemble-actors/"]'),
    ];
    const cast = castLinks
      .map((a) => a.textContent.trim())
      .filter((name) => name.length > 0)
      .join(", ");

    return { title, durationMinutes: null, durationText, description, cast };
  });

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

// ── Events scraper ─────────────────────────────────────────────

/**
 * Infer the full year for a DD.MM date string.
 * If the month is in the past relative to today, assume next year.
 *
 * @param {number} day
 * @param {number} month
 * @returns {number} — full year (e.g. 2026)
 */
function inferYear(day, month) {
  const today = new Date();
  const thisYear = today.getFullYear();
  const candidate = new Date(thisYear, month - 1, day);
  // If date has already passed (more than 1 day ago), assume next year
  const oneDayMs = 86_400_000;
  return candidate.getTime() < today.getTime() - oneDayMs
    ? thisYear + 1
    : thisYear;
}

/**
 * Scrape performance dates/times from a Khan Theatre show detail page.
 *
 * Website format per list item:
 *   DD.MM | day-abbrev שעה: HH:MM תיאטרון החאן   [רכישת כרטיסים](ticket-link)
 *
 * Heading marker: "מועדי הצגות"
 * Ticket hrefs: khan.pres.global/order/...
 *
 * @param {import("puppeteer").Browser} browser
 * @param {string} url — show detail page URL
 * @param {{ debug?: boolean }} [options]
 * @returns {Promise<{
 *   events: Array<{ date: string, hour: string, venueName: string, venueCity: string, ticketUrl: string|null, rawText: string }>,
 *   debugHtml?: string
 * }>}
 */
export async function scrapeShowEvents(browser, url, { debug = false } = {}) {
  const page = await browser.newPage();
  await setupRequestInterception(page);

  await page.goto(url, { waitUntil: "networkidle2", timeout: 60_000 });
  await page.waitForSelector("h1", { timeout: 15_000 });

  // Scroll to trigger any lazy-loaded dates section
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let total = 0;
      const step = 400;
      const timer = setInterval(() => {
        window.scrollBy(0, step);
        total += step;
        if (total >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
  await new Promise((r) => setTimeout(r, 2_000));

  const result = await page.evaluate((debugMode) => {
    const output = { events: [], debugHtml: null };
    const events = [];

    const TICKET_RE = /khan\.pres\.global/i;
    // Matches DD.MM format
    const DATE_RE = /(\d{1,2})\.(\d{1,2})/;
    const TIME_RE = /(\d{1,2}:\d{2})/;

    // ── Strategy 1: find ticket links, then walk up to the row ──
    const ticketLinks = [...document.querySelectorAll("a")].filter((a) =>
      TICKET_RE.test(a.getAttribute("href") || ""),
    );

    if (ticketLinks.length > 0) {
      const seenHrefs = new Map();

      for (const a of ticketLinks) {
        const href = a.getAttribute("href") || "";
        if (seenHrefs.has(href)) continue;

        // Walk up to find a container with date + time info
        let row = a.closest("li");
        if (!row) {
          let cur = a.parentElement;
          while (cur && cur !== document.body) {
            const t = cur.textContent || "";
            if (DATE_RE.test(t) && TIME_RE.test(t)) {
              row = cur;
              break;
            }
            cur = cur.parentElement;
          }
        }
        if (!row) continue;
        seenHrefs.set(href, row);
      }

      for (const [href, row] of seenHrefs) {
        const text = row.textContent?.replace(/\s+/g, " ").trim() || "";
        const dateMatch = text.match(DATE_RE);
        const timeMatch = text.match(TIME_RE);
        if (!dateMatch) continue;

        events.push({
          day: parseInt(dateMatch[1], 10),
          month: parseInt(dateMatch[2], 10),
          hour: timeMatch ? timeMatch[1] : "",
          ticketUrl: href || null,
          rawText: text.slice(0, 250),
        });
      }
    }

    // ── Strategy 2: find "מועדי הצגות" heading container ──
    if (events.length === 0) {
      const headings = document.querySelectorAll("h2, h3, h4, h5, .section-title");
      let datesContainer = null;
      for (const h of headings) {
        if (h.textContent.trim().includes("מועדי הצגות")) {
          datesContainer =
            h.closest("section") ||
            h.closest("article") ||
            h.closest("div[class]") ||
            h.parentElement;
          break;
        }
      }

      if (datesContainer) {
        const items = datesContainer.querySelectorAll("li, .performance, [class*='date']");
        for (const el of items) {
          const text = el.textContent?.replace(/\s+/g, " ").trim() || "";
          const dateMatch = text.match(DATE_RE);
          const timeMatch = text.match(TIME_RE);
          if (!dateMatch) continue;

          const link = el.querySelector("a");
          const ticketUrl = link ? link.getAttribute("href") || null : null;

          events.push({
            day: parseInt(dateMatch[1], 10),
            month: parseInt(dateMatch[2], 10),
            hour: timeMatch ? timeMatch[1] : "",
            ticketUrl: ticketUrl && TICKET_RE.test(ticketUrl) ? ticketUrl : null,
            rawText: text.slice(0, 250),
          });
        }
      }
    }

    // ── Strategy 3: full body text regex fallback ──
    if (events.length === 0) {
      const bodyText = document.body.innerText;
      // Matches: DD.MM | day שעה: HH:MM
      const fullRowRe = /(\d{1,2})\.(\d{1,2})\s*\|[^שׁ]*שעה:\s*(\d{1,2}:\d{2})/g;
      let m;
      while ((m = fullRowRe.exec(bodyText)) !== null) {
        events.push({
          day: parseInt(m[1], 10),
          month: parseInt(m[2], 10),
          hour: m[3],
          ticketUrl: null,
          rawText: bodyText
            .slice(Math.max(0, m.index - 5), m.index + m[0].length + 30)
            .trim(),
        });
      }
    }

    // ── Debug output ──
    if (debugMode) {
      const headings = document.querySelectorAll("h2, h3, h4, h5");
      for (const h of headings) {
        if (h.textContent.includes("מועדי הצגות")) {
          const container =
            h.closest("section") || h.closest("div[class]") || h.parentElement;
          output.debugHtml = container
            ? container.innerHTML
            : document.body.innerHTML.slice(-6000);
          break;
        }
      }
      if (!output.debugHtml) {
        output.debugHtml = document.body.innerHTML.slice(-6000);
      }
    }

    output.events = events;
    return output;
  }, debug);

  await page.close();

  // ── Infer years and build final event objects (Node context) ──
  const processed = [];
  const seen = new Map();

  for (const e of result.events) {
    const year = inferYear(e.day, e.month);
    const dateStr = `${year}-${String(e.month).padStart(2, "0")}-${String(e.day).padStart(2, "0")}`;
    const key = e.ticketUrl || `${dateStr}|${e.hour}`;

    if (!seen.has(key)) {
      seen.set(key, true);
      processed.push({
        date: dateStr,
        hour: e.hour,
        venueName: KHAN_THEATRE,
        venueCity: "ירושלים",
        ticketUrl: e.ticketUrl,
        rawText: e.rawText,
      });
    }
  }

  result.events = processed;
  return result;
}

/**
 * Scrape only cast data from a Khan show detail page.
 * Tries ensemble-actors links first, then falls back to inline text.
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

    // Try ensemble-actors links first
    let cast = await page.evaluate(() => {
      const links = [
        ...document.querySelectorAll('a[href*="/ensemble-actors/"]'),
      ];
      return links
        .map((a) => a.textContent.trim())
        .filter((n) => n.length > 0)
        .join(", ");
    });

    // Fallback: check for inline cast in description text
    if (!cast) {
      cast = await page.evaluate(() => {
        const body = document.body.innerText;
        const castMatch = body.match(
          /שחקנים(?:\s+יוצרים)?:\s*([^\n]+(?:\n[^\n]+)?)/,
        );
        if (castMatch) {
          return castMatch[1]
            .replace(/משך ה(?:הצגה|מופע).*$/s, "")
            .replace(/\n/g, ", ")
            .replace(/\s{2,}/g, " ")
            .trim();
        }
        return "";
      });
    }

    return cast || null;
  } finally {
    await page.close();
  }
}
