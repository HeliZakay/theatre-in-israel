/**
 * Jerusalem Theatre venue scraper — scrapes events from תיאטרון ירושלים.
 *
 * Site: jerusalem-theatre.co.il (custom CMS)
 * Listing page shows event cards (one per show, not per date) in a masonry grid.
 * Cards are loaded dynamically via AJAX into #masonry-items.
 * Each card has: title in h3, theatre company in .titWrp p, detail link, and
 * a <time datetime="YYYY-MM-DD HH:MM"> with only the NEXT upcoming date.
 * Detail pages list ALL upcoming dates for each show.
 *
 * Pattern A: listing + detail pages (like Nes Ziona).
 * No request interception — the SPA needs all resources to render.
 */

import { parseDotDate, parseTime } from "../date.mjs";

export const VENUE_NAME = "תיאטרון ירושלים";
export const VENUE_CITY = "ירושלים";
export const LISTING_URL =
  "https://www.jerusalem-theatre.co.il/%D7%90%D7%99%D7%A8%D7%95%D7%A2%D7%99%D7%9D/eventGrp%7Cfwsa%7Ctheatre/%D7%AA%D7%99%D7%90%D7%98%D7%A8%D7%95%D7%9F";

/**
 * Fetch all show listings from the venue's theatre category page.
 * Each card = one show (not one date). Returns title + detail URL.
 *
 * @param {import("puppeteer").Browser} browser
 * @returns {Promise<{ title: string, detailUrl: string }[]>}
 */
export async function fetchListing(browser) {
  const page = await browser.newPage();

  await page.goto(LISTING_URL, {
    waitUntil: "networkidle2",
    timeout: 60_000,
  });

  // Dismiss cookie consent banner if present
  try {
    await page.click("#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll");
  } catch {
    // No cookie banner — continue
  }

  // Wait for event cards to render inside masonry grid
  await page.waitForSelector(".card.event.filtr-item", { timeout: 15_000 });

  const listings = await page.evaluate(() => {
    const cards = document.querySelectorAll(".card.event.filtr-item");
    const results = [];

    for (const card of cards) {
      const h3 = card.querySelector("h3");
      if (!h3) continue;

      const link = h3.querySelector("a");
      if (!link) continue;

      const href = link.getAttribute("href") || "";
      // Title: h3 text minus the hidden <time> text inside
      const timeEl = h3.querySelector("time");
      const timeText = timeEl?.textContent || "";
      const title = h3.textContent.replace(timeText, "").trim();
      if (!title) continue;

      const url = href.startsWith("http")
        ? href
        : new URL(href, location.origin).href;

      results.push({ title, detailUrl: url });
    }

    return results;
  });

  await page.close();

  // Deduplicate by URL
  const seen = new Set();
  const deduped = [];
  for (const item of listings) {
    if (seen.has(item.detailUrl)) continue;
    seen.add(item.detailUrl);
    deduped.push(item);
  }

  return deduped;
}

/**
 * Scrape all event dates/times from a show's detail page.
 * Dates are listed in a table/list with DD.MM.YYYY format and HH:MM times.
 *
 * @param {import("puppeteer").Browser} browser
 * @param {string} detailUrl
 * @param {{ debug?: boolean }} [options]
 * @returns {Promise<{ events: { date: string, hour: string }[], debugHtml?: string }>}
 */
export async function scrapeEventDetail(browser, detailUrl, { debug = false } = {}) {
  const page = await browser.newPage();

  await page.goto(detailUrl, {
    waitUntil: "networkidle2",
    timeout: 60_000,
  });

  const result = await page.evaluate((debugMode) => {
    const output = { events: [], debugHtml: null };

    // Strategy 1: Find all <time datetime="YYYY-MM-DD HH:MM"> elements
    const timeEls = document.querySelectorAll("time[datetime]");
    for (const el of timeEls) {
      const dt = el.getAttribute("datetime") || "";
      // Match datetime="YYYY-MM-DD HH:MM" or "YYYY-MM-DD HH:MM:SS"
      const m = dt.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/);
      if (m) {
        output.events.push({ date: m[1], hour: m[2] });
      }
    }

    // Strategy 2: If no <time> elements, try regex over page text
    if (output.events.length === 0) {
      const text = document.body?.textContent || "";
      const dateMatches = text.matchAll(/(\d{1,2})\.(\d{1,2})\.(\d{4})[\s\S]{0,50}?(\d{2}:\d{2})/g);
      for (const m of dateMatches) {
        const day = m[1].padStart(2, "0");
        const month = m[2].padStart(2, "0");
        const year = m[3];
        output.events.push({ date: `${year}-${month}-${day}`, hour: m[4] });
      }
    }

    if (debugMode) {
      output.debugHtml = document.body?.innerHTML?.slice(0, 15_000) || "";
    }

    return output;
  }, debug);

  await page.close();

  // Deduplicate events by date|hour
  const seen = new Set();
  const events = [];
  for (const ev of result.events) {
    const key = `${ev.date}|${ev.hour}`;
    if (!seen.has(key)) {
      seen.add(key);
      events.push(ev);
    }
  }

  return { events, debugHtml: result.debugHtml || undefined };
}
