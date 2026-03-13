/**
 * Rishon LeZion venue scraper — scrapes events from היכל התרבות ראשון לציון.
 *
 * Site: htrl.co.il (WordPress)
 * Listing page shows event cards with title and detail URL.
 * Detail pages list performance dates (DD.MM.YY format) with times.
 * Load-more button on listing page for pagination.
 */

import { setupRequestInterception } from "../browser.mjs";

export const VENUE_NAME = "היכל התרבות ראשון לציון";
export const VENUE_CITY = "ראשון לציון";
export const LISTING_URL = "https://htrl.co.il/show/";

const MAX_LOAD_MORE_CLICKS = 30;

/**
 * Fetch all show listings from the venue's shows page.
 * Handles the "load more" button to get all shows.
 *
 * @param {import("puppeteer").Browser} browser
 * @returns {Promise<{ title: string, detailUrl: string }[]>}
 */
export async function fetchListing(browser) {
  const page = await browser.newPage();
  await setupRequestInterception(page, { allowStylesheets: true });

  await page.goto(LISTING_URL, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector("#filter-result-archive .show-item", { timeout: 15_000 });

  // Click "load more" until no new items appear
  for (let i = 0; i < MAX_LOAD_MORE_CLICKS; i++) {
    const prevCount = await page.$$eval(
      "#filter-result-archive .show-item",
      (els) => els.length,
    );

    const clicked = await page.evaluate(() => {
      const btn = document.querySelector("#loadMoreBtn");
      if (!btn) return false;
      const style = window.getComputedStyle(btn);
      if (style.display === "none" || style.visibility === "hidden") return false;
      btn.click();
      return true;
    });
    if (!clicked) break;

    // Wait for new items to appear
    await page.waitForFunction(
      (prev) => {
        const items = document.querySelectorAll(
          "#filter-result-archive .show-item",
        );
        return items.length > prev;
      },
      { timeout: 10_000 },
      prevCount,
    ).catch(() => {});

    const newCount = await page.$$eval(
      "#filter-result-archive .show-item",
      (els) => els.length,
    );
    if (newCount === prevCount) break;

    await new Promise((r) => setTimeout(r, 500));
  }

  const listings = await page.evaluate(() => {
    const cards = document.querySelectorAll("#filter-result-archive .show-item");
    const results = [];
    const seen = new Set();

    for (const card of cards) {
      const titleEl = card.querySelector("h3.show-title a");
      if (!titleEl) continue;

      const title = titleEl.textContent?.trim() || "";
      const href = titleEl.getAttribute("href") || "";
      if (!title || !href) continue;

      const url = href.startsWith("http") ? href : new URL(href, location.origin).href;
      if (seen.has(url)) continue;
      seen.add(url);

      results.push({ title, detailUrl: url });
    }

    return results;
  });

  await page.close();

  // Deduplicate by URL (keep first occurrence)
  const seen = new Map();
  for (const item of listings) {
    if (!seen.has(item.detailUrl)) {
      seen.set(item.detailUrl, item);
    }
  }

  return [...seen.values()];
}

/**
 * Scrape all performance dates from a show detail page.
 *
 * @param {import("puppeteer").Browser} browser
 * @param {string} detailUrl
 * @param {{ debug?: boolean }} [options]
 * @returns {Promise<{ events: { date: string, hour: string }[], debugHtml?: string }>}
 */
export async function scrapeEventDetail(browser, detailUrl, { debug = false } = {}) {
  const page = await browser.newPage();
  await setupRequestInterception(page);

  await page.goto(detailUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });

  // Wait for the shows-list container with event rows
  await page.waitForSelector(".shows-list", { timeout: 15_000 }).catch(() => {});

  const result = await page.evaluate((debugMode) => {
    const output = { events: [], debugHtml: null };

    const DATE_RE = /(\d{1,2})\.(\d{2})\.(\d{2,4})/;
    const TIME_RE = /(\d{1,2}:\d{2})/;

    // Each event row is .show-list-next inside .shows-list
    const rows = document.querySelectorAll(".shows-list .show-list-next");

    for (const row of rows) {
      const dateEl = row.querySelector(".time-show-list");
      const timeEl = row.querySelector(".show-time-clock");
      if (!dateEl) continue;

      const dateText = dateEl.textContent?.replace(/\s+/g, " ").trim() || "";
      const dateMatch = dateText.match(DATE_RE);
      if (!dateMatch) continue;

      const timeText = timeEl?.textContent?.replace(/\s+/g, " ").trim() || "";
      const timeMatch = timeText.match(TIME_RE);

      output.events.push({
        day: parseInt(dateMatch[1], 10),
        month: parseInt(dateMatch[2], 10),
        year: parseInt(dateMatch[3], 10),
        hour: timeMatch ? timeMatch[1] : "",
      });
    }

    if (debugMode) {
      const container = document.querySelector(".shows-list");
      output.debugHtml = container?.innerHTML?.slice(0, 15_000) || document.body?.innerHTML?.slice(0, 15_000) || "";
    }

    return output;
  }, debug);

  await page.close();

  // Convert to ISO date strings and deduplicate
  const seen = new Set();
  const events = [];
  for (const ev of result.events) {
    // Handle 2-digit year: YY → 20YY
    const year = ev.year < 100 ? 2000 + ev.year : ev.year;
    const date = `${year}-${String(ev.month).padStart(2, "0")}-${String(ev.day).padStart(2, "0")}`;
    const hour = ev.hour || "";
    const key = `${date}|${hour}`;
    if (seen.has(key)) continue;
    seen.add(key);
    events.push({ date, hour });
  }

  return { events, debugHtml: result.debugHtml || undefined };
}
