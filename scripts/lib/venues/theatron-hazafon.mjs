/**
 * Theatron HaZafon venue scraper — scrapes events from תיאטרון הצפון.
 *
 * Site: theatron-hazafon.co.il (ASP)
 * The events.asp page has a flat table with ALL upcoming events — each row
 * contains event name, date (D.M without year), time (HH:MM), and ticket link.
 * Same event appears multiple times (one row per date), so we group by URL.
 * No pagination needed. Cloudflare protected — requires puppeteer-extra stealth.
 */

import { setupRequestInterception } from "../browser.mjs";

export const VENUE_NAME = "תיאטרון הצפון";
export const VENUE_CITY = "חיפה";
export const LISTING_URL = "https://www.theatron-hazafon.co.il/events.asp";

/**
 * Infer year for a day/month pair.
 * Dates on the listing are future events without a year.
 * Use the current year unless the date has already passed (> 30 days ago),
 * in which case use next year.
 */
function inferYear(day, month) {
  const now = new Date();
  const candidate = new Date(now.getFullYear(), month - 1, day);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  if (candidate < thirtyDaysAgo) {
    return now.getFullYear() + 1;
  }
  return now.getFullYear();
}

/**
 * Fetch all event listings with their dates from the venue's events page.
 * All data is on one page — no detail pages needed.
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
    const trs = document.querySelectorAll("#CalendarReg2 tr");
    const results = [];

    for (const tr of trs) {
      const tds = tr.querySelectorAll("td");
      if (tds.length < 5) continue;

      // Skip header rows
      if (tds[0].classList.contains("THeader")) continue;

      // TD[0] = event name + link, TD[1] = date text, TD[2] = category,
      // TD[3] = location, TD[4] = ticket link
      const linkEl = tds[0].querySelector("a");
      if (!linkEl) continue;

      const title = linkEl.textContent?.trim() || "";
      const href = linkEl.getAttribute("href") || "";
      if (!title || !href) continue;

      const dateText = tds[1]?.textContent?.trim() || "";

      results.push({ title, href, dateText });
    }

    return results;
  });

  await page.close();

  // Parse dates and group by event URL
  /** @type {Map<string, { title: string, detailUrl: string, events: { date: string, hour: string }[] }>} */
  const grouped = new Map();

  // Date format: "יום: DAY_NAME, D.M, HH:MM"
  const DATE_RE = /(\d{1,2})\.(\d{1,2})/;
  const TIME_RE = /(\d{1,2}:\d{2})/;

  for (const row of rows) {
    const detailUrl = new URL(row.href, LISTING_URL).href;

    if (!grouped.has(detailUrl)) {
      grouped.set(detailUrl, { title: row.title, detailUrl, events: [] });
    }

    const dateMatch = row.dateText.match(DATE_RE);
    if (!dateMatch) continue;

    const day = parseInt(dateMatch[1], 10);
    const month = parseInt(dateMatch[2], 10);
    const year = inferYear(day, month);

    const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const timeMatch = row.dateText.match(TIME_RE);
    const hour = timeMatch ? timeMatch[1] : "";

    grouped.get(detailUrl).events.push({ date, hour });
  }

  return [...grouped.values()];
}
