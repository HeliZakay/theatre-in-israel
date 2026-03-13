/**
 * Beer Sheva venue scraper — scrapes ALL events at תיאטרון באר שבע venue,
 * including guest/touring shows from other theatres.
 *
 * Scrapes two category pages:
 *   1. /show_categories/2025-2026/         — current season (own productions)
 *   2. /show_categories/הצגות-אורחות/      — guest performances
 *
 * Site: b7t.co.il (WordPress + Elementor)
 */

import { BEER_SHEVA_BASE, scrapeShowEvents } from "../beer-sheva.mjs";
import { setupRequestInterception } from "../browser.mjs";

export const VENUE_NAME = "תיאטרון באר שבע";
export const VENUE_CITY = "באר שבע";

const CATEGORY_URLS = [
  "https://b7t.co.il/show_categories/2025-2026/",
  "https://b7t.co.il/show_categories/%D7%94%D7%A6%D7%92%D7%95%D7%AA-%D7%90%D7%95%D7%A8%D7%97%D7%95%D7%AA/",
];

/**
 * Scrape show links from a single category page.
 * Same logic as fetchShows() in beer-sheva.mjs but accepts any URL.
 */
async function scrapeCategory(browser, categoryUrl) {
  const page = await browser.newPage();
  await setupRequestInterception(page);

  await page.goto(categoryUrl, { waitUntil: "networkidle2", timeout: 60_000 });

  // Gracefully handle empty category pages
  const hasLinks = await page
    .waitForSelector('a[href*="/shows/"]', { timeout: 15_000 })
    .then(() => true)
    .catch(() => false);

  if (!hasLinks) {
    await page.close();
    return [];
  }

  const shows = await page.evaluate((base) => {
    const map = new Map();
    const blocklist = ["סיור מאחורי הקלעים"];

    const links = document.querySelectorAll(
      'h2.elementor-heading-title a[href*="/shows/"]',
    );

    for (const a of links) {
      let title = a.textContent.trim();
      if (!title) continue;
      title = title.replace(/\s+/g, " ").trim();
      if (title.length < 2) continue;
      if (blocklist.some((b) => title.includes(b))) continue;

      const href = a.getAttribute("href") || "";
      if (!href.includes("/shows/")) continue;
      const url = href.startsWith("http") ? href : `${base}${href}`;
      if (!map.has(title)) map.set(title, url);
    }

    const allLinks = document.querySelectorAll('a[href*="/shows/"]');
    for (const a of allLinks) {
      const href = a.getAttribute("href") || "";
      if (!href.includes("/shows/")) continue;
      const url = href.startsWith("http") ? href : `${base}${href}`;
      const existingUrls = new Set([...map.values()]);
      if (existingUrls.has(url)) continue;

      let container = a.parentElement;
      let heading = null;
      for (let i = 0; i < 5 && container; i++) {
        heading =
          container.querySelector("h2.elementor-heading-title") ||
          container.querySelector("h2") ||
          container.querySelector("h3");
        if (heading) break;
        container = container.parentElement;
      }

      if (heading) {
        let title = heading.textContent.trim().replace(/\s+/g, " ");
        if (
          title &&
          title.length >= 2 &&
          !map.has(title) &&
          !blocklist.some((b) => title.includes(b))
        ) {
          map.set(title, url);
        }
      }
    }

    return [...map.entries()].map(([title, url]) => ({ title, url }));
  }, BEER_SHEVA_BASE);

  await page.close();
  return shows;
}

/**
 * Fetch all show listings from the Beer Sheva Theatre website.
 * Scrapes both the current season page and the guest performances page,
 * deduplicating by URL.
 *
 * @param {import("puppeteer").Browser} browser
 * @returns {Promise<{ title: string, detailUrl: string }[]>}
 */
export async function fetchListing(browser) {
  const seen = new Map(); // url → { title, detailUrl }

  for (const categoryUrl of CATEGORY_URLS) {
    const shows = await scrapeCategory(browser, categoryUrl);
    for (const s of shows) {
      if (!seen.has(s.url)) {
        seen.set(s.url, { title: s.title, detailUrl: s.url });
      }
    }
  }

  return [...seen.values()].sort((a, b) =>
    a.title.localeCompare(b.title, "he"),
  );
}

/**
 * Scrape event dates from a show detail page.
 * Wraps scrapeShowEvents() and returns only { date, hour } pairs.
 *
 * @param {import("puppeteer").Browser} browser
 * @param {string} detailUrl
 * @param {{ debug?: boolean }} [options]
 * @returns {Promise<{ events: { date: string, hour: string }[], debugHtml?: string }>}
 */
export async function scrapeEventDetail(browser, detailUrl, { debug = false } = {}) {
  const result = await scrapeShowEvents(browser, detailUrl, { debug });
  return {
    events: result.events.map((e) => ({ date: e.date, hour: e.hour })),
    debugHtml: result.debugHtml || undefined,
  };
}
