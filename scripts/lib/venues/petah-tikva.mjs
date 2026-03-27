/**
 * Petah Tikva venue scraper — scrapes events from היכל התרבות פתח תקווה.
 *
 * Site: petah-tikva.smarticket.co.il (SmartTicket platform)
 * Listing page (/תיאטרון) shows event cards — each card is one performance date.
 * Detail pages have JSON-LD with structured startDate — reliable and easy to parse.
 * Cloudflare protected — requires puppeteer-extra stealth plugin.
 */

import { setupRequestInterception } from "../browser.mjs";

export const VENUE_NAME = "היכל התרבות פתח תקווה";
export const VENUE_CITY = "פתח תקווה";
export const LISTING_URL =
  "https://petah-tikva.smarticket.co.il/%D7%AA%D7%99%D7%90%D7%98%D7%A8%D7%95%D7%9F";

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

  // Wait for event links to render
  await page.waitForSelector('a[href*="/?id="]', { timeout: 15_000 });

  const listings = await page.evaluate(() => {
    // Each event card is an <a class="show"> with href containing ?id=
    const cards = document.querySelectorAll('a.show[href*="/?id="]');
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
 * Scrape event date/time from a detail page using JSON-LD structured data.
 * Each detail page represents a single performance date.
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

    // Extract JSON-LD with @type Event
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent);
        if (data["@type"] !== "Event" || !data.startDate) continue;

        // startDate format: "2026-03-25T20:30:00"
        const dt = data.startDate;
        const date = dt.slice(0, 10); // "YYYY-MM-DD"
        const timePart = dt.slice(11, 16); // "HH:MM"
        const hour = /^\d{2}:\d{2}$/.test(timePart) ? timePart : "";

        output.events.push({ date, hour });
      } catch {
        // skip malformed JSON-LD
      }
    }

    if (debugMode) {
      output.debugHtml = document.body?.innerHTML?.slice(0, 15_000) || "";
    }

    return output;
  }, debug);

  await page.close();

  return { events: result.events, debugHtml: result.debugHtml || undefined };
}
