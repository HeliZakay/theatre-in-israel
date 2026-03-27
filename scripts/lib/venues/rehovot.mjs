/**
 * Rehovot venue scraper — scrapes events from בית העם רחובות.
 *
 * Site: beithaam.co.il (custom site, tickets via rehovot.smarticket.co.il)
 * Listing page shows event cards with title and "DD/MM/YYYY בשעה HH:MM" date text.
 * All data is on the listing page — no detail pages needed.
 * No pagination or load-more.
 */

import { setupRequestInterception } from "../browser.mjs";
import { parseSlashDate } from "../date.mjs";

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

      // Extract raw date/time text from card
      const cardText = link.textContent || "";
      if (!DATE_TIME_RE.test(cardText)) continue;

      results.push({ title, rawDateText: cardText });
    }

    return results;
  });

  await page.close();

  // Parse dates in Node context and group by title
  const byTitle = new Map();
  for (const item of listings) {
    const parsed = parseSlashDate(item.rawDateText);
    if (!parsed) continue;
    if (!byTitle.has(item.title)) {
      byTitle.set(item.title, { title: item.title, events: [] });
    }
    byTitle.get(item.title).events.push({ date: parsed.date, hour: parsed.hour });
  }
  return [...byTitle.values()];
}
