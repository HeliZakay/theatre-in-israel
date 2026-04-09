/**
 * Malenki Theatre (תיאטרון מלנקי) scraping helpers.
 *
 * Centralises all Malenki-specific scraping logic so it can be
 * imported by any script that needs it.
 *
 * Malenki Theatre is based in Tel Aviv (חומה ומגדל 32).
 * Their website (malenky.co.il) is built on Wix (fully
 * client-rendered).
 *
 * Listing: the homepage is the schedule — a Wix Repeater lists
 * upcoming performances with date (DD.MM, no year), day name,
 * show title, time (HH:MM), poster image linking to the show page,
 * and a ticket button (kartisim.co.il).
 *
 * Detail pages: Wix freeform pages with h1 title (in quotes),
 * description paragraphs, "יוצרים:" credits, "משתתפים:" cast,
 * duration in "משך ההצגה:" format, and og:image.
 *
 * Because ALL events are on the homepage (not per-show pages),
 * fetchListing() caches event data in a module-level Map so that
 * scrapeShowEvents() can read from cache without navigating again.
 */

import { fixDoubleProtocol } from "./image.mjs";
import { setupRequestInterception } from "./browser.mjs";
import { inferYear, formatDate } from "./date.mjs";
import { parseLessinDuration } from "./duration.mjs";

// ── Constants ──────────────────────────────────────────────────

export const MALENKI_THEATRE = "תיאטרון מלנקי";
export const MALENKI_BASE = "https://www.malenky.co.il";
export const HOMEPAGE_URL = "https://www.malenky.co.il/";

// ── Module-level event cache ──────────────────────────────────
// Populated by fetchListing(), consumed by scrapeShowEvents().
// Key: show page URL, Value: { title, events[] }

/** @type {Map<string, { title: string, events: Array<{ date: string, hour: string, ticketUrl: string|null, rawText: string }> }>} */
let _eventsCache = new Map();

// ── Title cleaning ────────────────────────────────────────────

/**
 * Clean a show title extracted from the schedule.
 * Removes suffixes like "/הצגת ילדים" and trims whitespace.
 */
function cleanTitle(raw) {
  return raw
    .replace(/\s*\/.*$/, "") // remove "/ suffix" like "/הצגת ילדים"
    .replace(/\s+/g, " ")
    .trim();
}

// ── Wix-aware image extraction ───────────────────────────────

/**
 * Extract the show poster image from a Malenki detail page.
 *
 * Runs inside page.evaluate() — must be self-contained.
 *
 * On Malenki's Wix site, og:image is a site-wide logo (same on
 * every page). The actual show poster is a large <img> in the
 * page body (~980x573, alt contains "פוסטר").
 *
 * @returns {string | null}
 */
function extractMalenkiImage() {
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

  // Strategy 2: og:image fallback (only if not a generic logo)
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage) {
    const content = ogImage.getAttribute("content");
    if (content && !isSkipped(content, "")) return content;
  }

  return null;
}

// ── Shows listing + events scraper (homepage) ─────────────────

/**
 * Fetch the list of current shows and their events from the homepage.
 *
 * The homepage uses a Wix Repeater with one row per event. Each row
 * contains rich-text elements for date (DD.MM), day name, show title,
 * time (HH:MM), a poster image linking to the show page, and a
 * ticket purchase button.
 *
 * Populates the module-level _eventsCache for scrapeShowEvents().
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

  // Wait for Wix Repeater to render
  try {
    await page.waitForSelector('div[role="listitem"]', { timeout: 30_000 });
  } catch {
    // No schedule on homepage — still try nav submenu for shows
  }

  // Wix client-side rendering settle delay
  await new Promise((r) => setTimeout(r, 2000));

  // ── 1. Extract event rows from the homepage schedule repeater ──
  const rawRows = await page.evaluate(() => {
    const items = document.querySelectorAll('div[role="listitem"]');
    return [...items].map((item) => {
      // Collect all rich-text elements
      const textEls = item.querySelectorAll('[data-testid="richTextElement"]');
      const texts = [...textEls].map((el) => el.textContent.trim());

      // Show page URL from the poster image link
      const imageLink = item.querySelector(
        ".wixui-image a[data-testid='linkElement']",
      );
      const showUrl = imageLink?.href || "";

      // Ticket URL from the "לקנות כרטיסים" button
      const ticketLink = item.querySelector(
        "a[aria-label='לקנות כרטיסים']",
      );
      const ticketUrl = ticketLink?.href || null;

      return { texts, showUrl, ticketUrl };
    });
  });

  // ── 2. Extract all shows from the nav submenu under "הצגות רצות" ──
  // The nav lists all active shows, including those without upcoming dates.
  const navShows = await page.evaluate((base) => {
    const results = [];
    // Find all nav links that point to show pages (not archive/festival/etc.)
    const navLinks = document.querySelectorAll("nav a[href]");
    // Collect links under the "הצגות רצות" submenu
    let inRunningShows = false;
    for (const a of navLinks) {
      const text = a.textContent.trim();
      if (text === "הצגות רצות") {
        inRunningShows = true;
        continue;
      }
      // Stop at the next top-level nav item
      if (inRunningShows && (text === "פסטיבל" || text === "ארכיון" || text === "השכרת אולם" || text === "צור קשר")) {
        break;
      }
      if (inRunningShows && text.length > 1) {
        const href = a.href;
        if (href && href.startsWith(base)) {
          results.push({ title: text, url: href });
        }
      }
    }
    return results;
  }, MALENKI_BASE);

  await page.close();

  // ── 3. Parse schedule rows into structured events ──
  const DATE_RE = /^(\d{1,2})\.(\d{1,2})$/;
  const TIME_RE = /^(\d{1,2}:\d{2})$/;

  /** @type {Map<string, { title: string, events: Array }>} */
  const cache = new Map();

  for (const row of rawRows) {
    if (!row.showUrl) continue;

    // Identify fields by content pattern
    let day = 0;
    let month = 0;
    let hour = "";
    let title = "";

    for (const text of row.texts) {
      const dateMatch = text.match(DATE_RE);
      if (dateMatch) {
        day = parseInt(dateMatch[1], 10);
        month = parseInt(dateMatch[2], 10);
        continue;
      }

      const timeMatch = text.match(TIME_RE);
      if (timeMatch) {
        hour = timeMatch[1];
        continue;
      }

      // Skip Hebrew day names
      if (/^(ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת|מוצ[״"]ש)$/.test(text)) {
        continue;
      }

      // Remaining non-empty text is the show title
      if (text.length > 1 && !title) {
        title = cleanTitle(text);
      }
    }

    if (!day || !month || !title) continue;

    const year = inferYear(day, month);
    const dateStr = formatDate(day, month, year);
    const rawText = row.texts.join(" | ");

    const entry = cache.get(row.showUrl) || { title, events: [] };
    entry.events.push({
      date: dateStr,
      hour,
      ticketUrl: row.ticketUrl,
      rawText: rawText.slice(0, 250),
    });
    cache.set(row.showUrl, entry);
  }

  _eventsCache = cache;

  // ── 4. Merge nav shows (includes shows without upcoming dates) ──
  const showMap = new Map(
    [...cache.entries()].map(([url, { title }]) => [url, title]),
  );
  for (const ns of navShows) {
    if (!showMap.has(ns.url)) {
      showMap.set(ns.url, ns.title);
      // No events cached for this show — that's fine
    }
  }

  // Return unique shows sorted alphabetically
  const shows = [...showMap.entries()].map(([url, title]) => ({
    title,
    url,
  }));
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
 * @param {string} url — show detail page URL
 * @param {{ debug?: boolean }} [opts]
 * @returns {Promise<{ events: Array<{ date: string, hour: string, ticketUrl: string|null, rawText: string }>, title: string, debugHtml?: string }>}
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
 * Scrape a single Malenki show detail page for title, duration,
 * description, cast, and image.
 *
 * @param {import('puppeteer').Browser} browser
 * @param {string} url — full URL of the show page
 * @returns {Promise<{title: string, durationMinutes: number|null, description: string, imageUrl: string|null, cast: string|null}>}
 */
export async function scrapeShowDetails(browser, url) {
  const page = await browser.newPage();
  await setupRequestInterception(page, { allowImages: true });

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector("h1", { timeout: 30_000 });

  // Wix rendering settle delay
  await new Promise((r) => setTimeout(r, 2000));

  const data = await page.evaluate(() => {
    // ── Title ──
    const h1 = document.querySelector("h1");
    let title = h1 ? h1.textContent.trim() : "";
    // Remove surrounding quotes ("הדוד וניה" → הדוד וניה)
    title = title.replace(/^["״]+|["״]+$/g, "").trim();
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
    // The page body has: title → "לקנות כרטיסים" button → optional
    // subtitle → description → credits. We skip past the first
    // "לקנות כרטיסים" to reach the actual content area.
    let description = "";
    const buyTicketsIdx = body.indexOf("לקנות כרטיסים");
    const descSearchStart = buyTicketsIdx !== -1
      ? buyTicketsIdx + "לקנות כרטיסים".length
      : body.indexOf(title) + title.length;
    const afterHeader = body.slice(descSearchStart);

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
      "MALENKY THEATRE",
    ];

    let endIdx = afterHeader.length;
    for (const marker of stopMarkers) {
      const idx = afterHeader.indexOf(marker);
      if (idx !== -1 && idx < endIdx) endIdx = idx;
    }

    description = afterHeader.slice(0, endIdx).trim();
    // Clean up promotional / subtitle lines
    description = description.replace(
      /^(ההצגה החדשה של תיאטרון מלנקי|הצגת ילדים)\s*/gm,
      "",
    );
    description = description.replace(/\n{3,}/g, "\n\n").trim();

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
      // Trim leading whitespace — "משתתפים:\n\nnames" has a blank line
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
        "MALENKY",
        "לקנות כרטיסים",
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
  // Malenki sometimes uses abbreviated "דק'" and leading dashes: "−50 דק'"
  let durationText = data.durationText;
  if (durationText) {
    durationText = durationText.replace(/[-−–]\s*(\d)/, "$1"); // strip leading dash
    durationText = durationText.replace(/דק['׳]/g, "דקות"); // normalize abbreviation
  }
  data.durationMinutes = parseLessinDuration(durationText);
  delete data.durationText;

  // ── Image URL ──
  const imageUrl = await page.evaluate(extractMalenkiImage);
  if (imageUrl) {
    data.imageUrl = fixDoubleProtocol(imageUrl);
  } else {
    data.imageUrl = null;
  }

  await page.close();
  return data;
}
