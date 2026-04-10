/**
 * Jerusalem Theatre Group (קבוצת התיאטרון הירושלמי) scraping helpers.
 *
 * Centralises all TCJ-specific scraping logic so it can be imported
 * by any script that needs it.
 *
 * The group performs at בית מזיא לתיאטרון in Jerusalem.
 * Their website (tcj.org.il) is built on the SmarTicket platform
 * (JS-rendered, jQuery-based, may be Cloudflare-protected).
 *
 * Listing: the shows page (/הצגות_רצות) lists current productions
 * as clickable cards with images and titles linking to detail pages.
 *
 * Events: the homepage (/) lists upcoming performances with Hebrew
 * dates ("ביום שני, 25 במאי 2026 בשעה 20:00"), venue, and
 * "פרטים נוספים" links to show detail pages.
 *
 * Because events are on the homepage (not per-show detail pages),
 * fetchListing() caches event data in a module-level Map so that
 * scrapeShowEvents() can read from cache without navigating again.
 *
 * Detail pages: show title, description, cast/crew credits,
 * duration, and thumbnail image.
 */

import { setupRequestInterception } from "./browser.mjs";
import { parseHebrewDate } from "./date.mjs";
import { fixDoubleProtocol } from "./image.mjs";
import { parseLessinDuration } from "./duration.mjs";

// ── Constants ──────────────────────────────────────────────────

export const JERUSALEM_THEATRE_GROUP = "קבוצת התיאטרון הירושלמי";
const BASE_URL = "https://www.tcj.org.il";
const HOMEPAGE_URL = "https://www.tcj.org.il/";
const SHOWS_URL =
  "https://www.tcj.org.il/%D7%94%D7%A6%D7%92%D7%95%D7%AA_%D7%A8%D7%A6%D7%95%D7%AA";

// ── Module-level event cache ──────────────────────────────────
// Populated by fetchListing(), consumed by scrapeShowEvents().
// Key: show page URL, Value: { title, events[] }

/** @type {Map<string, { title: string, events: Array<{ date: string, hour: string, rawText: string }> }>} */
let _eventsCache = new Map();

// ── Title cleaning ────────────────────────────────────────────

/**
 * Clean a show title extracted from the site.
 * Removes genre suffixes after pipe (e.g. "| קומדיה") and trims.
 */
function cleanTitle(raw) {
  return raw
    .replace(/\s*\|.*$/, "") // remove "| genre" suffix
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalise a URL for cache key comparison.
 * Strips trailing slashes, query params, and fragments.
 */
function normaliseUrl(url) {
  try {
    const u = new URL(url);
    return (u.origin + u.pathname).replace(/\/+$/, "");
  } catch {
    return url.replace(/\/+$/, "");
  }
}

// ── Shows listing + events scraper ────────────────────────────

/**
 * Fetch the list of current shows and their events.
 *
 * Phase 1: scrape the homepage for upcoming events → populate _eventsCache.
 * Phase 2: scrape the shows page for the authoritative show list.
 *
 * @param {import('puppeteer').Browser} browser
 * @returns {Promise<Array<{title: string, url: string}>>}
 */
export async function fetchListing(browser) {
  // ── Phase 1: Homepage events cache ──────────────────────────
  const homePage = await browser.newPage();
  await setupRequestInterception(homePage);

  await homePage.goto(HOMEPAGE_URL, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  // SmarTicket: content hidden until jQuery loads
  try {
    await homePage.waitForSelector("a", { timeout: 15_000 });
  } catch {
    // continue even if selector times out
  }
  await new Promise((r) => setTimeout(r, 3000));

  const rawEvents = await homePage.evaluate((base) => {
    // Find all "פרטים נוספים" links — these mark event cards
    const detailLinks = [...document.querySelectorAll("a")].filter(
      (a) => a.textContent.trim() === "פרטים נוספים",
    );

    const events = [];
    for (const link of detailLinks) {
      const href = link.getAttribute("href") || "";
      if (!href || href === "#") continue;

      const showUrl = href.startsWith("http")
        ? href
        : new URL(href, base).href;

      // Walk up to find the event card container.
      // Try known container patterns, then fall back to grandparent.
      const container =
        link.closest("[class*='event']") ||
        link.closest("[class*='show']") ||
        link.closest("article") ||
        link.closest("section") ||
        link.parentElement?.parentElement?.parentElement;

      if (!container) continue;

      // Extract all text from the container
      const fullText = container.innerText || container.textContent || "";

      // Try to extract the title: look for bold/heading elements
      const heading =
        container.querySelector("h1, h2, h3, h4, h5, strong, b");
      let title = heading ? heading.textContent.trim() : "";

      // If no heading, try the first substantial text line
      if (!title) {
        const lines = fullText.split("\n").map((l) => l.trim()).filter(Boolean);
        for (const line of lines) {
          // Skip date/venue/button lines
          if (/^ביום\s/.test(line)) continue;
          if (/^בשעה\s/.test(line)) continue;
          if (/בית מזיא/.test(line)) continue;
          if (line === "פרטים נוספים") continue;
          if (/^\d{1,2}\s/.test(line) && line.length < 20) continue;
          if (line.length > 2) {
            title = line;
            break;
          }
        }
      }

      events.push({ fullText, title, showUrl });
    }

    return events;
  }, BASE_URL);

  await homePage.close();

  // Parse events and build cache
  /** @type {Map<string, { title: string, events: Array }>} */
  const cache = new Map();

  for (const raw of rawEvents) {
    if (!raw.showUrl || !raw.title) continue;

    const parsed = parseHebrewDate(raw.fullText);
    if (!parsed) continue;

    const key = normaliseUrl(raw.showUrl);
    const title = cleanTitle(raw.title);
    const entry = cache.get(key) || { title, events: [] };
    entry.events.push({
      date: parsed.date,
      hour: parsed.hour,
      rawText: raw.fullText.replace(/\n+/g, " | ").slice(0, 250),
    });
    cache.set(key, entry);
  }

  _eventsCache = cache;

  // ── Phase 2: Shows page listing ─────────────────────────────
  const showsPage = await browser.newPage();
  await setupRequestInterception(showsPage);

  await showsPage.goto(SHOWS_URL, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  try {
    await showsPage.waitForSelector("a.show, a[href] img", {
      timeout: 15_000,
    });
  } catch {
    // continue
  }
  await new Promise((r) => setTimeout(r, 3000));

  const showCards = await showsPage.evaluate((base) => {
    const results = [];
    const seen = new Set();

    // Strategy 1: SmarTicket standard `a.show` cards
    let cards = document.querySelectorAll("a.show");

    // Strategy 2: all anchor tags containing images (show cards)
    if (cards.length === 0) {
      cards = document.querySelectorAll("a");
    }

    for (const card of cards) {
      const href = card.getAttribute("href") || "";
      if (!href || href === "#" || href === "/" || href.startsWith("http")) continue;

      // Skip navigation/utility links
      if (href.includes("cart") || href.includes("search") || href.includes("accessibility")) continue;
      if (href.includes("page_46") || href === "הצגות_רצות" || href === "ארכיון_הצגות") continue;
      if (href.includes("פסטיבל") || href.includes("אודות") || href.includes("צור_קשר")) continue;
      if (href.includes("קורסים") || href.includes("סיור") || href.includes("חממת")) continue;
      if (href.includes("מוצרים") || href.includes("הצטרפו") || href.includes("תקנון")) continue;
      if (href.includes("ביקורות") || href.includes("VIP") || href.includes("ימים_מאורגנים")) continue;
      if (href.includes("ערבי") || href.includes("מפגשים") || href.includes("שקיפות")) continue;
      if (href.includes("הצגות_ילדים") || href === "en") continue;

      // Must have an image (show cards have thumbnails)
      const img = card.querySelector("img");
      if (!img && !card.classList.contains("show")) continue;

      const url = new URL(href, base).href;
      if (seen.has(url)) continue;
      seen.add(url);

      // Title from h2/h3 or image alt
      const heading = card.querySelector("h2, h3, h4");
      let title = heading?.textContent?.trim() || "";
      if (!title) {
        title = img?.getAttribute("alt")?.replace(/^תמונת:\s*/, "")?.trim() || "";
      }
      if (!title) {
        title = card.textContent?.trim()?.split("\n")[0]?.trim() || "";
      }

      if (title && title !== "פרטים נוספים") {
        results.push({ title, url });
      }
    }

    return results;
  }, BASE_URL);

  await showsPage.close();

  // Deduplicate and clean titles
  const showMap = new Map();
  for (const card of showCards) {
    const key = normaliseUrl(card.url);
    if (!showMap.has(key)) {
      showMap.set(key, { title: cleanTitle(card.title), url: card.url });
    }
  }

  // Also include shows that only appear in the events cache
  for (const [url, data] of _eventsCache) {
    if (!showMap.has(url)) {
      showMap.set(url, { title: data.title, url: url });
    }
  }

  const shows = [...showMap.values()];
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
 * @returns {Promise<{ events: Array<{ date: string, hour: string, rawText: string }>, title: string, debugHtml?: string }>}
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
 * @param {string} url — full URL of the show page
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
    // Remove genre suffix after pipe
    title = title.replace(/\s*\|.*$/, "").trim();

    // ── Body text for parsing ──
    const body = document.body.innerText || "";

    // ── Duration ──
    let durationText = null;
    const durationMatch = body.match(/משך\s+ה?הצגה:?\s*([^\n]+)/);
    if (durationMatch) {
      durationText = durationMatch[0].trim();
    }

    // ── Description ──
    // Find content between title area and credits section
    let description = "";
    const titleIdx = body.indexOf(title);
    const afterTitle = titleIdx !== -1 ? body.slice(titleIdx + title.length) : body;

    const stopMarkers = [
      "מחזאי:", "מחזאית:",
      "במאי:", "במאית:", "בימוי:",
      "בימוי ועיבוד",
      "תפאורה ותלבושות:",
      "תפאורה:", "תלבושות:",
      "עיצוב אורות:", "תאורה:",
      "עיצוב סאונד:", "מוזיקה:",
      "הפקה:",
      "צילום:",
      "משחקים:", "משחק:",
      "בהשתתפות:",
      "שחקנים:", "שחקניות:",
      "משך ה",
      "פרטים נוספים",
      "02-624",
    ];

    let endIdx = afterTitle.length;
    for (const marker of stopMarkers) {
      const idx = afterTitle.indexOf(marker);
      if (idx !== -1 && idx < endIdx) endIdx = idx;
    }

    description = afterTitle.slice(0, endIdx).trim();
    // Remove leading venue/date info
    description = description.replace(/^(ביום\s.*?\n|בשעה\s.*?\n|אולם\s.*?\n)+/gm, "");
    description = description.replace(/\n{3,}/g, "\n\n").trim();
    // If description is too short (just date info), clear it
    if (description.length < 30) description = "";

    // ── Cast ──
    let cast = null;
    const castMarkers = [
      "משחקים:",
      "משחק:",
      "בהשתתפות:",
      "שחקנים:",
      "שחקניות:",
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
        "במאי:", "במאית:", "בימוי:",
        "מחזאי:", "מחזאית:",
        "תפאורה:", "תלבושות:",
        "עיצוב:", "תאורה:",
        "מוזיקה:", "הפקה:", "צילום:",
        "משך ה",
        "02-624",
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

    // ── Image ──
    let imageUrl = null;
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) {
      imageUrl = ogImage.getAttribute("content") || null;
    }
    if (!imageUrl) {
      // Find first content image (not nav/footer icons)
      const imgs = [...document.querySelectorAll("img")];
      for (const img of imgs) {
        const src = img.src || img.dataset?.src || "";
        if (!src) continue;
        if (img.closest("nav") || img.closest("footer") || img.closest("header")) continue;
        const lowerSrc = src.toLowerCase();
        if (lowerSrc.includes("logo") || lowerSrc.includes("icon")) continue;
        if (src.includes("no_pic")) continue;
        const rect = img.getBoundingClientRect();
        if (rect.width > 100 && rect.height > 100) {
          imageUrl = src;
          break;
        }
      }
    }

    return { title, durationText, description, cast, imageUrl };
  });

  // Parse duration in Node context
  data.durationMinutes = parseLessinDuration(data.durationText);
  delete data.durationText;

  // Fix image URL
  if (data.imageUrl) {
    data.imageUrl = fixDoubleProtocol(data.imageUrl);
  }

  await page.close();
  return data;
}
