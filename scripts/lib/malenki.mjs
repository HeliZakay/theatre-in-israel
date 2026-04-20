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
 * Listing: shows are discovered from the nav menu under "הצגות רצות".
 * Event scraping from the homepage is disabled (incomplete/unreliable).
 *
 * Detail pages: Wix freeform pages with h1 title (in quotes),
 * description paragraphs, "יוצרים:" credits, "משתתפים:" cast,
 * duration in "משך ההצגה:" format, and og:image.
 */

import { fixDoubleProtocol } from "./image.mjs";
import { setupRequestInterception } from "./browser.mjs";
import { parseLessinDuration } from "./duration.mjs";

// ── Constants ──────────────────────────────────────────────────

export const MALENKI_THEATRE = "תיאטרון מלנקי";
export const MALENKI_BASE = "https://www.malenky.co.il";
export const HOMEPAGE_URL = "https://www.malenky.co.il/";


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

// ── Shows listing (nav menu) ─────────────────────────────────

/**
 * Fetch the list of current shows from the nav menu.
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

  // Wix client-side rendering settle delay
  await new Promise((r) => setTimeout(r, 2000));

  // Extract all shows from the nav submenu under "הצגות רצות"
  const navShows = await page.evaluate((base) => {
    const results = [];
    const navLinks = document.querySelectorAll("nav a[href]");
    let inRunningShows = false;
    for (const a of navLinks) {
      const text = a.textContent.trim();
      if (text === "הצגות רצות") {
        inRunningShows = true;
        continue;
      }
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

  return navShows.sort((a, b) => a.title.localeCompare(b.title, "he"));
}

// ── Per-show event scraper (disabled) ─────────────────────────

/**
 * Malenki's homepage schedule is incomplete and unreliable — event
 * scraping is disabled. Returns empty events (kept for API compat).
 */
export async function scrapeShowEvents(_browser, _url) {
  return { events: [], title: "" };
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
