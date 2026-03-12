/**
 * Beer Sheva Theatre scraping helpers — show listing and show detail extraction.
 *
 * Centralises all Beer-Sheva-specific scraping logic so it can be
 * imported by any script that needs it.
 *
 * Site: https://b7t.co.il/ (WordPress + Elementor)
 * Listing page: /show_categories/2025-2026/ (current season)
 * Show URLs pattern: /shows/{slug}/
 * Duration: not available on site (always null)
 * Description: no "על ההצגה" marker — uses title position in body.innerText
 */

import { fixDoubleProtocol, extractImageFromPage } from "./image.mjs";
import { setupRequestInterception } from "./browser.mjs";

// ── Constants ──────────────────────────────────────────────────

export const BEER_SHEVA_THEATRE = "תיאטרון באר שבע";
export const BEER_SHEVA_BASE = "https://b7t.co.il";
export const SHOWS_URL = "https://b7t.co.il/show_categories/2025-2026/";

// ── Venue lookup for touring events ────────────────────────────
// When a Beer Sheva show performs at another venue, the venue name
// appears in the anchor text (e.g. "אולם בית ציוני אמריקה תל אביב -יפו").
// Add entries here as new touring venues are discovered.

const TOURING_VENUES = [
  {
    matchStr: "בית ציוני אמריקה",
    venueName: "בית ציוני אמריקה",
    venueCity: "תל אביב-יפו",
  },
];

function resolveVenueFromText(rawText) {
  for (const entry of TOURING_VENUES) {
    if (rawText.includes(entry.matchStr)) {
      return { venueName: entry.venueName, venueCity: entry.venueCity };
    }
  }
  return { venueName: BEER_SHEVA_THEATRE, venueCity: "באר שבע" };
}

// ── Shows listing page scraper ─────────────────────────────────

/**
 * Scrape the Beer Sheva Theatre current season page.
 * Returns an array of `{ title, url }` with deduplicated titles,
 * sorted alphabetically in Hebrew.
 *
 * Uses Pattern A (direct link scraping) — titles are inside
 * `<h2 class="elementor-heading-title"><a href="/shows/...">` tags.
 *
 * @param {import("puppeteer").Browser} browser
 * @returns {Promise<Array<{ title: string, url: string }>>}
 */
export async function fetchShows(browser) {
  const page = await browser.newPage();
  await setupRequestInterception(page);

  await page.goto(SHOWS_URL, {
    waitUntil: "networkidle2",
    timeout: 60_000,
  });
  await page.waitForSelector('a[href*="/shows/"]', { timeout: 30_000 });

  const shows = await page.evaluate((base) => {
    const map = new Map();

    // Non-show entries that may appear in listings
    const blocklist = ["סיור מאחורי הקלעים"];

    // Pattern A: direct link scraping from h2 headings
    const links = document.querySelectorAll(
      'h2.elementor-heading-title a[href*="/shows/"]',
    );

    for (const a of links) {
      let title = a.textContent.trim();
      if (!title) continue;
      // Normalize whitespace
      title = title.replace(/\s+/g, " ").trim();

      if (title.length < 2) continue;
      if (blocklist.some((b) => title.includes(b))) continue;

      const href = a.getAttribute("href") || "";
      if (!href.includes("/shows/")) continue;

      const url = href.startsWith("http") ? href : `${base}${href}`;

      if (!map.has(title)) {
        map.set(title, url);
      }
    }

    // Fallback: also check plain a[href*="/shows/"] links not yet captured
    const allLinks = document.querySelectorAll('a[href*="/shows/"]');
    for (const a of allLinks) {
      const href = a.getAttribute("href") || "";
      if (!href.includes("/shows/")) continue;

      const url = href.startsWith("http") ? href : `${base}${href}`;

      const existingUrls = new Set([...map.values()]);
      if (existingUrls.has(url)) continue;

      // Try to find a title from a nearby heading
      let container = a.parentElement;
      let heading = null;
      for (let i = 0; i < 5 && container; i++) {
        heading =
          container.querySelector("h2.elementor-heading-title") ||
          container.querySelector("h2") ||
          container.querySelector("h3");
        if (heading) break;
        container = container.parentElement;
      }

      if (heading) {
        let title = heading.textContent.trim().replace(/\s+/g, " ");
        if (
          title &&
          title.length >= 2 &&
          !map.has(title) &&
          !blocklist.some((b) => title.includes(b))
        ) {
          map.set(title, url);
        }
      }
    }

    return [...map.entries()].map(([title, url]) => ({ title, url }));
  }, BEER_SHEVA_BASE);

  await page.close();
  return shows.sort((a, b) => a.title.localeCompare(b.title, "he"));
}

// ── Events scraper ─────────────────────────────────────────────

/**
 * Scrape performance dates/times from a Beer Sheva Theatre show detail page.
 *
 * Website format — each upcoming event is an `.event-list-item` inside
 * `.available-events-list`. The anchor text encodes all metadata:
 *
 *   {show title}  (סדרה ...) אולם {N} {DD-MM-YYYY} {HH:MM}
 *
 * Date format is DD-MM-YYYY (full 4-digit year, hyphen-separated).
 * Time is HH:MM at the end of the anchor text (trailing space).
 * Ticket URL is the `href` attribute of the anchor.
 *
 * If `.available-events-list` is absent the show has no upcoming events.
 *
 * Beer Sheva Theatre is a fixed venue (תיאטרון באר שבע, באר שבע).
 *
 * @param {import("puppeteer").Browser} browser
 * @param {string} url — show detail page URL
 * @param {{ debug?: boolean }} [options]
 * @returns {Promise<{
 *   events: Array<{ date: string, hour: string, venueName: string, venueCity: string, ticketUrl: string|null, rawText: string }>,
 *   title: string,
 *   debugHtml?: string
 * }>}
 */
export async function scrapeShowEvents(browser, url, { debug = false } = {}) {
  const page = await browser.newPage();
  await setupRequestInterception(page);

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector("h1", { timeout: 15_000 });
  // Wait for the events list (gracefully absent if show has no upcoming dates)
  await page
    .waitForSelector(".available-events-list", { timeout: 8_000 })
    .catch(() => {});

  const result = await page.evaluate((debugMode) => {
    const output = { events: [], title: "", debugHtml: null };

    // ── Page title ──
    const h1 = document.querySelector("h1");
    output.title = h1 ? h1.textContent.replace(/\s+/g, " ").trim() : "";

    // DD-MM-YYYY (full year, hyphen-separated)
    const DATE_RE = /(\d{2})-(\d{2})-(\d{4})/;
    // HH:MM at end of text (with optional trailing whitespace)
    const TIME_RE = /(\d{1,2}:\d{2})\s*$/;

    const list = document.querySelector(".available-events-list");
    if (!list) {
      if (debugMode) output.debugHtml = document.body.innerHTML.slice(0, 10_000);
      return output;
    }

    const anchors = list.querySelectorAll(".event-list-item a");
    const events = [];

    for (const a of anchors) {
      const text = a.textContent?.replace(/\s+/g, " ").trim() || "";
      const dateMatch = text.match(DATE_RE);
      const timeMatch = text.match(TIME_RE);
      if (!dateMatch) continue;

      const ticketUrl = a.getAttribute("href") || null;

      events.push({
        day: parseInt(dateMatch[1], 10),
        month: parseInt(dateMatch[2], 10),
        year: parseInt(dateMatch[3], 10),
        hour: timeMatch ? timeMatch[1] : "",
        ticketUrl,
        rawText: text.slice(0, 250),
      });
    }

    if (debugMode) {
      output.debugHtml = list.outerHTML;
    }

    output.events = events;
    return output;
  }, debug);

  await page.close();

  // Build final event objects — deduplicate by ticketUrl or date+hour
  const processed = [];
  const seen = new Set();

  for (const e of result.events) {
    const dateStr = `${e.year}-${String(e.month).padStart(2, "0")}-${String(e.day).padStart(2, "0")}`;
    const key = e.ticketUrl || `${dateStr}|${e.hour}`;

    if (!seen.has(key)) {
      seen.add(key);
      const venue = resolveVenueFromText(e.rawText);
      processed.push({
        date: dateStr,
        hour: e.hour,
        venueName: venue.venueName,
        venueCity: venue.venueCity,
        ticketUrl: e.ticketUrl,
        rawText: e.rawText,
      });
    }
  }

  result.events = processed;
  return result;
}

// ── Detail page scraper ────────────────────────────────────────

/**
 * Scrape a single Beer Sheva Theatre show detail page.
 * Returns `{ title, durationMinutes, description, imageUrl }`.
 *
 * Duration is not available on this site (always null).
 * Description uses title position in body.innerText (no "על ההצגה" marker).
 * Image uses og:image meta tag (via extractImageFromPage).
 *
 * @param {import("puppeteer").Browser} browser
 * @param {string} url
 * @returns {Promise<{ title: string, durationMinutes: number | null, description: string, imageUrl: string | null }>}
 */
export async function scrapeShowDetails(browser, url) {
  const page = await browser.newPage();
  await setupRequestInterception(page, { allowImages: true });

  await page.goto(url, { waitUntil: "networkidle2", timeout: 60_000 });
  await page.waitForSelector("h1", { timeout: 30_000 });

  const data = await page.evaluate(() => {
    // ── Title ──
    const h1 = document.querySelector("h1");
    let title = h1 ? h1.textContent.trim() : "";
    // Collapse newlines in multi-line h1 elements to a single space
    title = title
      .replace(/\n+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();

    // ── Duration ──
    // Not available on Beer Sheva Theatre site
    const durationMinutes = null;

    // ── Description ──
    // No "על ההצגה" marker — use title position in body.innerText
    // (same approach as Habima / Hebrew Theatre)
    let description = "";
    const body = document.body.innerText;
    const stopMarkers = [
      "יוצרים",
      "משתתפים",
      "תוכניית ההצגה",
      "רכישת כרטיסים",
      "טריילר",
      "גלרייה",
      "צוות היוצרים",
    ];

    const titleIdx = body.indexOf(title);
    if (titleIdx !== -1) {
      let rest = body.slice(titleIdx + title.length).trim();

      // Find the earliest stop marker
      let endIdx = rest.length;
      for (const marker of stopMarkers) {
        const idx = rest.indexOf(marker);
        if (idx !== -1 && idx < endIdx) endIdx = idx;
      }

      description = rest.slice(0, endIdx).trim();

      // Clean up
      // Remove photo credit lines
      description = description.replace(/\*?צילום:.*$/gm, "");
      description = description.replace(/צילום פוסטר:.*$/gm, "");
      // Remove asterisked lines
      description = description.replace(/^\*[^\n]*$/gm, "");
      // Remove promotional/ticket lines
      description = description.replace(/לרכישת כרטיסים[^\n]*/g, "");
      description = description.replace(/להזמנת כרטיסים[^\n]*/g, "");
      // Collapse excess newlines
      description = description.replace(/\n{3,}/g, "\n\n").trim();
    }

    // ── Cast (משתתפים) ──
    let cast = "";
    const castMarker = "משתתפים";
    const castIdx = body.indexOf(castMarker);
    if (castIdx !== -1) {
      let castRest = body.slice(castIdx + castMarker.length).trim();
      // Stop at common section boundaries
      const castStopMarkers = [
        "תוכניית ההצגה",
        "רכישת כרטיסים",
        "טריילר",
        "גלרייה",
        "מנוי לתיאטרון",
        "סיור מאחורי",
        "כל הזכויות",
        "הפרטיות שלכם",
        "Created by",
        "Powered by",
        "Facebook",
        "צור קשר",
        "הצהרת נגישות",
      ];
      let castEnd = castRest.length;
      for (const m of castStopMarkers) {
        const idx = castRest.indexOf(m);
        if (idx !== -1 && idx < castEnd) castEnd = idx;
      }
      cast = castRest.slice(0, castEnd).trim();
      // Collapse newlines/whitespace into single spaces
      cast = cast
        .replace(/\n+/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();
    }

    return { title, durationMinutes, description, cast: cast || null };
  });

  // ── Image URL (using shared extraction logic) ──
  // extractImageFromPage must be passed as the pageFunction (not as a
  // serialised argument) because Puppeteer cannot serialise functions.
  const imageUrl = await page.evaluate(extractImageFromPage);

  // Fix double-protocol URLs outside the browser context
  if (imageUrl) {
    data.imageUrl = fixDoubleProtocol(imageUrl);
  } else {
    data.imageUrl = null;
  }

  await page.close();
  return data;
}

/**
 * Scrape only cast data from a Beer Sheva show detail page.
 * Extracts from the "משתתפים" section in body text.
 * Used by the cast backfill pipeline.
 *
 * @param {import("puppeteer").Browser} browser
 * @param {string} url — detail page URL
 * @returns {Promise<string | null>}
 */
export async function scrapeCast(browser, url) {
  const page = await browser.newPage();
  await setupRequestInterception(page);
  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60_000 });
    await page.waitForSelector("h1", { timeout: 30_000 });

    const cast = await page.evaluate(() => {
      const body = document.body.innerText;
      const marker = "משתתפים";
      const idx = body.indexOf(marker);
      if (idx === -1) return "";

      let rest = body.slice(idx + marker.length).trim();

      const stopMarkers = [
        "תוכניית ההצגה",
        "רכישת כרטיסים",
        "טריילר",
        "גלרייה",
        "מנוי לתיאטרון",
        "סיור מאחורי",
        "כל הזכויות",
        "הפרטיות שלכם",
        "Created by",
        "Powered by",
        "Facebook",
        "צור קשר",
        "הצהרת נגישות",
      ];
      let end = rest.length;
      for (const m of stopMarkers) {
        const i = rest.indexOf(m);
        if (i !== -1 && i < end) end = i;
      }
      rest = rest.slice(0, end).trim();

      return rest
        .replace(/\n+/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();
    });

    return cast || null;
  } finally {
    await page.close();
    await new Promise((r) => setTimeout(r, 1500));
  }
}
