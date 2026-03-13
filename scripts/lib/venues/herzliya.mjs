/**
 * Herzliya venue scraper — scrapes events from היכל אמנויות הבמה הרצליה.
 *
 * Site: hoh-herzliya.co.il (Joomla K2)
 * Listing page shows event cards with title links to detail pages.
 * Detail pages list performance dates in Hebrew format:
 *   "שני, 30 מרס 2026" + "18:00" + ticket link
 * No pagination or load-more.
 */

import { setupRequestInterception } from "../browser.mjs";

export const VENUE_NAME = "היכל אמנויות הבמה הרצליה";
export const VENUE_CITY = "הרצליה";
export const LISTING_URL =
  "https://www.hoh-herzliya.co.il/%D7%9E%D7%95%D7%A4%D7%A2%D7%99%D7%9D/%D7%AA%D7%99%D7%90%D7%98%D7%A8%D7%95%D7%9F";

/**
 * Fetch all show listings from the venue's events page.
 * Returns unique detail-page links with cleaned titles.
 *
 * @param {import("puppeteer").Browser} browser
 * @returns {Promise<{ title: string, detailUrl: string }[]>}
 */
export async function fetchListing(browser) {
  const page = await browser.newPage();
  await setupRequestInterception(page);

  await page.goto(LISTING_URL, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  // Wait for event links to appear — use a broad selector first,
  // then narrow in evaluate (WebFetch-reported selectors may differ from real DOM)
  await page
    .waitForSelector("a[href*='/תיאטרון/'], a[href*='/%D7%AA%D7%99%D7%90%D7%98%D7%A8%D7%95%D7%9F/']", { timeout: 15_000 })
    .catch(() => {});

  const listings = await page.evaluate(() => {
    // Match links that go to detail pages: /מופעים/תיאטרון/NNNN-slug
    const DETAIL_RE = /\/(מופעים|%D7%9E%D7%95%D7%A4%D7%A2%D7%99%D7%9D)\/(תיאטרון|%D7%AA%D7%99%D7%90%D7%98%D7%A8%D7%95%D7%9F)\/\d+/i;
    const allLinks = document.querySelectorAll("a[href]");
    const results = [];
    const seen = new Set();

    for (const link of allLinks) {
      const href = link.getAttribute("href") || "";
      if (!DETAIL_RE.test(decodeURIComponent(href))) continue;

      const url = href.startsWith("http")
        ? href
        : new URL(href, location.origin).href;

      if (seen.has(url)) continue;
      seen.add(url);

      // Get title text — try heading first, then link text
      let text = "";
      const heading = link.querySelector("h1, h2, h3, h4, h5, h6");
      if (heading) {
        text = heading.textContent?.trim() || "";
      }
      if (!text) {
        // Try image alt as fallback
        const img = link.querySelector("img[alt]");
        if (img) text = img.getAttribute("alt")?.trim() || "";
      }
      if (!text) {
        text = link.textContent?.trim() || "";
      }
      if (!text) continue;

      // Skip very long text (likely a whole card with description)
      if (text.length > 200) {
        // Try to extract just the first line
        text = text.split("\n")[0].trim();
      }

      results.push({ title: text, detailUrl: url });
    }

    return results;
  });

  await page.close();

  // Deduplicate by URL, keeping the entry with the shortest title
  const byUrl = new Map();
  for (const item of listings) {
    const existing = byUrl.get(item.detailUrl);
    if (!existing || item.title.length < existing.title.length) {
      byUrl.set(item.detailUrl, item);
    }
  }

  // Clean titles: strip theatre attribution suffixes like "(ת. בית ליסין)"
  const cleaned = [...byUrl.values()].map((item) => ({
    ...item,
    title: item.title
      .replace(/\s*\(ת\.[^)]*\)\s*/g, "")
      .replace(/\s*[-–—]\s*$/, "")
      .trim(),
  }));

  return cleaned;
}

// Hebrew month name → 1-based month number
const HEBREW_MONTHS = {
  "ינואר": 1, "פברואר": 2, "מרס": 3, "מרץ": 3,
  "אפריל": 4, "מאי": 5, "יוני": 6,
  "יולי": 7, "אוגוסט": 8, "ספטמבר": 9,
  "אוקטובר": 10, "נובמבר": 11, "דצמבר": 12,
};

/**
 * Scrape all performance dates from a show detail page.
 *
 * Dates appear as Hebrew text: "שני, 30 מרס 2026" with time "18:00"
 * and ticket link "/ticket?smarticket=XXXXX".
 *
 * @param {import("puppeteer").Browser} browser
 * @param {string} detailUrl
 * @param {{ debug?: boolean }} [options]
 * @returns {Promise<{ events: { date: string, hour: string }[], debugHtml?: string }>}
 */
export async function scrapeEventDetail(browser, detailUrl, { debug = false } = {}) {
  const page = await browser.newPage();
  await setupRequestInterception(page);

  await page.goto(detailUrl, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  // Wait a moment for content to render
  await page
    .waitForSelector("a[href*='smarticket'], a[href*='ticket']", { timeout: 15_000 })
    .catch(() => {});

  const hebrewMonths = HEBREW_MONTHS;

  const result = await page.evaluate((months, debugMode) => {
    const output = { events: [], debugHtml: null };

    // Hebrew date pattern: "Day, DD MonthName YYYY" followed somewhere by "HH:MM"
    // We'll extract all text blocks that contain dates
    const monthNames = Object.keys(months).join("|");
    const DATE_RE = new RegExp(`(\\d{1,2})\\s+(${monthNames})\\s+(\\d{4})`, "g");
    const TIME_RE = /\b(\d{1,2}:\d{2})\b/g;

    const body = document.body?.textContent || "";

    // Strategy: find date-time pairs by scanning the body text
    // Dates and times appear in table-like rows: date, then time on same line or nearby
    const lines = body.split("\n").map((l) => l.trim()).filter(Boolean);

    let currentDate = null;
    for (const line of lines) {
      const dateMatch = line.match(new RegExp(`(\\d{1,2})\\s+(${monthNames})\\s+(\\d{4})`));
      if (dateMatch) {
        const day = parseInt(dateMatch[1], 10);
        const monthNum = months[dateMatch[2]];
        const year = parseInt(dateMatch[3], 10);
        currentDate = { day, month: monthNum, year };
      }

      // Look for time on the same line or a subsequent line
      const timeMatch = line.match(/^(\d{1,2}:\d{2})$/);
      if (timeMatch && currentDate) {
        output.events.push({
          ...currentDate,
          hour: timeMatch[1],
        });
        // Don't reset currentDate — same date may have multiple times
      }

      // Also check if date and time are on the same line
      if (dateMatch) {
        const timesOnLine = [...line.matchAll(/\b(\d{1,2}:\d{2})\b/g)];
        for (const tm of timesOnLine) {
          // Avoid duplicating if already captured above
          const hour = tm[1];
          const exists = output.events.some(
            (e) =>
              e.day === currentDate.day &&
              e.month === currentDate.month &&
              e.year === currentDate.year &&
              e.hour === hour,
          );
          if (!exists) {
            output.events.push({ ...currentDate, hour });
          }
        }
      }
    }

    if (debugMode) {
      output.debugHtml = document.body?.innerHTML?.slice(0, 15_000) || "";
    }

    return output;
  }, hebrewMonths, debug);

  await page.close();

  // Convert to ISO date strings and deduplicate
  const seen = new Set();
  const events = [];
  for (const ev of result.events) {
    const date = `${ev.year}-${String(ev.month).padStart(2, "0")}-${String(ev.day).padStart(2, "0")}`;
    const hour = ev.hour || "";
    const key = `${date}|${hour}`;
    if (seen.has(key)) continue;
    seen.add(key);
    events.push({ date, hour });
  }

  return { events, debugHtml: result.debugHtml || undefined };
}
