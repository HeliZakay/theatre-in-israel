/**
 * Rehovot venue scraper — scrapes events from בית העם רחובות.
 *
 * Site: beithaam.co.il (custom site, tickets via rehovot.smarticket.co.il)
 * Listing page shows event cards with title and "DD/MM/YYYY בשעה HH:MM" date text.
 * All data is on the listing page — no detail pages needed.
 * No pagination or load-more.
 */

import { setupRequestInterception } from "../browser.mjs";

export const VENUE_NAME = "בית העם רחובות";
export const VENUE_CITY = "רחובות";
export const LISTING_URL = "https://www.beithaam.co.il/events/";

/**
 * Fetch all events from the listing page.
 *
 * Returns events grouped by title — each entry is one show with its events.
 *
 * @param {import("puppeteer").Browser} browser
 * @returns {Promise<{ title: string, events: { date: string, hour: string }[] }[]>}
 */
export async function fetchListing(browser) {
  const page = await browser.newPage();
  await setupRequestInterception(page);

  await page.goto(LISTING_URL, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  // Wait for event cards to appear
  await page
    .waitForSelector("a[href*='smarticket.co.il']", { timeout: 15_000 })
    .catch(() => {});

  const listings = await page.evaluate(() => {
    const DATE_TIME_RE = /(\d{2})\/(\d{2})\/(\d{4})\s+בשעה\s+(\d{1,2}:\d{2})/;
    const results = [];

    // Find all links to smarticket detail pages
    const links = document.querySelectorAll("a[href*='smarticket.co.il']");

    for (const link of links) {
      const href = link.getAttribute("href") || "";
      if (!href.includes("smarticket.co.il")) continue;

      // Extract title — look for heading or prominent text inside the card
      const heading = link.querySelector("h1, h2, h3, h4, h5, h6");
      let title = heading?.textContent?.trim() || "";

      // Fallback: if no heading, try the first strong/b element or link text
      if (!title) {
        const strong = link.querySelector("strong, b");
        title = strong?.textContent?.trim() || "";
      }
      if (!title) {
        // Use link text but strip date/time patterns
        title = link.textContent?.trim()?.replace(DATE_TIME_RE, "").trim() || "";
      }
      if (!title) continue;

      // Extract date/time from card text
      const cardText = link.textContent || "";
      const match = cardText.match(DATE_TIME_RE);
      if (!match) continue;

      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const year = parseInt(match[3], 10);
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const hour = match[4];

      results.push({ title, date: dateStr, hour });
    }

    return results;
  });

  await page.close();

  // Group flat results by title
  const byTitle = new Map();
  for (const item of listings) {
    if (!byTitle.has(item.title)) {
      byTitle.set(item.title, { title: item.title, events: [] });
    }
    byTitle.get(item.title).events.push({ date: item.date, hour: item.hour });
  }
  return [...byTitle.values()];
}
