/**
 * Elad Theatre (תיאטרון אלעד) scraping helpers.
 *
 * Centralises all Elad-specific scraping logic so it can be
 * imported by any script that needs it.
 *
 * Elad Theatre is a touring company — shows perform at various
 * venues (התומשיה in TLV, תיאטרון הקאמרי, etc.).
 *
 * Their website (elad-theater.co.il) is built on Wix (fully
 * client-rendered). Tickets are sold via SmartTicket
 * (elad-theater.smarticket.co.il, Cloudflare-protected).
 *
 * Listing: the Wix nav dropdown under "הצגות" lists all current
 * shows with links to individual show pages.
 *
 * Events: each Wix show page links to a SmartTicket detail page
 * that has a dates table with Hebrew-formatted dates and venue info.
 *
 * Detail pages: Wix freeform pages with h1 title, description,
 * credits (using — separator), duration, cast, and poster image.
 */

import { fixDoubleProtocol } from "./image.mjs";
import { setupRequestInterception } from "./browser.mjs";
import { parseHebrewDate } from "./date.mjs";
import { parseLessinDuration } from "./duration.mjs";

// ── Constants ──────────────────────────────────────────────────

export const ELAD_THEATRE = "תיאטרון אלעד";
const WIX_BASE = "https://www.elad-theater.co.il";
const SMARTICKET_BASE = "https://elad-theater.smarticket.co.il";

/** Pages under "הצגות" nav that are not actual shows */
const SKIP_SLUGS = new Set([
  "productions",
  "education-department",
  "theater-workshops-for-groups",
]);

// ── Shows listing (Wix nav) ──────────────────────────────────

/**
 * Fetch the list of current shows from the Wix nav dropdown.
 *
 * @param {import('puppeteer').Browser} browser
 * @returns {Promise<Array<{title: string, url: string}>>}
 */
export async function fetchListing(browser) {
  const page = await browser.newPage();
  await setupRequestInterception(page);

  await page.goto(WIX_BASE, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  await page.waitForSelector("nav", { timeout: 30_000 });
  // Wix client-side rendering settle delay
  await new Promise((r) => setTimeout(r, 3000));

  const shows = await page.evaluate((base, skipSlugs) => {
    const results = [];
    const navLinks = document.querySelectorAll("nav a[href]");

    for (const a of navLinks) {
      const href = a.href;
      if (!href || !href.startsWith(base + "/")) continue;

      // Only include links under the "הצגות" parent
      const li = a.closest("li");
      const parentLi = li?.closest("ul")?.closest("li");
      const parentLink = parentLi?.querySelector(
        ":scope > a, :scope > [role='button'], :scope > span",
      );
      if (parentLink?.textContent?.trim() !== "הצגות") continue;

      const slug = href.replace(base + "/", "").split("?")[0].split("#")[0];
      if (skipSlugs.includes(slug)) continue;

      const title = a.textContent.trim();
      if (!title || title === "הצגות") continue;

      results.push({ title, url: href });
    }

    return results;
  }, WIX_BASE, [...SKIP_SLUGS]);

  await page.close();

  // Filter out the SmartTicket schedule link that appears in the nav
  return shows.filter((s) => !s.url.includes("smarticket"));
}

// ── Per-show event scraper (SmartTicket) ─────────────────────

/**
 * Scrape events for a single show by visiting its Wix page to
 * find the SmartTicket link, then scraping the SmartTicket dates table.
 *
 * @param {import('puppeteer').Browser} browser
 * @param {string} url — Wix show page URL
 * @param {{ debug?: boolean }} [opts]
 * @returns {Promise<{ events: Array<{ date: string, hour: string, venueName: string, venueCity: string, rawText?: string }>, debugHtml?: string }>}
 */
export async function scrapeShowEvents(
  browser,
  url,
  { debug = false } = {},
) {
  // ── Step 1: Visit Wix page to extract SmartTicket URL ──
  const wixPage = await browser.newPage();
  await setupRequestInterception(wixPage);

  await wixPage.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  // Wait for content to render
  try {
    await wixPage.waitForSelector("a[href]", { timeout: 15_000 });
  } catch {
    // May not have any links yet — try after settle delay
  }
  await new Promise((r) => setTimeout(r, 2000));

  const smarticketUrl = await wixPage.evaluate((base) => {
    const links = document.querySelectorAll("a[href]");

    // Strategy 1: Find the "להזמנת כרטיסים" button — most reliable
    for (const a of links) {
      const text = a.textContent.trim();
      if (
        a.href &&
        a.href.includes(base) &&
        text === "להזמנת כרטיסים"
      ) {
        return a.href.replace(/\?$/, ""); // strip trailing ?
      }
    }

    // Strategy 2: Any SmartTicket link with aria-label mentioning כרטיסים
    for (const a of links) {
      const label = a.getAttribute("aria-label") || "";
      if (
        a.href &&
        a.href.includes(base) &&
        label.includes("כרטיס")
      ) {
        return a.href.replace(/\?$/, "");
      }
    }

    // Strategy 3: First SmartTicket link that isn't the root
    for (const a of links) {
      const href = a.href || "";
      const clean = href.replace(/\?$/, "");
      if (clean.includes(base) && !clean.endsWith("/")) {
        // Skip links whose path is just the base (with or without trailing slash)
        const path = clean.replace(base, "").replace(/^\//, "");
        if (path.length > 0) return clean;
      }
    }

    return null;
  }, SMARTICKET_BASE);

  await wixPage.close();

  if (!smarticketUrl) {
    return { events: [] };
  }

  // ── Step 2: Visit SmartTicket detail page and parse dates ──
  const stPage = await browser.newPage();
  await setupRequestInterception(stPage);

  await stPage.goto(smarticketUrl, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await new Promise((r) => setTimeout(r, 2000));

  const result = await stPage.evaluate((debugMode) => {
    const output = { events: [], debugHtml: null };

    // Use the full dates table (list-table) if available, else table-condensed
    const fullTable = document.querySelector("table.list-table tbody");
    const condensedTable = document.querySelector(
      "table.table-condensed tbody",
    );
    const tbody = fullTable || condensedTable;

    if (!tbody) {
      if (debugMode) {
        output.debugHtml = document.body?.innerHTML?.slice(0, 15_000) || "";
      }
      return output;
    }

    const rows = tbody.querySelectorAll("tr");
    for (const row of rows) {
      const cells = row.querySelectorAll("td");
      if (cells.length < 2) continue;

      const dateText = cells[0]?.textContent?.trim() || "";
      const venueText = cells[1]?.textContent?.trim() || "";

      if (!dateText) continue;

      output.events.push({ dateText, venueText });
    }

    if (debugMode) {
      output.debugHtml = document.body?.innerHTML?.slice(0, 15_000) || "";
    }

    return output;
  }, debug);

  await stPage.close();

  // ── Step 3: Parse Hebrew dates and venue info in Node context ──
  const events = [];
  const seen = new Set();

  for (const raw of result.events) {
    const parsed = parseHebrewDate(raw.dateText);
    if (!parsed) continue;

    const { venueName, venueCity } = parseVenue(raw.venueText);

    const key = `${parsed.date}|${parsed.hour}|${venueName}`;
    if (seen.has(key)) continue;
    seen.add(key);

    events.push({
      date: parsed.date,
      hour: parsed.hour,
      venueName,
      venueCity,
      rawText: raw.dateText.slice(0, 250),
    });
  }

  return { events, debugHtml: result.debugHtml || undefined };
}

/**
 * Parse venue text from SmartTicket "אולם" column.
 * Handles comma-separated ("התומשיה, תל אביב") and
 * space-separated ("תיאטרון הקאמרי תל אביב") formats.
 */
function parseVenue(text) {
  if (!text) return { venueName: "לא ידוע", venueCity: "לא ידוע" };

  const trimmed = text.trim();

  // Try comma-separated first
  const commaIdx = trimmed.lastIndexOf(",");
  if (commaIdx !== -1) {
    const name = trimmed.slice(0, commaIdx).trim();
    const city = trimmed.slice(commaIdx + 1).trim();
    if (name && city) return { venueName: name, venueCity: city };
  }

  // Try known city suffixes (space-separated)
  const knownCities = [
    "תל אביב יפו",
    "תל אביב",
    "ירושלים",
    "חיפה",
    "באר שבע",
    "אילת",
    "הרצליה",
    "רמת גן",
    "פתח תקווה",
    "ראשון לציון",
    "אשדוד",
    "אשקלון",
    "נתניה",
    "חולון",
    "רחובות",
    "כפר סבא",
  ];

  for (const city of knownCities) {
    if (trimmed.endsWith(city) && trimmed.length > city.length + 1) {
      const name = trimmed.slice(0, -(city.length)).trim();
      return { venueName: name, venueCity: city };
    }
  }

  // Fallback: entire text is venue name
  return { venueName: trimmed, venueCity: "לא ידוע" };
}

// ── Detail page scraper (Wix) ────────────────────────────────

/**
 * Scrape a single Elad Theatre show detail page for title, duration,
 * description, cast, and image.
 *
 * @param {import('puppeteer').Browser} browser
 * @param {string} url — full URL of the Wix show page
 * @returns {Promise<{title: string, durationMinutes: number|null, description: string, imageUrl: string|null, cast: string|null}>}
 */
export async function scrapeShowDetails(browser, url) {
  const page = await browser.newPage();
  await setupRequestInterception(page, { allowImages: true });

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  try {
    await page.waitForSelector("h1", { timeout: 15_000 });
  } catch {
    await page.waitForSelector('[data-testid="richTextElement"]', {
      timeout: 15_000,
    });
  }

  // Wix rendering settle delay
  await new Promise((r) => setTimeout(r, 3000));

  const data = await page.evaluate(() => {
    // ── Title ──
    const h1 = document.querySelector("h1");
    let title = h1 ? h1.textContent.trim() : "";
    title = title.replace(/^["״]+|["״]+$/g, "").trim();
    title = title.replace(/\s+/g, " ").trim();
    // Strip marketing subtitle after " – " or " - " dash
    // e.g. "האבא – דרמה קומית בכיכובו של דביר בנדק" → "האבא"
    title = title.replace(/\s+[–\-]\s+.*$/, "").trim();

    // ── Body text ──
    const body = document.body.innerText;

    // ── Duration ──
    // Format: "משך ההצגה — XX דקות" or "משך ההצגה: XX דקות"
    // Wix may inject Unicode bidi chars (U+202E, U+202C) around the dash
    const cleanBody = body.replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, "");
    let durationText = null;
    const durationMatch = cleanBody.match(
      /משך\s+ההצגה\s*[—:\-–]?\s*([^\n]+)/,
    );
    if (durationMatch) {
      durationText = durationMatch[0].trim();
    }

    // ── Description ──
    // The page layout varies. Look for the main description text:
    // Usually after "להזמנת כרטיסים" button and before the footer nav.
    let description = "";
    const buyIdx = body.indexOf("להזמנת כרטיסים");
    const searchStart =
      buyIdx !== -1 ? buyIdx + "להזמנת כרטיסים".length : 0;
    const afterButton = body.slice(searchStart);

    // Stop before footer/nav markers
    const stopMarkers = [
      "הישארו מעודכנים",
      "צור קשר",
      "office@elad-theater",
      "לעמוד הבית",
      "\nראשי\n",
      "ראשי\nהסיפור שלנו",
      "\nMore\n",
      "\nMore",
    ];

    // Also stop before credit blocks (using — separator)
    const creditMarkers = [
      "עיבוד ובימוי",
      "בימוי —",
      "בימוי:",
      "מאת —",
      "מחזה:",
      "תרגום —",
      "תרגום:",
      "מוסיקה —",
      "מוסיקה:",
      "תאורה —",
      "תאורה:",
      "תפאורה —",
      "תפאורה:",
    ];

    let endIdx = afterButton.length;
    for (const marker of [...stopMarkers, ...creditMarkers]) {
      const idx = afterButton.indexOf(marker);
      if (idx !== -1 && idx < endIdx) endIdx = idx;
    }

    description = afterButton.slice(0, endIdx).trim();
    description = description.replace(/\n{3,}/g, "\n\n").trim();
    // Remove leading whitespace lines
    description = description.replace(/^\s*\n/, "").trim();

    // ── Cast ──
    let cast = null;
    const castMarkers = [
      "שחקנים ושירה —",
      "שחקנים —",
      "משחק:",
      "משחק —",
      "משתתפים:",
      "משתתפים —",
      "בכיכוב:",
      "בכיכוב —",
      "שחקנים:",
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
        "צ׳לו",
        "מאת",
        "בימוי",
        "עיבוד",
        "תאורה",
        "תפאורה",
        "תלבושות",
        "מוסיקה",
        "עיצוב",
        "הפקה",
        "משך ה",
        "צילום",
        "תרגום",
        "ניהול",
        "טקסט",
        "דרמטורגיה",
        "להזמנת",
        "לקנות",
      ];

      let endCastIdx = raw.length;
      for (const marker of endCastMarkers) {
        const idx = raw.indexOf(marker);
        if (idx !== -1 && idx < endCastIdx) endCastIdx = idx;
      }

      const dblNewline = raw.indexOf("\n\n");
      if (dblNewline !== -1 && dblNewline < endCastIdx)
        endCastIdx = dblNewline;

      raw = raw.slice(0, endCastIdx).trim();
      // Clean Unicode bidi control chars
      raw = raw.replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, "");
      raw = raw.replace(/\n+/g, ", ");
      raw = raw.replace(/,\s*,/g, ",");
      raw = raw.replace(/\s{2,}/g, " ");
      raw = raw.replace(/,\s*$/, "").trim();

      cast = raw || null;
    }

    return { title, durationText, description, cast };
  });

  // Parse duration in Node context
  let durationText = data.durationText;
  if (durationText) {
    // Normalize em-dash separator to colon for parseLessinDuration
    durationText = durationText.replace(/[—–\-]\s*/, ": ");
  }
  data.durationMinutes = parseLessinDuration(durationText);
  delete data.durationText;

  // ── Image URL ──
  const imageUrl = await page.evaluate(() => {
    const SKIP_SRC = [
      "logo",
      "icon",
      "facebook",
      "instagram",
      "youtube",
      "twitter",
      "tiktok",
    ];
    const SKIP_ALT = ["לוגו", "logo", "icon", "Elad Theater logo"];

    function isSkipped(src, alt) {
      const lowerSrc = (src || "").toLowerCase();
      const lowerAlt = (alt || "").toLowerCase();
      return (
        SKIP_SRC.some((s) => lowerSrc.includes(s)) ||
        SKIP_ALT.some((s) => lowerAlt.toLowerCase().includes(s.toLowerCase()))
      );
    }

    // Strategy 1: Large visible image not in header/footer/nav
    const imgs = [...document.querySelectorAll("img")];
    for (const img of imgs) {
      const src = img.src || img.dataset?.src || "";
      if (!src || isSkipped(src, img.alt)) continue;
      if (
        img.closest("nav") ||
        img.closest("footer") ||
        img.closest("header")
      )
        continue;
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
