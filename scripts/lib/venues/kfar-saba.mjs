/**
 * Kfar Saba venue scraper — scrapes events from היכל התרבות כפר סבא.
 *
 * Site: ksaba.smarticket.co.il (SmartTicket platform)
 * Listing page (/תיאטרון_page_36) shows event cards — each card is one performance date.
 * Detail pages have a dates table with Hebrew-formatted dates (no JSON-LD Event).
 * Cloudflare protected — requires puppeteer-extra stealth plugin.
 */

import { setupRequestInterception } from "../browser.mjs";

export const VENUE_NAME = "היכל התרבות כפר סבא";
export const VENUE_CITY = "כפר סבא";
export const LISTING_URL =
  "https://ksaba.smarticket.co.il/%D7%AA%D7%99%D7%90%D7%98%D7%A8%D7%95%D7%9F_page_36";

/** Hebrew month name → 1-based month number */
const HEBREW_MONTHS = {
  ינואר: 1,
  פברואר: 2,
  מרץ: 3,
  אפריל: 4,
  מאי: 5,
  יוני: 6,
  יולי: 7,
  אוגוסט: 8,
  ספטמבר: 9,
  אוקטובר: 10,
  נובמבר: 11,
  דצמבר: 12,
};

/**
 * Parse a Hebrew date string like "ביום שבת, 21 במרץ 2026 : בשעה 21:00"
 * into { date: "YYYY-MM-DD", hour: "HH:MM" }.
 */
function parseHebrewDate(text) {
  // Extract day, month name, year, and time
  const m = text.match(/(\d{1,2})\s+ב([א-ת]+)\s+(\d{4})\s*:\s*בשעה\s+(\d{1,2}:\d{2})/);
  if (!m) return null;

  const day = parseInt(m[1], 10);
  const monthName = m[2];
  const year = parseInt(m[3], 10);
  const hour = m[4];

  const month = HEBREW_MONTHS[monthName];
  if (!month) return null;

  const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return { date, hour };
}

/**
 * Fetch all event listings from the venue's theatre category page.
 * Each card on the listing page represents a single performance date,
 * so we return one entry per card (title + detail URL).
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

  // Wait for event cards to render
  await page.waitForSelector("a.show", { timeout: 15_000 });

  const listings = await page.evaluate(() => {
    const cards = document.querySelectorAll("a.show");
    const results = [];

    for (const card of cards) {
      const href = card.getAttribute("href") || "";
      if (!href) continue;

      // Title is in an <h2> inside .details-container
      const h2 = card.querySelector("h2");
      const title = h2?.textContent?.trim() || "";
      if (!title) continue;

      const url = href.startsWith("http")
        ? href
        : new URL(href, location.origin).href;

      results.push({ title, detailUrl: url });
    }

    return results;
  });

  await page.close();
  return listings;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch all events grouped by show title.
 * Calls fetchListing to get raw cards, groups by title, scrapes each
 * detail URL via scrapeEventDetail, and deduplicates events.
 *
 * @param {import("puppeteer").Browser} browser
 * @returns {Promise<{ title: string, events: { date: string, hour: string }[] }[]>}
 */
export async function fetchAllEvents(browser) {
  const listings = await fetchListing(browser);

  // Group by title, collecting unique detail URLs per show
  const byTitle = new Map();
  for (const item of listings) {
    if (!byTitle.has(item.title)) {
      byTitle.set(item.title, { title: item.title, detailUrls: new Set() });
    }
    byTitle.get(item.title).detailUrls.add(item.detailUrl);
  }

  const results = [];
  const groups = [...byTitle.values()];

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const events = [];
    const seen = new Set();
    const urls = [...group.detailUrls];

    for (let j = 0; j < urls.length; j++) {
      const result = await scrapeEventDetail(browser, urls[j]);
      for (const ev of result.events) {
        const key = `${ev.date}|${ev.hour}`;
        if (!seen.has(key)) {
          seen.add(key);
          events.push(ev);
        }
      }
      if (j < urls.length - 1) await sleep(1500);
    }

    results.push({ title: group.title, events });
    if (i < groups.length - 1) await sleep(1500);
  }

  return results;
}

/**
 * Scrape event date/time from a detail page's dates table.
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

  const result = await page.evaluate((debugMode) => {
    const output = { events: [], debugHtml: null };

    // Dates are in a table — each row has an <a> with text like:
    // "ביום שבת, 21 במרץ 2026 : בשעה 21:00"
    const rows = document.querySelectorAll("table tbody tr");
    for (const row of rows) {
      const a = row.querySelector("a");
      if (a) {
        output.events.push({ raw: a.textContent.trim() });
      }
    }

    if (debugMode) {
      output.debugHtml = document.body?.innerHTML?.slice(0, 15_000) || "";
    }

    return output;
  }, debug);

  // Parse Hebrew dates on the Node side
  const events = [];
  for (const ev of result.events) {
    const parsed = parseHebrewDate(ev.raw);
    if (parsed) {
      events.push(parsed);
    }
  }

  await page.close();

  return { events, debugHtml: result.debugHtml || undefined };
}
