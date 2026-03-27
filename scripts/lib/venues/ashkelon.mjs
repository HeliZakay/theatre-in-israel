/**
 * Ashkelon venue scraper — scrapes events from היכל התרבות אשקלון.
 *
 * Site: htash.co.il (Umbraco CMS)
 * Listing page shows a Bootstrap grid of events — each row is a div.event_tbl
 * containing title (in an <a> link), date/time in span.post-date (DD/MM/YYYY, HH:MM).
 * All data is on the listing page — no detail pages needed.
 * No pagination or load-more.
 */

import { setupRequestInterception } from "../browser.mjs";

export const VENUE_NAME = "היכל התרבות אשקלון";
export const VENUE_CITY = "אשקלון";
export const LISTING_URL =
  "https://www.htash.co.il/%D7%9B%D7%A0%D7%A1%D7%99%D7%9D-%D7%95%D7%90%D7%99%D7%A8%D7%95%D7%A2%D7%99%D7%9D/";

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

  // Wait for the event rows to appear
  await page
    .waitForSelector(".event_tbl", { timeout: 15_000 })
    .catch(() => {});

  const listings = await page.evaluate(() => {
    const DATE_TIME_RE = /(\d{2})\/(\d{2})\/(\d{4}),?\s*(\d{1,2}:\d{2})/;
    const rows = document.querySelectorAll(".event_tbl");
    const results = [];

    for (const row of rows) {
      // Title link — <a href="/כנסים-ואירועים/?id=XXXX"> (without &event=)
      const links = row.querySelectorAll("a[href*='id=']");
      let title = "";
      for (const link of links) {
        const href = link.getAttribute("href") || "";
        // Skip purchase links (contain &event=)
        if (href.includes("&event=") || href.includes("&amp;event=")) continue;
        title = link.textContent?.trim() || "";
        break;
      }
      if (!title) continue;

      // Date/time in <span class="post-date">יום: DD/MM/YYYY, HH:MM</span>
      const dateSpan = row.querySelector(".post-date");
      const dateText = dateSpan?.textContent?.trim() || "";
      const match = dateText.match(DATE_TIME_RE);
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
