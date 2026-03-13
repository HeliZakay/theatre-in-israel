/**
 * Or Akiva venue scraper — scrapes events from היכל התרבות אור עקיבא.
 *
 * Site: htorakiva.co.il (WordPress + Elementor + JetEngine)
 * Listing page shows a flat table of events — each row is one performance date
 * with title, date (DD/MM/YY), time (HH:MM), and a purchase link.
 * All data is on the listing page — no detail pages needed.
 * Uses scroll-based infinite loading (JetEngine "load_more_type":"scroll").
 * Some items have empty title fields — fall back to decoding the URL slug.
 */

import { setupRequestInterception } from "../browser.mjs";

export const VENUE_NAME = "היכל התרבות אור עקיבא";
export const VENUE_CITY = "אור עקיבא";
export const LISTING_URL =
  "https://htorakiva.co.il/%D7%9C%D7%95%D7%97-%D7%94%D7%A6%D7%92%D7%95%D7%AA/";

const MAX_SCROLL_ATTEMPTS = 20;

/**
 * Fetch all events from the listing page.
 * Handles scroll-based infinite loading to get all items.
 *
 * Returns a flat list — each entry is one performance with title, date, hour.
 * Events are grouped by title downstream (in the scrape-all script).
 *
 * @param {import("puppeteer").Browser} browser
 * @returns {Promise<{ title: string, date: string, hour: string }[]>}
 */
export async function fetchListing(browser) {
  const page = await browser.newPage();
  await setupRequestInterception(page, { allowStylesheets: true });

  await page.goto(LISTING_URL, {
    waitUntil: "networkidle2",
    timeout: 60_000,
  });
  await page.waitForSelector(".jet-listing-grid__item", { timeout: 15_000 });

  // Scroll to bottom repeatedly to trigger infinite loading
  for (let i = 0; i < MAX_SCROLL_ATTEMPTS; i++) {
    const prevCount = await page.$$eval(
      ".jet-listing-grid__item",
      (els) => els.length,
    );

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise((r) => setTimeout(r, 2000));

    const newCount = await page.$$eval(
      ".jet-listing-grid__item",
      (els) => els.length,
    );
    if (newCount === prevCount) break;
  }

  const listings = await page.evaluate(() => {
    const items = document.querySelectorAll(".jet-listing-grid__item");
    const results = [];

    const DATE_RE = /^(\d{2})\/(\d{2})\/(\d{2})$/;
    const TIME_RE = /^(\d{1,2}:\d{2})$/;

    for (const item of items) {
      const fields = item.querySelectorAll(
        ".jet-listing-dynamic-field__content",
      );
      const texts = Array.from(fields).map(
        (f) => f.textContent?.trim() || "",
      );

      // Fields: [0]=title, [1]=date DD/MM/YY, [2]=day, [3]=time HH:MM, [4]=empty
      let title = texts[0] || "";
      const dateText = texts[1] || "";
      const timeText = texts[3] || "";

      const dateMatch = dateText.match(DATE_RE);
      if (!dateMatch) continue; // skip items without a valid date

      const timeMatch = timeText.match(TIME_RE);

      // If title is empty, decode it from the purchase link URL slug
      if (!title) {
        const link = item.querySelector("a.jet-listing-dynamic-link__link");
        const href = link?.getAttribute("href") || "";
        // URL pattern: .../dates-table/{slug}/ or .../dates-table/{slug}-N/
        const slugMatch = href.match(/\/dates-table\/([^/]+)\/?$/);
        if (slugMatch) {
          const slug = decodeURIComponent(slugMatch[1])
            // Remove trailing -N suffix (duplicate disambiguation)
            .replace(/-\d+$/, "")
            .replace(/-/g, " ");
          title = slug;
        }
      }

      if (!title) continue;

      const day = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10);
      const year = 2000 + parseInt(dateMatch[3], 10);

      const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const hour = timeMatch ? timeMatch[1] : "";

      results.push({ title, date, hour });
    }

    return results;
  });

  await page.close();
  return listings;
}
