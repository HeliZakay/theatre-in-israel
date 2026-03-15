/**
 * Kiryat Motzkin venue scraper — scrapes events from היכל התיאטרון קריית מוצקין.
 *
 * Site: mozkin-theater.co.il (custom CMS)
 * Listing page shows event cards (.events-item) with infinite scroll pagination.
 * Each card links to a detail page at /לוח-אירועים/{id}/{slug}.
 * Detail pages embed Unix timestamps in a JS eventPage.init() call:
 *   "date":[1773599400,1773685800,...]
 * Time is derived from the timestamps.
 */

import { setupRequestInterception } from "../browser.mjs";

export const VENUE_NAME = "היכל התיאטרון קריית מוצקין";
export const VENUE_CITY = "קריית מוצקין";
export const LISTING_URL =
  "https://www.mozkin-theater.co.il/%D7%9C%D7%95%D7%97-%D7%90%D7%99%D7%A8%D7%95%D7%A2%D7%99%D7%9D";

/**
 * Fetch all show listings from the venue's events page.
 * The page uses infinite scroll — we scroll until no new cards appear,
 * then extract unique detail-page links.
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

  // Wait for initial event cards to render
  await page
    .waitForSelector(".events-item", { timeout: 15_000 })
    .catch(() => {});

  // Scroll to load all items (infinite scroll)
  let prevCount = 0;
  for (let attempt = 0; attempt < 30; attempt++) {
    const count = await page.$$eval(".events-item", (els) => els.length);
    if (count === prevCount && attempt > 0) break;
    prevCount = count;
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise((r) => setTimeout(r, 1500));
  }

  const listings = await page.evaluate(() => {
    const cards = document.querySelectorAll(".events-item");
    const results = [];
    const seen = new Set();

    for (const card of cards) {
      const link = card.querySelector("a[href*='/לוח-אירועים/'], a[href*='/%D7%9C%D7%95%D7%97-%D7%90%D7%99%D7%A8%D7%95%D7%A2%D7%99%D7%9D/']");
      if (!link) continue;

      const href = link.getAttribute("href") || "";
      if (!href || href === "#") continue;

      const url = href.startsWith("http")
        ? href
        : new URL(href, location.origin).href;

      if (seen.has(url)) continue;
      seen.add(url);

      // Get title from heading inside card
      const titleEl = card.querySelector("h4 a, h5 a, h3 a");
      const text = titleEl?.textContent?.trim() || link.textContent?.trim() || "";
      if (!text) continue;

      results.push({ title: text, detailUrl: url });
    }

    return results;
  });

  await page.close();

  // Deduplicate by URL, keeping shortest title
  const byUrl = new Map();
  for (const item of listings) {
    const existing = byUrl.get(item.detailUrl);
    if (!existing || item.title.length < existing.title.length) {
      byUrl.set(item.detailUrl, item);
    }
  }

  return [...byUrl.values()];
}

/**
 * Scrape all performance dates from a show detail page.
 *
 * The page embeds Unix timestamps in a JS call:
 *   eventPage.init({..."date":[1773599400,1773685800,...]...})
 *
 * We extract these timestamps and convert to ISO date strings.
 * Falls back to Hebrew date text regex if no timestamps found.
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

  // Wait a moment for scripts to load
  await new Promise((r) => setTimeout(r, 2000));

  const result = await page.evaluate((debugMode) => {
    const output = { events: [], debugHtml: null };

    // Convert Unix timestamp to Israel-time date/time parts.
    // getHours()/getDate() use the local timezone which is UTC on GitHub Actions,
    // so we must explicitly format in Asia/Jerusalem to get correct Israeli times.
    function tsToIsrael(ts) {
      const d = new Date(ts * 1000);
      const parts = new Intl.DateTimeFormat("en-IL", {
        timeZone: "Asia/Jerusalem",
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", hour12: false,
      }).formatToParts(d);
      const get = (type) => parts.find((p) => p.type === type)?.value || "";
      return {
        year: parseInt(get("year"), 10),
        month: parseInt(get("month"), 10),
        day: parseInt(get("day"), 10),
        hour: `${get("hour")}:${get("minute")}`,
      };
    }

    // Primary: find Unix timestamps in page scripts
    // Pattern: "date":[1773599400,1773685800,...] in eventPage.init()
    const scripts = document.querySelectorAll("script");
    for (const script of scripts) {
      const text = script.textContent || "";
      // Match "date":[...] or 'date':[...]
      const dateArrayMatch = text.match(/["']date["']\s*:\s*\[([^\]]+)\]/);
      if (dateArrayMatch) {
        const timestamps = dateArrayMatch[1].split(",").map((s) => parseInt(s.trim(), 10));
        for (const ts of timestamps) {
          if (isNaN(ts) || ts < 1_000_000_000) continue;
          output.events.push(tsToIsrael(ts));
        }
        break;
      }
    }

    // Fallback: look for "fromDate" individual timestamps
    if (output.events.length === 0) {
      const scripts2 = document.querySelectorAll("script");
      for (const script of scripts2) {
        const text = script.textContent || "";
        const fromDateMatch = text.match(/["']fromDate["']\s*:\s*["'](\d+)["']/);
        if (fromDateMatch) {
          const ts = parseInt(fromDateMatch[1], 10);
          if (!isNaN(ts) && ts > 1_000_000_000) {
            output.events.push(tsToIsrael(ts));
          }
        }
      }
    }

    // Fallback 2: body text date regex DD/MM/YYYY HH:MM
    if (output.events.length === 0) {
      const DATE_TIME_RE = /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}:\d{2})/g;
      const body = document.body?.textContent || "";
      let match;
      while ((match = DATE_TIME_RE.exec(body)) !== null) {
        output.events.push({
          day: parseInt(match[1], 10),
          month: parseInt(match[2], 10),
          year: parseInt(match[3], 10),
          hour: match[4],
        });
      }
    }

    if (debugMode) {
      output.debugHtml = document.body?.innerHTML?.slice(0, 15_000) || "";
    }

    return output;
  }, debug);

  await page.close();

  // Convert to ISO date strings and deduplicate
  const seen = new Set();
  const events = [];
  for (const ev of result.events) {
    const date = `${ev.year}-${String(ev.month).padStart(2, "0")}-${String(ev.day).padStart(2, "0")}`;
    const hour = ev.hour || "";
    const key = `${date}|${hour}`;
    if (seen.has(key)) continue;
    seen.add(key);
    events.push({ date, hour });
  }

  return { events, debugHtml: result.debugHtml || undefined };
}
