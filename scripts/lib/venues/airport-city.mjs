/**
 * Airport City venue scraper — scrapes events from היכל התרבות אייפורט סיטי.
 *
 * Site: heichal-hm.co.il (custom PHP CMS)
 * Listing page shows a calendar grid with event links.
 * Detail pages list performance dates (DD/MM/YYYY) with times (HH:MM).
 * No pagination or load-more.
 */

import { setupRequestInterception } from "../browser.mjs";
import { formatDate } from "../date.mjs";

export const VENUE_NAME = "היכל התרבות איירפורט סיטי";
export const VENUE_CITY = "איירפורט סיטי";
export const LISTING_URL =
  "https://heichal-hm.co.il/index.php?dir=site&page=play&op=category&cs=3011";

/**
 * Fetch all show listings from the venue's events page.
 * The page is a calendar grid — we extract all unique detail-page links.
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

  // Wait for page content
  await page.waitForSelector("a[href*='op=item']", { timeout: 15_000 }).catch(() => {});

  const listings = await page.evaluate(() => {
    const links = document.querySelectorAll("a[href*='op=item']");
    const results = [];
    const seen = new Set();

    for (const link of links) {
      const href = link.getAttribute("href") || "";
      if (!href) continue;

      const url = href.startsWith("http")
        ? href
        : new URL(href, location.origin).href;

      if (seen.has(url)) continue;
      seen.add(url);

      // Sidebar cards have <h2 class="homepage-box__title"> with the clean title.
      // Calendar grid cards have <div> with title + trailing time text.
      const h2 = link.querySelector("h2.homepage-box__title");
      let title = "";
      if (h2) {
        title = h2.textContent?.trim() || "";
      } else {
        // Calendar grid: first <div> has the title
        const firstDiv = link.querySelector("div");
        title = (firstDiv?.textContent || link.textContent || "")
          .replace(/\s+/g, " ")
          .trim();
      }

      // Strip trailing time
      title = title.replace(/\s+\d{1,2}:\d{2}\s*$/, "").trim();

      // Skip links that have no meaningful title (e.g. just a time or date)
      if (!title || /^\d{1,2}:\d{2}$/.test(title)) continue;

      results.push({ title, detailUrl: url });
    }

    return results;
  });

  await page.close();

  // Deduplicate by URL, keeping the entry with the shortest title
  // (calendar grid links have cleaner titles than sidebar list links)
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
 * Dates appear as "DD/MM/YYYYHH:MM" or "DD/MM/YYYY HH:MM" text nodes,
 * followed by "לרכישה" ticket links.
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

  // Wait for page content
  await page.waitForSelector("body", { timeout: 15_000 }).catch(() => {});

  const result = await page.evaluate((debugMode) => {
    const output = { events: [], debugHtml: null };

    // Dates appear as DD/MM/YYYY followed by HH:MM (possibly concatenated)
    const DATE_TIME_RE = /(\d{2})\/(\d{2})\/(\d{4})\s*(\d{1,2}:\d{2})/g;

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

    // Fallback: dates without times
    if (output.events.length === 0) {
      const DATE_ONLY_RE = /(\d{2})\/(\d{2})\/(\d{4})/g;
      while ((match = DATE_ONLY_RE.exec(body)) !== null) {
        output.events.push({
          day: parseInt(match[1], 10),
          month: parseInt(match[2], 10),
          year: parseInt(match[3], 10),
          hour: "",
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
    const date = formatDate(ev.day, ev.month, ev.year);
    const hour = ev.hour || "";
    const key = `${date}|${hour}`;
    if (seen.has(key)) continue;
    seen.add(key);
    events.push({ date, hour });
  }

  return { events, debugHtml: result.debugHtml || undefined };
}
