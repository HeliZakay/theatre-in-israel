/**
 * Hanut31 Theatre (תיאטרון החנות) scraping helpers.
 *
 * Centralises all Hanut31-specific scraping logic so it can be
 * imported by any script that needs it.
 *
 * Hanut31 Theatre is based in Tel Aviv (תל גיבורים 5).
 * Their website (hanut31.co.il) is built on Wix with a Wix Events
 * system — each performance occurrence is a separate event page at
 * /events/{slug} with JSON-LD structured data.
 *
 * Listing: the /events page shows a single event (not a list),
 * so event URLs are discovered via the sitemap XML.
 *
 * Event detail pages: contain JSON-LD with @type "Event" —
 * name, startDate, endDate, eventStatus, image, location, offers.
 *
 * Show detail pages: Wix freeform pages at root-level URLs
 * (e.g., /horsing-around) with title, description, cast, image.
 *
 * Because all events must be scraped from individual pages during
 * fetchListing(), the results are cached in a module-level Map so
 * that scrapeShowEvents() can read from cache without navigating.
 */

import { fixDoubleProtocol } from "./image.mjs";
import { setupRequestInterception } from "./browser.mjs";
import { parseISODatetime } from "./date.mjs";
import { parseLessinDuration } from "./duration.mjs";

// ── Constants ──────────────────────────────────────────────────

export const HANUT31_THEATRE = "תיאטרון החנות";
export const HANUT31_BASE = "https://www.hanut31.co.il";
const SITEMAP_URL = `${HANUT31_BASE}/event-pages-sitemap.xml`;

// ── Module-level event cache ──────────────────────────────────
// Populated by fetchListing(), consumed by scrapeShowEvents().
// Key: show URL (detail page or first event page), Value: { title, events[], durationMinutes }

/** @type {Map<string, { title: string, durationMinutes: number|null, events: Array<{ date: string, hour: string, ticketUrl: string|null, rawText: string }> }>} */
let _eventsCache = new Map();

// ── Helpers ───────────────────────────────────────────────────

/**
 * Extract JSON-LD Event data from a page.
 * @param {import('puppeteer').Page} page
 * @returns {Promise<object|null>}
 */
async function extractJsonLd(page) {
  return page.evaluate(() => {
    const scripts = document.querySelectorAll(
      'script[type="application/ld+json"]',
    );
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent);
        if (data["@type"] === "Event") return data;
      } catch {
        // skip malformed JSON
      }
    }
    return null;
  });
}

/**
 * Calculate duration in minutes from ISO start/end dates.
 * @param {string} startDate - ISO datetime string
 * @param {string} endDate - ISO datetime string
 * @returns {number|null}
 */
function calcDuration(startDate, endDate) {
  if (!startDate || !endDate) return null;
  const ms = new Date(endDate) - new Date(startDate);
  if (ms <= 0 || ms > 12 * 60 * 60 * 1000) return null; // sanity: 0–12h
  return Math.round(ms / 60_000);
}

/**
 * Normalise a show title for grouping.
 * Strips surrounding quotes, extra whitespace, and collapses spaces.
 */
function normaliseTitle(raw) {
  return raw
    .replace(/^["״"]+|["״"]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Shows listing + events scraper ───────────────────────────

/**
 * Fetch event URLs from the sitemap XML.
 * The /events page on this Wix site shows a single event detail,
 * not a listing, so we use the sitemap as the event URL source.
 *
 * @returns {Promise<string[]>}
 */
async function fetchEventUrlsFromSitemap() {
  const res = await fetch(`${HANUT31_BASE}/event-pages-sitemap.xml`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
}

/**
 * Fetch all upcoming events by reading the sitemap, visiting each
 * event detail page for JSON-LD, grouping by show title, caching
 * results, and returning the unique list of shows.
 *
 * @param {import('puppeteer').Browser} browser
 * @returns {Promise<Array<{title: string, url: string}>>}
 */
export async function fetchListing(browser) {
  // ── 1. Collect event page URLs from sitemap ──
  const eventUrls = await fetchEventUrlsFromSitemap();

  // Today's date for filtering out past events
  const today = new Date().toISOString().slice(0, 10);

  // ── 2. Visit each event page and extract JSON-LD ──
  /** @type {Map<string, { title: string, durationMinutes: number|null, events: Array }>} */
  const showMap = new Map();

  for (let i = 0; i < eventUrls.length; i++) {
    const eventUrl = eventUrls[i];
    const eventPage = await browser.newPage();
    await setupRequestInterception(eventPage);

    try {
      await eventPage.goto(eventUrl, {
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      });

      // JSON-LD is server-rendered, should be available quickly
      try {
        await eventPage.waitForSelector(
          'script[type="application/ld+json"]',
          { timeout: 10_000 },
        );
      } catch {
        // No JSON-LD — skip
      }

      const jsonLd = await extractJsonLd(eventPage);
      if (jsonLd && jsonLd.name && jsonLd.startDate) {
        // Skip cancelled events
        const cancelled =
          jsonLd.eventStatus &&
          jsonLd.eventStatus.includes("EventCancelled");

        if (!cancelled) {
          const title = normaliseTitle(jsonLd.name);
          const parsed = parseISODatetime(jsonLd.startDate);

          if (parsed && parsed.date >= today) {
            const duration = calcDuration(jsonLd.startDate, jsonLd.endDate);

            const event = {
              date: parsed.date,
              hour: parsed.hour,
              ticketUrl: eventUrl,
              rawText: `${title} | ${parsed.date} ${parsed.hour}`,
            };

            const key = title.toLowerCase();
            const existing = showMap.get(key);
            if (existing) {
              existing.events.push(event);
              if (duration && (!existing.durationMinutes || duration > existing.durationMinutes)) {
                existing.durationMinutes = duration;
              }
            } else {
              showMap.set(key, {
                title,
                durationMinutes: duration,
                events: [event],
              });
            }
          }
        }
      }
    } catch {
      // Skip failed event pages
    } finally {
      try { await eventPage.close(); } catch { /* already closed */ }
    }

    // Polite delay between event page fetches
    if (i < eventUrls.length - 1) {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  // ── 3. Build cache and return show list ──
  _eventsCache = new Map();

  const shows = [];
  for (const [, data] of showMap) {
    // Use first event URL as the show's URL
    const url = data.events[0]?.ticketUrl ?? "";
    _eventsCache.set(url, {
      title: data.title,
      durationMinutes: data.durationMinutes,
      events: data.events,
    });
    shows.push({ title: data.title, url });
  }

  return shows.sort((a, b) => a.title.localeCompare(b.title, "he"));
}

// ── Per-show event scraper (cache reader) ─────────────────────

/**
 * Return cached events for a specific show URL.
 *
 * This function does NOT navigate — it reads from the module-level
 * _eventsCache populated by fetchListing(). Deduplicates by date+hour.
 *
 * @param {import('puppeteer').Browser} browser — unused (kept for API compat)
 * @param {string} url — show page URL
 * @param {{ debug?: boolean }} [opts]
 * @returns {Promise<{ events: Array<{ date: string, hour: string, ticketUrl: string|null, rawText: string }>, title: string }>}
 */
export async function scrapeShowEvents(browser, url, { debug = false } = {}) {
  const cached = _eventsCache.get(url);
  if (!cached) {
    return { events: [], title: "" };
  }

  // Deduplicate by date+hour
  const seen = new Set();
  const events = [];
  for (const ev of cached.events) {
    const key = `${ev.date}|${ev.hour}`;
    if (seen.has(key)) continue;
    seen.add(key);
    events.push(ev);
  }

  return { events, title: cached.title };
}

// ── Detail page scraper ───────────────────────────────────────

/**
 * Scrape a single Hanut31 show detail page for title, duration,
 * description, cast, and image.
 *
 * If the URL is an event page (/events/...), falls back to JSON-LD
 * data for the basics and extracts what it can.
 *
 * @param {import('puppeteer').Browser} browser
 * @param {string} url — full URL of the show page
 * @returns {Promise<{title: string, durationMinutes: number|null, description: string, imageUrl: string|null, cast: string|null}>}
 */
export async function scrapeShowDetails(browser, url) {
  const page = await browser.newPage();
  await setupRequestInterception(page, { allowImages: true });

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });

  // Check if this is an event page — use JSON-LD if so
  const isEventPage = url.includes("/events/");

  if (isEventPage) {
    try {
      await page.waitForSelector('script[type="application/ld+json"]', {
        timeout: 10_000,
      });
    } catch {
      // no JSON-LD
    }

    const jsonLd = await extractJsonLd(page);
    const duration = jsonLd
      ? calcDuration(jsonLd.startDate, jsonLd.endDate)
      : null;
    const imageUrl = jsonLd?.image?.url
      ? fixDoubleProtocol(jsonLd.image.url)
      : null;

    await page.close();

    return {
      title: jsonLd ? normaliseTitle(jsonLd.name) : "",
      durationMinutes: duration,
      description: jsonLd?.description || "",
      imageUrl,
      cast: null,
    };
  }

  // ── Show detail page (Wix freeform) ──
  try {
    await page.waitForSelector("h1, h2", { timeout: 30_000 });
  } catch {
    // heading may not exist
  }

  // Wix rendering settle delay
  await new Promise((r) => setTimeout(r, 3000));

  const data = await page.evaluate(() => {
    // ── Title ──
    const h1 = document.querySelector("h1");
    let title = h1 ? h1.textContent.trim() : "";
    title = title.replace(/^["״"]+|["״"]+$/g, "").trim();
    title = title.replace(/\s+/g, " ").trim();

    // ── Body text for parsing ──
    const body = document.body.innerText;

    // ── Duration ──
    let durationText = null;
    const durationMatch = body.match(/משך\s+ההצגה:?\s*([^\n]+)/);
    if (durationMatch) {
      durationText = durationMatch[0].trim();
    }

    // ── Description ──
    let description = "";
    const titleIdx = body.indexOf(title);
    const afterTitle = titleIdx !== -1 ? body.slice(titleIdx + title.length) : body;

    const stopMarkers = [
      "יוצרים:",
      "משתתפים:",
      "מאת:",
      "מאת ",
      "בימוי:",
      "בימוי ",
      "עיבוד ובימוי",
      "משחקים:",
      "בכיכוב:",
      "לחנים:",
      "תאורה:",
      "תפאורה:",
      "תלבושות:",
      "משך ההצגה",
      "כתיבה:",
      "עיצוב:",
      "הפקה:",
    ];

    let endIdx = afterTitle.length;
    for (const marker of stopMarkers) {
      const idx = afterTitle.indexOf(marker);
      if (idx !== -1 && idx < endIdx) endIdx = idx;
    }

    description = afterTitle.slice(0, endIdx).trim();
    description = description.replace(/\n{3,}/g, "\n\n").trim();
    // Remove very short descriptions that are just navigation remnants
    if (description.length < 10) description = "";

    // ── Cast ──
    let cast = null;
    const castMarkers = [
      "משתתפים:",
      "בכיכובם של:",
      "בכיכובם של",
      "בכיכוב:",
      "שחקנים:",
      "משחקים:",
    ];

    let castStart = -1;
    let markerLen = 0;
    for (const marker of castMarkers) {
      const idx = body.indexOf(marker);
      if (idx !== -1 && (castStart === -1 || idx < castStart)) {
        castStart = idx;
        markerLen = marker.length;
      }
    }

    if (castStart !== -1) {
      let raw = body.slice(castStart + markerLen).replace(/^\s+/, "");

      const endCastMarkers = [
        "מאת:",
        "מאת ",
        "בימוי:",
        "בימוי ",
        "עיבוד",
        "תאורה:",
        "תפאורה:",
        "תלבושות:",
        "מוזיקה:",
        "עיצוב:",
        "הפקה:",
        "משך ה",
        "צילום:",
        "תרגום:",
        "ניהול ",
        "כתיבה:",
      ];

      let endIdx = raw.length;
      for (const marker of endCastMarkers) {
        const idx = raw.indexOf(marker);
        if (idx !== -1 && idx < endIdx) endIdx = idx;
      }

      const dblNewline = raw.indexOf("\n\n");
      if (dblNewline !== -1 && dblNewline < endIdx) endIdx = dblNewline;

      raw = raw.slice(0, endIdx).trim();
      raw = raw.replace(/\n+/g, ", ");
      raw = raw.replace(/,\s*,/g, ",");
      raw = raw.replace(/\s{2,}/g, " ");
      raw = raw.replace(/,\s*$/, "").trim();

      cast = raw || null;
    }

    return { title, durationText, description, cast };
  });

  // Parse duration in Node context
  data.durationMinutes = parseLessinDuration(data.durationText);
  delete data.durationText;

  // Fall back to cached duration from JSON-LD if page didn't have it
  if (!data.durationMinutes) {
    const cached = _eventsCache.get(url);
    if (cached?.durationMinutes) {
      data.durationMinutes = cached.durationMinutes;
    }
  }

  // ── Image URL ──
  const imageUrl = await page.evaluate(() => {
    const SKIP_SRC = ["logo", "icon", "facebook", "instagram", "youtube", "twitter", "tiktok"];
    const SKIP_ALT = ["לוגו", "logo", "icon"];

    function isSkipped(src, alt) {
      const lowerSrc = (src || "").toLowerCase();
      const lowerAlt = (alt || "").toLowerCase();
      return (
        SKIP_SRC.some((s) => lowerSrc.includes(s)) ||
        SKIP_ALT.some((s) => lowerAlt.includes(s))
      );
    }

    // Strategy 1: Large visible image not in header/footer/nav
    const imgs = [...document.querySelectorAll("img")];
    for (const img of imgs) {
      const src = img.src || img.dataset?.src || "";
      if (!src || isSkipped(src, img.alt)) continue;
      if (img.closest("nav") || img.closest("footer") || img.closest("header")) continue;
      const rect = img.getBoundingClientRect();
      if (rect.width > 200 && rect.height > 150) return src;
    }

    // Strategy 2: og:image fallback
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) {
      const content = ogImage.getAttribute("content");
      if (content && !isSkipped(content, "")) return content;
    }

    return null;
  });

  if (imageUrl) {
    data.imageUrl = fixDoubleProtocol(imageUrl);
  } else {
    data.imageUrl = null;
  }

  await page.close();
  return data;
}
