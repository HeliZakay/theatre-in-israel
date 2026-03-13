/**
 * Ashdod venue scraper — scrapes events from המשכן לאמנויות הבמה אשדוד.
 *
 * Site: mishkan-ashdod.co.il (ASP)
 * The events.asp page has a flat table with ALL upcoming events — each row
 * contains event name, date (DD.MM.YYYY), time (HH:MM), and ticket link.
 * Same event appears multiple times (one row per date), so we group by URL.
 * No pagination needed.
 */

import { setupRequestInterception } from "../browser.mjs";

export const VENUE_NAME = "המשכן לאמנויות הבמה אשדוד";
export const VENUE_CITY = "אשדוד";
export const LISTING_URL = "https://www.mishkan-ashdod.co.il/events.asp";

/**
 * Fetch all event listings with their dates from the venue's events page.
 * Unlike nes-ziona, all data is on one page — no detail pages needed.
 *
 * @param {import("puppeteer").Browser} browser
 * @returns {Promise<{ title: string, detailUrl: string, events: { date: string, hour: string }[] }[]>}
 */
export async function fetchListing(browser) {
  const page = await browser.newPage();
  await setupRequestInterception(page);

  await page.goto(LISTING_URL, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  // Wait for the events table to render
  await page.waitForSelector("td.TReg", { timeout: 15_000 });

  const rows = await page.evaluate(() => {
    const trs = document.querySelectorAll("table tr");
    const results = [];

    for (const tr of trs) {
      const tds = tr.querySelectorAll("td");
      if (tds.length < 5) continue;

      // Skip header rows
      if (tds[0].classList.contains("THeader")) continue;

      // TD[0] = event name + link, TD[1] = venue, TD[2] = category,
      // TD[3] = date (DD.MM.YYYY), TD[4] = time (HH:MM), TD[5] = ticket link
      const linkEl = tds[0].querySelector("a");
      if (!linkEl) continue;

      const title = linkEl.textContent?.trim() || "";
      const href = linkEl.getAttribute("href") || "";
      if (!title || !href) continue;

      const dateText = tds[3]?.textContent?.trim() || "";
      const timeText = tds[4]?.textContent?.trim() || "";

      results.push({ title, href, dateText, timeText });
    }

    return results;
  });

  await page.close();

  // Parse dates and group by event URL
  /** @type {Map<string, { title: string, detailUrl: string, events: { date: string, hour: string }[] }>} */
  const grouped = new Map();

  for (const row of rows) {
    const detailUrl = new URL(row.href, LISTING_URL).href;

    if (!grouped.has(detailUrl)) {
      grouped.set(detailUrl, { title: row.title, detailUrl, events: [] });
    }

    // Parse DD.MM.YYYY → YYYY-MM-DD
    const dateMatch = row.dateText.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (!dateMatch) continue;

    const date = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
    const hour = row.timeText.match(/^\d{1,2}:\d{2}$/) ? row.timeText : "";

    grouped.get(detailUrl).events.push({ date, hour });
  }

  return [...grouped.values()];
}
