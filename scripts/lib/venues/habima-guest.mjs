/**
 * Habima Guest Shows venue scraper — scrapes the "הצגות אורחות" listing page
 * and reuses habima.mjs's scrapeShowEvents() for detail pages.
 *
 * Site: habima.co.il — guest shows page (/הבימה-4/)
 * Listing page shows show cards with h3 titles and /shows/ detail URLs.
 * Detail pages have the same structure as regular Habima shows.
 */

import { setupRequestInterception } from "../browser.mjs";
import { HABIMA_BASE } from "../habima.mjs";

export const VENUE_NAME = "תיאטרון הבימה";
export const VENUE_CITY = "תל אביב";
export const GUEST_LISTING_URL =
  "https://www.habima.co.il/%d7%94%d7%91%d7%99%d7%9e%d7%94-4/";

/**
 * Fetch all guest show listings (title + detail URL) from the guest page.
 *
 * @param {import("puppeteer").Browser} browser
 * @returns {Promise<{ title: string, detailUrl: string }[]>}
 */
export async function fetchListing(browser) {
  const page = await browser.newPage();
  await setupRequestInterception(page);

  await page.goto(GUEST_LISTING_URL, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForSelector('a[href*="/shows/"]', { timeout: 30_000 });

  const listings = await page.evaluate((base) => {
    const map = new Map();

    // Same card structure as repertoire: h3 titles paired with /shows/ links
    const headings = document.querySelectorAll("h3");

    for (const h3 of headings) {
      let title = h3.textContent.trim().replace(/\s+/g, " ");
      if (!title || title.length < 2) continue;
      if (title === "לרכישה" || title === "לתאריכים ורכישה" || title === "רוצים לראות עוד?") continue;

      // Walk up to find a parent container with a /shows/ link
      let container = h3.parentElement;
      let link = null;
      for (let i = 0; i < 5 && container; i++) {
        link = container.querySelector('a[href*="/shows/"]');
        if (link) break;
        container = container.parentElement;
      }
      if (!link) continue;

      const href = link.getAttribute("href") || "";
      if (!href.includes("/shows/")) continue;

      const url = href.startsWith("http") ? href : `${base}${href}`;
      if (!map.has(title)) {
        map.set(title, url);
      }
    }

    // Fallback: collect /shows/ links not yet captured
    const allLinks = document.querySelectorAll('a[href*="/shows/"]');
    for (const a of allLinks) {
      const href = a.getAttribute("href") || "";
      if (!href.includes("/shows/")) continue;

      const url = href.startsWith("http") ? href : `${base}${href}`;
      const existingUrls = new Set([...map.values()]);
      if (existingUrls.has(url)) continue;

      let container = a.parentElement;
      let h3 = null;
      for (let i = 0; i < 5 && container; i++) {
        h3 = container.querySelector("h3");
        if (h3) break;
        container = container.parentElement;
      }
      if (h3) {
        const title = h3.textContent.trim().replace(/\s+/g, " ");
        if (title && title.length >= 2 && !map.has(title)) {
          map.set(title, url);
        }
      }
    }

    return [...map.entries()].map(([title, url]) => ({ title, detailUrl: url }));
  }, HABIMA_BASE);

  await page.close();
  return listings.sort((a, b) => a.title.localeCompare(b.title, "he"));
}
