/**
 * Niko Nitai Theatre (תיאטרון ניקו ניתאי) scraping helpers.
 *
 * Centralises all Niko Nitai-specific scraping logic so it can be
 * imported by any script that needs it.
 *
 * The theatre is based in Tel Aviv (תל גיבורים 5).
 * Their website (nikonitai.smarticket.co.il) is built on the
 * SmarTicket platform (Cloudflare protected).
 *
 * Listing: the homepage (/) lists upcoming performances as
 * div.show_cube cards — each card is one event date with title,
 * Hebrew date ("ביום רביעי, 15 באפריל 2026 בשעה 20:00"),
 * and a link to the detail page (?id=NNN).
 *
 * Detail pages: SmarTicket event pages with JSON-LD (@type Event),
 * show title in h1, description, cast, credits, og:image, and
 * ISO 8601 duration (PT75M).
 *
 * Because ALL events are on the homepage (not per-show pages),
 * fetchListing() caches event data in a module-level Map so that
 * scrapeShowEvents() can read from cache without navigating again.
 */

import { setupRequestInterception } from "./browser.mjs";
import { parseHebrewDate } from "./date.mjs";
import { fixDoubleProtocol } from "./image.mjs";
import { parseLessinDuration } from "./duration.mjs";

// ── Constants ──────────────────────────────────────────────────

export const NIKO_NITAI_THEATRE = "תיאטרון ניקו ניתאי";
const BASE_URL = "https://nikonitai.smarticket.co.il";
const HOMEPAGE_URL = "https://nikonitai.smarticket.co.il/";

// ── Module-level event cache ──────────────────────────────────
// Populated by fetchListing(), consumed by scrapeShowEvents().
// Key: normalised show URL (without ?id=), Value: { title, events[], detailUrl }

/** @type {Map<string, { title: string, detailUrl: string, events: Array<{ date: string, hour: string, rawText: string }> }>} */
let _eventsCache = new Map();

// ── Helpers ───────────────────────────────────────────────────

/**
 * Strip query params and trailing slashes from a URL for grouping.
 * e.g. "https://nikonitai.smarticket.co.il/המבול/?id=486"
 *   → "https://nikonitai.smarticket.co.il/המבול"
 */
function normaliseUrl(url) {
  try {
    const u = new URL(url, BASE_URL);
    return (u.origin + u.pathname).replace(/\/+$/, "");
  } catch {
    return url.replace(/\?.*$/, "").replace(/\/+$/, "");
  }
}

/**
 * Parse ISO 8601 duration (e.g. "PT75M", "PT1H30M") to minutes.
 * @param {string} pt
 * @returns {number|null}
 */
function parsePTDuration(pt) {
  if (!pt) return null;
  const m = pt.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return null;
  const hours = m[1] ? parseInt(m[1], 10) : 0;
  const mins = m[2] ? parseInt(m[2], 10) : 0;
  return hours * 60 + mins || null;
}

// ── Shows listing + events scraper (homepage) ─────────────────

/**
 * Fetch the list of current shows and cache their events from the homepage.
 *
 * The homepage lists upcoming performances as div.show_cube cards.
 * Each card wraps an <a> with href like "להיות_ג_ובאני/?id=511"
 * and contains the show title, Hebrew date, and time.
 *
 * @param {import('puppeteer').Browser} browser
 * @returns {Promise<Array<{title: string, url: string}>>}
 */
export async function fetchListing(browser) {
  const page = await browser.newPage();
  await setupRequestInterception(page);

  await page.goto(HOMEPAGE_URL, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  // Wait for event cards to render
  try {
    await page.waitForSelector("div.show_cube", { timeout: 15_000 });
  } catch {
    // continue even if no cards found
  }
  await new Promise((r) => setTimeout(r, 3000));

  // Extract event data from each show_cube card
  const rawCards = await page.evaluate((base) => {
    const cards = document.querySelectorAll("div.show_cube");
    const results = [];

    for (const card of cards) {
      const link = card.querySelector("a[href]");
      if (!link) continue;

      const href = link.getAttribute("href") || "";
      if (!href || href === "#") continue;

      const url = href.startsWith("http")
        ? href
        : new URL(href, base).href;

      // Full text of the card for date/title parsing
      const fullText = card.innerText || card.textContent || "";

      // Try to extract title from heading elements inside the card
      const heading = card.querySelector("h1, h2, h3, h4, h5, strong, b");
      let title = heading ? heading.textContent.trim() : "";

      // Fallback: extract title from text lines
      if (!title) {
        const lines = fullText.split("\n").map((l) => l.trim()).filter(Boolean);
        for (const line of lines) {
          // Skip date lines
          if (/^\d{1,2}\s+[א-ת]+$/.test(line)) continue;
          // Skip Hebrew date lines
          if (/^ביום\s/.test(line)) continue;
          // Skip time lines
          if (/^בשעה\s/.test(line)) continue;
          // Skip venue lines
          if (/תיאטרון ניקו ניתאי/.test(line)) continue;
          // Skip button text
          if (line === "פרטים נוספים") continue;
          // Take first substantial line as title
          if (line.length > 2) {
            title = line;
            break;
          }
        }
      }

      results.push({ url, fullText, title });
    }

    return results;
  }, BASE_URL);

  await page.close();

  // Parse events and build cache grouped by show slug
  /** @type {Map<string, { title: string, detailUrl: string, events: Array }>} */
  const cache = new Map();

  for (const raw of rawCards) {
    if (!raw.url || !raw.title) continue;

    const parsed = parseHebrewDate(raw.fullText);
    if (!parsed) continue;

    const key = normaliseUrl(raw.url);
    const entry = cache.get(key) || {
      title: raw.title,
      detailUrl: raw.url,
      events: [],
    };
    entry.events.push({
      date: parsed.date,
      hour: parsed.hour,
      rawText: raw.fullText.replace(/\n+/g, " | ").slice(0, 250),
    });
    cache.set(key, entry);
  }

  _eventsCache = cache;

  // Return unique shows sorted alphabetically
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
 * Reads from the module-level _eventsCache populated by fetchListing().
 * Deduplicates by date+hour.
 *
 * @param {import('puppeteer').Browser} browser — unused (API compat)
 * @param {string} url — show detail page URL
 * @param {{ debug?: boolean }} [opts]
 * @returns {Promise<{ events: Array<{ date: string, hour: string, rawText: string }>, title: string }>}
 */
export async function scrapeShowEvents(browser, url, { debug = false } = {}) {
  const key = normaliseUrl(url);
  const cached = _eventsCache.get(key);

  if (!cached) {
    return { events: [], title: "" };
  }

  // Deduplicate by date+hour
  const seen = new Set();
  const events = [];
  for (const ev of cached.events) {
    const k = `${ev.date}|${ev.hour}`;
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
 * @param {string} url — full URL of the show detail page
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
    // Find content between "פרטים נוספים" header and credits section
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
      "שחקנים:", "משתתפים:", "בכיכוב:",
      "משחקים:", "משחק:",
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
    // Remove leading title repetition, venue/date info
    description = description.replace(/^.*תיאטרון ניקו ניתאי.*\n/gm, "");
    description = description.replace(/^ביום\s.*\n/gm, "");
    description = description.replace(/^בשעה\s.*\n/gm, "");
    description = description.replace(/^פתיחת דלתות.*\n/gm, "");
    description = description.replace(/^מחיר\s.*\n/gm, "");
    description = description.replace(/^הזמן עכשיו.*\n/gm, "");
    description = description.replace(/^\d{1,2}\/\d{2}\/\d{4}.*\n/gm, "");
    description = description.replace(new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\n`, "gm"), "");
    description = description.replace(/\n{3,}/g, "\n\n").trim();
    // If too short, clear it
    if (description.length < 20) description = "";

    // ── Cast ──
    let cast = null;
    const castMarkers = [
      "שחקנים:",
      "משתתפים:",
      "בכיכוב:",
      "בכיכובם של:",
      "משחקים:",
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

  // Parse duration in Node context
  // Prefer JSON-LD PT duration, fall back to text
  data.durationMinutes = parsePTDuration(data.ptDuration)
    || parseLessinDuration(data.durationText);
  delete data.ptDuration;
  delete data.durationText;

  // Fix image URL
  if (data.imageUrl) {
    data.imageUrl = fixDoubleProtocol(data.imageUrl);
  }

  await page.close();
  return data;
}
