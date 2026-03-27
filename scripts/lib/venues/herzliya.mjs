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
import { HEBREW_MONTHS, parseHebrewDate, formatDate, parseTime } from "../date.mjs";

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

// Re-use shared HEBREW_MONTHS from date.mjs (imported above).

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

  const result = await page.evaluate((debugMode) => {
    const output = { lines: [], debugHtml: null };

    // Extract raw text lines for Node-side parsing
    const body = document.body?.textContent || "";
    output.lines = body.split("\n").map((l) => l.trim()).filter(Boolean);

    if (debugMode) {
      output.debugHtml = document.body?.innerHTML?.slice(0, 15_000) || "";
    }

    return output;
  }, debug);

  await page.close();

  // Parse Hebrew dates and times from raw text lines (Node context)
  const monthNames = Object.keys(HEBREW_MONTHS).join("|");
  const DATE_RE = new RegExp(`\\d{1,2}\\s+(?:ב)?(?:${monthNames})\\s+\\d{4}`);
  const TIME_ONLY_RE = /^(\d{1,2}:\d{2})$/;

  const events = [];
  const seen = new Set();
  let currentDate = null;

  for (const line of result.lines) {
    const hebParsed = parseHebrewDate(line);
    if (hebParsed) {
      currentDate = hebParsed.date;
      // Check for times on the same line
      const timesOnLine = [...line.matchAll(/\b(\d{1,2}:\d{2})\b/g)];
      for (const tm of timesOnLine) {
        const key = `${currentDate}|${tm[1]}`;
        if (!seen.has(key)) {
          seen.add(key);
          events.push({ date: currentDate, hour: tm[1] });
        }
      }
    }

    // Time on its own line → attach to currentDate
    const timeMatch = line.match(TIME_ONLY_RE);
    if (timeMatch && currentDate) {
      const key = `${currentDate}|${timeMatch[1]}`;
      if (!seen.has(key)) {
        seen.add(key);
        events.push({ date: currentDate, hour: timeMatch[1] });
      }
    }
  }

  return { events, debugHtml: result.debugHtml || undefined };
}
