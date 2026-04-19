/**
 * Israeli Hour Theatre (תיאטרון השעה הישראלי) scraping helpers.
 *
 * Their website (teatron-hashaa.smarticket.co.il) is built on the
 * SmartTicket platform (Cloudflare protected).
 *
 * The theatre is TOURING — each event has its own venue via event_place.
 *
 * Primary data source: public JSON API at /api/shows which returns
 * all shows with events, venues, durations, descriptions, and images.
 * fetchListing() caches event data in a module-level Map so that
 * scrapeShowEvents() can read from cache without navigating again.
 *
 * Detail pages: SmartTicket event pages with JSON-LD (@type Event),
 * show title in h1, description, cast, credits, og:image, and
 * ISO 8601 duration (PT150M).
 */

import { setupRequestInterception } from "./browser.mjs";
import { fixDoubleProtocol } from "./image.mjs";
import { parseLessinDuration } from "./duration.mjs";
import { resolveVenueCity } from "./venues.mjs";

export { resolveVenueCity };

// ── Constants ──────────────────────────────────────────────────

export const HASHAA_THEATRE = "תיאטרון השעה הישראלי";
const BASE_URL = "https://teatron-hashaa.smarticket.co.il";
const API_URL = "https://teatron-hashaa.smarticket.co.il/api/shows";

// ── Module-level event cache ──────────────────────────────────
// Populated by fetchListing(), consumed by scrapeShowEvents().
// Key: normalised show URL, Value: { title, detailUrl, events[] }

/** @type {Map<string, { title: string, detailUrl: string, durationMinutes: number|null, cast: string|null, events: Array<{ date: string, hour: string, venueName: string, rawText: string }> }>} */
let _eventsCache = new Map();

// ── Helpers ───────────────────────────────────────────────────

function normaliseUrl(url) {
  try {
    const u = new URL(url, BASE_URL);
    return (u.origin + u.pathname).replace(/\/+$/, "").replace(/\?.*$/, "");
  } catch {
    return url.replace(/\?.*$/, "").replace(/\/+$/, "");
  }
}

function parsePTDuration(pt) {
  if (!pt) return null;
  const m = pt.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return null;
  const hours = m[1] ? parseInt(m[1], 10) : 0;
  const mins = m[2] ? parseInt(m[2], 10) : 0;
  return hours * 60 + mins || null;
}

function parseCastFromHtml(html) {
  if (!html) return null;
  const text = html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ");

  const castMarkers = [
    "שחקנים:",  "שחקנים",
    "משתתפים:", "משתתפים",
    "בכיכוב:",  "בכיכוב",
    "בהשתתפות:", "בהשתתפות",
    "משחקים:",
    "משחק:",
  ];

  const hebrewRe = /[\u0590-\u05FF]/;
  let castStart = -1;
  let markerLen = 0;
  for (const marker of castMarkers) {
    const idx = text.indexOf(marker);
    if (idx !== -1 && (castStart === -1 || idx < castStart)) {
      if (idx > 0 && hebrewRe.test(text[idx - 1])) continue;
      castStart = idx;
      markerLen = marker.length;
    }
  }
  if (castStart === -1) return null;

  let raw = text.slice(castStart + markerLen);
  raw = raw.replace(/^[\s|]+/, "");

  const endMarkers = [
    "מאת:", "מאת ",
    "בימוי:", "בימוי ",
    "במאי:", "במאית:",
    "עיבוד", "ע. במאי", "ע.במאי",
    "תפאורה:", "תלבושות:", "תאורה:",
    "מוזיקה:", "הפקה:", "צילום:",
    "עיצוב:", "ניהול ",
    "משך ", "משך:",
    "ייעוץ",
    "מיועד לגילאי",
    "הוראות הגעה",
    "מן הביקורות",
    "צפה בסרטון",
  ];

  let castEnd = raw.length;
  for (const marker of endMarkers) {
    const idx = raw.indexOf(marker);
    if (idx !== -1 && idx < castEnd) castEnd = idx;
  }

  const dblNewline = raw.indexOf("\n\n");
  if (dblNewline !== -1 && dblNewline < castEnd) castEnd = dblNewline;

  raw = raw.slice(0, castEnd).trim();
  raw = raw.replace(/\n+/g, ", ");
  raw = raw.replace(/,\s*,/g, ",");
  raw = raw.replace(/\s{2,}/g, " ");
  raw = raw.replace(/,\s*$/, "").replace(/\.\s*$/, "").trim();

  return raw || null;
}

/**
 * Fetch JSON from the API. Tries native fetch first, falls back
 * to Puppeteer stealth if Cloudflare blocks the request.
 */
async function fetchApiShows(browser) {
  // Try direct fetch first
  try {
    const res = await fetch(API_URL, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch {
    // fall through to Puppeteer
  }

  // Fallback: use Puppeteer (stealth) to fetch the API endpoint
  const page = await browser.newPage();
  await setupRequestInterception(page);

  await page.goto(API_URL, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await new Promise((r) => setTimeout(r, 3000));

  const text = await page.evaluate(() => document.body.innerText || "");
  await page.close();

  return JSON.parse(text);
}

// ── Shows listing + events scraper (API) ─────────────────────

/**
 * Fetch the list of current shows and cache their events from the API.
 *
 * @param {import('puppeteer').Browser} browser
 * @returns {Promise<Array<{title: string, url: string}>>}
 */
export async function fetchListing(browser) {
  const apiShows = await fetchApiShows(browser);

  /** @type {Map<string, { title: string, detailUrl: string, events: Array }>} */
  const cache = new Map();

  for (const show of apiShows) {
    if (!show.title || !show.url) continue;

    const detailUrl = `${BASE_URL}/${show.url}`;
    const key = normaliseUrl(detailUrl);

    const events = [];
    if (Array.isArray(show.events)) {
      for (const ev of show.events) {
        if (!ev.show_date || !ev.show_time) continue;

        const date = ev.show_date;
        const hour = ev.show_time.slice(0, 5);
        const venueName = ev.event_place || "";
        const rawText = `${date} ${hour} ${venueName}`.trim();

        events.push({ date, hour, venueName, rawText });
      }
    }

    const durationMinutes = show.events?.[0]?.duration || null;
    const cast = parseCastFromHtml(show.content);

    cache.set(key, { title: show.title, detailUrl, events, durationMinutes, cast });
  }

  _eventsCache = cache;

  const shows = [...cache.entries()].map(([, data]) => ({
    title: data.title,
    url: data.detailUrl,
  }));
  return shows.sort((a, b) => a.title.localeCompare(b.title, "he"));
}

// ── Per-show event scraper (cache reader) ─────────────────────

/**
 * Return cached events for a specific show URL.
 *
 * @param {import('puppeteer').Browser} browser
 * @param {string} url
 * @param {{ debug?: boolean }} [opts]
 * @returns {Promise<{ events: Array<{ date: string, hour: string, venueName: string, rawText: string }>, title: string }>}
 */
export async function scrapeShowEvents(browser, url, { debug = false } = {}) {
  const key = normaliseUrl(url);
  const cached = _eventsCache.get(key);

  if (!cached) {
    return { events: [], title: "" };
  }

  // Deduplicate by date+hour+venue
  const seen = new Set();
  const events = [];
  for (const ev of cached.events) {
    const k = `${ev.date}|${ev.hour}|${ev.venueName}`;
    if (seen.has(k)) continue;
    seen.add(k);
    events.push(ev);
  }

  return { events, title: cached.title };
}

// ── Detail page scraper ───────────────────────────────────────

/**
 * Scrape a single show detail page for title, duration,
 * description, cast, and image.
 *
 * @param {import('puppeteer').Browser} browser
 * @param {string} url
 * @returns {Promise<{title: string, durationMinutes: number|null, description: string, imageUrl: string|null, cast: string|null}>}
 */
export async function scrapeShowDetails(browser, url) {
  const page = await browser.newPage();
  await setupRequestInterception(page, { allowImages: true });

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });

  try {
    await page.waitForSelector("h1, h2, img", { timeout: 15_000 });
  } catch {
    // continue
  }
  await new Promise((r) => setTimeout(r, 3000));

  const data = await page.evaluate(() => {
    // ── Title ──
    const h1 = document.querySelector("h1");
    let title = h1 ? h1.textContent.trim() : "";
    if (!title) {
      const h2 = document.querySelector("h2");
      title = h2 ? h2.textContent.trim() : "";
    }
    title = title.replace(/\s+/g, " ").trim();

    // ── JSON-LD for duration ──
    let ptDuration = null;
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      try {
        const json = JSON.parse(script.textContent);
        if (json["@type"] === "Event" && json.duration) {
          ptDuration = json.duration;
          break;
        }
      } catch {}
    }

    // ── Body text for parsing ──
    const body = document.body.innerText || "";

    // ── Duration (text fallback) ──
    let durationText = null;
    const durationMatch = body.match(/משך:?\s*([^\n]+)/);
    if (durationMatch) {
      durationText = durationMatch[0].trim();
    }

    // ── Description ──
    let description = "";
    const detailsIdx = body.indexOf("פרטים נוספים\n");
    const searchStart = detailsIdx !== -1
      ? detailsIdx + "פרטים נוספים\n".length
      : body.indexOf(title) + title.length;
    const afterHeader = body.slice(searchStart);

    const stopMarkers = [
      "מאת:", "מאת ",
      "עיבוד ובימוי", "עיבוד, בימוי",
      "בימוי:", "בימוי ",
      "במאי:", "במאית:",
      "שחקנים:", "שחקנים",
      "משתתפים:", "משתתפים",
      "בכיכוב:", "בכיכוב",
      "בהשתתפות",
      "משחקים:", "משחקים",
      "משחק:",
      "תפאורה:", "תלבושות:", "תאורה:",
      "מוזיקה:", "הפקה:", "צילום:",
      "ע. במאי:",
      "משך:", "משך ה",
      "ייעוץ אמנותי",
      "הוראות הגעה",
      "מן הביקורות",
      "צפה בסרטון",
    ];

    let endIdx = afterHeader.length;
    for (const marker of stopMarkers) {
      const idx = afterHeader.indexOf(marker);
      if (idx !== -1 && idx < endIdx) endIdx = idx;
    }

    description = afterHeader.slice(0, endIdx).trim();
    description = description.replace(/^.*תיאטרון השעה.*\n/gm, "");
    description = description.replace(/^ביום\s.*\n/gm, "");
    description = description.replace(/^בשעה\s.*\n/gm, "");
    description = description.replace(/^פתיחת דלתות.*\n/gm, "");
    description = description.replace(/^מחיר\s.*\n/gm, "");
    description = description.replace(/^הזמן עכשיו.*\n/gm, "");
    description = description.replace(/^\d{1,2}\/\d{2}\/\d{4}.*\n/gm, "");
    description = description.replace(
      new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\n`, "gm"),
      "",
    );
    description = description.replace(/\n{3,}/g, "\n\n").trim();
    if (description.length < 20) description = "";

    // ── Cast ──
    let cast = null;
    const castMarkers = [
      "שחקנים:",
      "שחקנים",
      "משתתפים:",
      "משתתפים",
      "בכיכוב:",
      "בכיכוב",
      "בכיכובם של:",
      "בהשתתפות",
      "משחקים:",
      "משחקים",
      "משחק:",
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
        "מאת:", "מאת ",
        "בימוי:", "בימוי ",
        "במאי:", "במאית:",
        "עיבוד", "ע. במאי",
        "תפאורה:", "תלבושות:", "תאורה:",
        "מוזיקה:", "הפקה:", "צילום:",
        "עיצוב:", "ניהול ",
        "משך ", "משך:",
        "ייעוץ",
        "הוראות הגעה",
        "מן הביקורות",
        "צפה בסרטון",
      ];

      let castEnd = raw.length;
      for (const marker of endCastMarkers) {
        const idx = raw.indexOf(marker);
        if (idx !== -1 && idx < castEnd) castEnd = idx;
      }

      const dblNewline = raw.indexOf("\n\n");
      if (dblNewline !== -1 && dblNewline < castEnd) castEnd = dblNewline;

      raw = raw.slice(0, castEnd).trim();
      raw = raw.replace(/\n+/g, ", ");
      raw = raw.replace(/,\s*,/g, ",");
      raw = raw.replace(/\s{2,}/g, " ");
      raw = raw.replace(/,\s*$/, "").trim();

      cast = raw || null;
    }

    // ── Image ──
    let imageUrl = null;
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) {
      imageUrl = ogImage.getAttribute("content") || null;
    }
    if (!imageUrl) {
      const imgs = [...document.querySelectorAll("img")];
      for (const img of imgs) {
        const src = img.src || img.dataset?.src || "";
        if (!src) continue;
        if (img.closest("nav") || img.closest("footer") || img.closest("header")) continue;
        const lowerSrc = src.toLowerCase();
        if (lowerSrc.includes("logo") || lowerSrc.includes("icon")) continue;
        if (src.includes("no_pic")) continue;
        const alt = (img.alt || "").toLowerCase();
        if (alt.includes("logo")) continue;
        const rect = img.getBoundingClientRect();
        if (rect.width > 100 && rect.height > 100) {
          imageUrl = src;
          break;
        }
      }
    }

    return { title, ptDuration, durationText, description, cast, imageUrl };
  });

  data.durationMinutes = parsePTDuration(data.ptDuration)
    || parseLessinDuration(data.durationText);
  delete data.ptDuration;
  delete data.durationText;

  // Fall back to cached API data if page didn't have duration or cast
  if (!data.durationMinutes || !data.cast) {
    const cached = _eventsCache.get(normaliseUrl(url));
    if (cached) {
      if (!data.durationMinutes && cached.durationMinutes) {
        data.durationMinutes = cached.durationMinutes;
      }
      if (!data.cast && cached.cast) {
        data.cast = cached.cast;
      }
    }
  }

  if (data.imageUrl) {
    data.imageUrl = fixDoubleProtocol(data.imageUrl);
  }

  await page.close();
  return data;
}
