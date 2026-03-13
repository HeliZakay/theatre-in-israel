/**
 * Holon venue scraper — scrapes events from תיאטרון חולון.
 *
 * Site: hth.co.il (WordPress)
 * Listing page shows a Slick carousel of event cards — each card has
 * a title link to the detail page. Detail pages list performance dates
 * in format "DD.M.YYYY | HH:MM".
 * No pagination or load-more.
 */

import { setupRequestInterception } from "../browser.mjs";

export const VENUE_NAME = "תיאטרון חולון";
export const VENUE_CITY = "חולון";
export const LISTING_URL =
  "https://www.hth.co.il/type/%d7%aa%d7%99%d7%90%d7%98%d7%a8%d7%95%d7%9f/";

/**
 * Fetch all show listings from the venue's events page.
 * The page is a Slick carousel — we extract unique detail-page links,
 * skipping cloned slides.
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

  // Wait for event cards to render
  await page
    .waitForSelector(".category_event_title a", { timeout: 15_000 })
    .catch(() => {});

  const listings = await page.evaluate(() => {
    const titleLinks = document.querySelectorAll(".category_event_title a");
    const results = [];
    const seen = new Set();

    for (const link of titleLinks) {
      const href = link.getAttribute("href") || "";
      if (!href || href === "#") continue;

      const url = href.startsWith("http")
        ? href
        : new URL(href, location.origin).href;

      if (seen.has(url)) continue;
      seen.add(url);

      const text = link.textContent?.trim() || "";
      if (!text) continue;

      results.push({ title: text, detailUrl: url });
    }

    return results;
  });

  await page.close();

  // Deduplicate by URL, keeping the entry with the shortest title
  // (avoids descriptions/subtitles that could break matching)
  const byUrl = new Map();
  for (const item of listings) {
    const existing = byUrl.get(item.detailUrl);
    if (!existing || item.title.length < existing.title.length) {
      byUrl.set(item.detailUrl, item);
    }
  }

  return [...byUrl.values()];
}

/**
 * Scrape all performance dates from a show detail page.
 *
 * The sidebar calendar widget has `li.calendar_date` elements with a
 * `data-info` JSON attribute containing a Unix timestamp and time string:
 *   { "date": 1773779400, "time": "20:30", "place": "אולם 1", ... }
 *
 * Falls back to body text regex (DD.M.YYYY | HH:MM) if no calendar items found.
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

  await page
    .waitForSelector("li.calendar_date", { timeout: 15_000 })
    .catch(() => {});

  const result = await page.evaluate((debugMode) => {
    const output = { events: [], debugHtml: null };

    // Primary: parse data-info JSON from calendar widget
    const calItems = document.querySelectorAll("li.calendar_date[data-info]");
    for (const li of calItems) {
      try {
        const info = JSON.parse(li.getAttribute("data-info") || "{}");
        if (info.date) {
          const d = new Date(info.date * 1000);
          output.events.push({
            year: d.getFullYear(),
            month: d.getMonth() + 1,
            day: d.getDate(),
            hour: info.time || "",
          });
        }
      } catch { /* skip malformed JSON */ }
    }

    // Fallback: body text regex for DD.M.YYYY patterns
    if (output.events.length === 0) {
      const DATE_TIME_RE = /(\d{1,2})\.(\d{1,2})\.(\d{4})\s*\|?\s*(\d{1,2}:\d{2})/g;
      const body = document.body?.textContent || "";
      let match;
      while ((match = DATE_TIME_RE.exec(body)) !== null) {
        output.events.push({
          day: parseInt(match[1], 10),
          month: parseInt(match[2], 10),
          year: parseInt(match[3], 10),
          hour: match[4],
        });
      }
    }

    if (debugMode) {
      output.debugHtml = document.body?.innerHTML?.slice(0, 15_000) || "";
    }

    return output;
  }, debug);

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
