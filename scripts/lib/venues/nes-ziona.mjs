/**
 * Nes Ziona venue scraper — scrapes events from היכל התרבות נס ציונה.
 *
 * Site: tarbut-nz.co.il (WordPress + Elementor)
 * Listing page shows event cards with title, one date, time, and detail URL.
 * Some events have multiple dates — detail pages list all of them.
 */

import { setupRequestInterception } from "../browser.mjs";

export const VENUE_NAME = "היכל התרבות נס ציונה";
export const VENUE_CITY = "נס ציונה";
export const LISTING_URL = "https://tarbut-nz.co.il/%D7%9E%D7%95%D7%A4%D7%A2%D7%99%D7%9D/";

const MAX_LOAD_MORE_CLICKS = 30;

/**
 * Fetch all event listings from the venue's events page.
 * Handles the "load more" button to get all events.
 *
 * @param {import("puppeteer").Browser} browser
 * @returns {Promise<{ title: string, detailUrl: string }[]>}
 */
export async function fetchListing(browser) {
  const page = await browser.newPage();
  await setupRequestInterception(page, { allowStylesheets: true });

  await page.goto(LISTING_URL, { waitUntil: "networkidle2", timeout: 60_000 });
  await page.waitForSelector(".ue_post_grid_item", { timeout: 15_000 });

  // Click "load more" until no new items appear.
  // Use page.evaluate to click — puppeteer's ElementHandle.click() can
  // miss when the button's computed visibility depends on stylesheets
  // that request-interception may have blocked.
  for (let i = 0; i < MAX_LOAD_MORE_CLICKS; i++) {
    const prevCount = await page.$$eval(".ue_post_grid_item", (els) => els.length);

    const clicked = await page.evaluate(() => {
      const btn = document.querySelector(".uc-filter-load-more__link");
      if (!btn) return false;
      const style = window.getComputedStyle(btn);
      if (style.display === "none") return false;
      btn.click();
      return true;
    });
    if (!clicked) break;

    // Wait for new items to load
    await page.waitForFunction(
      (prev) =>
        document.querySelectorAll(".ue_post_grid_item").length > prev,
      { timeout: 10_000 },
      prevCount,
    ).catch(() => {});

    const newCount = await page.$$eval(".ue_post_grid_item", (els) => els.length);
    if (newCount === prevCount) break; // no new items — done

    // Small pause to let AJAX settle
    await new Promise((r) => setTimeout(r, 500));
  }

  const listings = await page.evaluate(() => {
    const cards = document.querySelectorAll(".ue_post_grid_item");
    const results = [];
    const seen = new Set();

    for (const card of cards) {
      const titleEl = card.querySelector(".uc_post_title a");
      if (!titleEl) continue;

      const title = titleEl.textContent?.trim() || "";
      const detailUrl = titleEl.getAttribute("href") || "";
      if (!title || !detailUrl) continue;

      // Deduplicate by URL (same show may not appear twice, but just in case)
      if (seen.has(detailUrl)) continue;
      seen.add(detailUrl);

      results.push({ title, detailUrl });
    }

    return results;
  });

  await page.close();
  return listings;
}

/**
 * Scrape all performance dates from an event detail page.
 *
 * @param {import("puppeteer").Browser} browser
 * @param {string} detailUrl
 * @param {{ debug?: boolean }} [options]
 * @returns {Promise<{ events: { date: string, hour: string }[], debugHtml?: string }>}
 */
export async function scrapeEventDetail(browser, detailUrl, { debug = false } = {}) {
  const page = await browser.newPage();
  await setupRequestInterception(page);

  await page.goto(detailUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });

  // Wait for page content to be present
  await page.waitForSelector(".elementor", { timeout: 15_000 }).catch(() => {});

  const result = await page.evaluate((debugMode) => {
    const output = { events: [], debugHtml: null };

    // Dates are in list items. Look for patterns like "DD/MM/YYYY dayname HH:MM"
    const DATE_RE = /(\d{2})\/(\d{2})\/(\d{4})/;
    const TIME_RE = /(\d{1,2}:\d{2})/;

    // Strategy 1: Look for list items containing dates
    const allLis = document.querySelectorAll("li");
    for (const li of allLis) {
      const text = li.textContent?.replace(/\s+/g, " ").trim() || "";
      const dateMatch = text.match(DATE_RE);
      if (!dateMatch) continue;

      const timeMatch = text.match(TIME_RE);
      const day = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10);
      const year = parseInt(dateMatch[3], 10);

      output.events.push({
        day,
        month,
        year,
        hour: timeMatch ? timeMatch[1] : "",
      });
    }

    // Strategy 2: If no list items found, scan all text nodes for date patterns
    if (output.events.length === 0) {
      const body = document.body?.textContent || "";
      const globalDateRe = /(\d{2})\/(\d{2})\/(\d{4})/g;
      let match;
      while ((match = globalDateRe.exec(body)) !== null) {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const year = parseInt(match[3], 10);

        // Try to find time near this date in the surrounding text
        const surrounding = body.slice(
          Math.max(0, match.index - 20),
          match.index + match[0].length + 30,
        );
        const timeMatch = surrounding.match(/(\d{1,2}:\d{2})/);

        output.events.push({
          day,
          month,
          year,
          hour: timeMatch ? timeMatch[1] : "",
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
