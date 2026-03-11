/**
 * Cameri Theatre scraping helpers — repertoire listing and show detail extraction.
 *
 * Centralises all Cameri-specific scraping logic so it can be
 * imported by any script that needs it.
 *
 * Updated March 2026 for the redesigned WordPress-based cameri.co.il.
 * Old URL structure (/לוח_הצגות_מלא, /show_*) is gone.
 * New structure: /הצגות_הקאמרי/ (repertoire) → /הצגות_הקאמרי/{slug}/ (detail).
 */

import { fixDoubleProtocol } from "./image.mjs";
import { setupRequestInterception } from "./browser.mjs";
import { parseLessinDuration } from "./duration.js";

// ── Re-export shared browser helpers for backward compatibility ─
export { launchBrowser, setupRequestInterception } from "./browser.mjs";

// ── Constants ──────────────────────────────────────────────────

export const CAMERI_THEATRE = "תיאטרון הקאמרי";
export const CAMERI_BASE = "https://www.cameri.co.il";

/** Repertoire page — lists all current shows as cards with links. */
export const REPERTOIRE_URL =
  "https://www.cameri.co.il/%D7%94%D7%A6%D7%92%D7%95%D7%AA_%D7%94%D7%A7%D7%90%D7%9E%D7%A8%D7%99/";

// Keep the old export name so entry-point scripts don't break.
export const SCHEDULE_URL = REPERTOIRE_URL;

/**
 * The repertoire page path segment, used to identify show-detail links.
 * Both encoded and decoded forms are checked because browsers may
 * expose either in getAttribute("href").
 */
const REPERTOIRE_PATH = "/הצגות_הקאמרי/";
const REPERTOIRE_PATH_ENCODED =
  "/%D7%94%D7%A6%D7%92%D7%95%D7%AA_%D7%94%D7%A7%D7%90%D7%9E%D7%A8%D7%99/";

/** Category prefixes that appear before the actual title in card text. */
const CATEGORY_PREFIXES = ["מחזמר", "הצגות ילדים", "הצגה אורחת"];

/**
 * Cameri-specific image extraction — runs inside page.evaluate().
 *
 * The Cameri WordPress site often sets og:image to a generic
 * "רפרטואר הקאמרי 2026" banner rather than the show poster.
 * This function prioritises the actual show image in the DOM:
 *
 *  1. Large <img> in the main content area (before #actors) from wp-content
 *  2. og:image — but only if it looks show-specific (skip known banners)
 *  3. First large visible <img> outside the cast/footer sections
 *
 * Must be self-contained (runs in browser context).
 * @returns {string | null}
 */
export function extractCameriImage() {
  const SKIP_SRC = [
    "logo",
    "icon",
    "facebook",
    "instagram",
    "tiktok",
    "youtube",
    "twitter",
  ];
  const BANNER_PATTERNS = [
    /rep\d{2}/,
    /repertoire/,
    /רפרטואר/,
    /magazine/,
    /מגזין/,
  ];

  function isBanner(url) {
    // Decode percent-encoded URLs so Hebrew patterns like /רפרטואר/ match
    let decoded;
    try {
      decoded = decodeURIComponent(url);
    } catch {
      decoded = url;
    }
    const lower = decoded.toLowerCase();
    return BANNER_PATTERNS.some((p) => p.test(lower));
  }

  function isSkipped(src) {
    const lower = (src || "").toLowerCase();
    return SKIP_SRC.some((s) => lower.includes(s));
  }

  // Strategy 1: Large wp-content image in the main content area (not in #actors).
  const actorsSection = document.querySelector("#actors");
  const imgs = Array.from(document.querySelectorAll("img"));
  for (const img of imgs) {
    const src = img.src || img.dataset?.src || "";
    if (!src || isSkipped(src)) continue;
    // Skip images inside the actors/cast section (headshots).
    if (actorsSection && actorsSection.contains(img)) continue;
    // Skip images inside footer.
    const footer = img.closest("footer");
    if (footer) continue;
    const rect = img.getBoundingClientRect();
    if (rect.width > 300 && rect.height > 200) {
      if (!isBanner(src)) return src;
    }
  }

  // Strategy 2: og:image — but only if it looks show-specific.
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage) {
    const content = ogImage.getAttribute("content");
    if (content && !isBanner(content)) return content;
  }

  // Strategy 3: twitter:image (same filter).
  const twitterImage = document.querySelector('meta[name="twitter:image"]');
  if (twitterImage) {
    const content = twitterImage.getAttribute("content");
    if (content && !isBanner(content)) return content;
  }

  // Strategy 4: Any large visible image outside actors/footer.
  for (const img of imgs) {
    const src = img.src || img.dataset?.src || "";
    if (!src || isSkipped(src)) continue;
    if (actorsSection && actorsSection.contains(img)) continue;
    if (img.closest("footer")) continue;
    const rect = img.getBoundingClientRect();
    if (rect.width > 200 && rect.height > 100) {
      if (!isBanner(src)) return src;
    }
  }

  return null;
}

// ── Schedule page scraper ──────────────────────────────────────

/**
 * Scrape the Cameri repertoire page.
 * Returns an array of `{ title, url }` with deduplicated titles,
 * sorted alphabetically in Hebrew.
 *
 * @param {import("puppeteer").Browser} browser
 * @returns {Promise<Array<{ title: string, url: string }>>}
 */
export async function fetchSchedule(browser) {
  const page = await browser.newPage();
  await setupRequestInterception(page);

  await page.goto(REPERTOIRE_URL, {
    waitUntil: "networkidle2",
    timeout: 30_000,
  });

  // Wait for show-card links to appear (either decoded or encoded href).
  await page
    .waitForSelector(
      `a[href*="${REPERTOIRE_PATH}"], a[href*="${REPERTOIRE_PATH_ENCODED}"]`,
      { timeout: 15_000 },
    )
    .catch(() => {
      // If the specific selector isn't found, the page may lazy-load —
      // scroll to trigger and retry.
    });

  // Scroll the page to trigger any lazy-loaded cards.
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let total = 0;
      const step = 400;
      const timer = setInterval(() => {
        window.scrollBy(0, step);
        total += step;
        if (total >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });

  // Small pause for any remaining renders after scrolling.
  await new Promise((r) => setTimeout(r, 1_000));

  const shows = await page.evaluate(
    (base, repPath, repPathEnc, catPrefixes) => {
      const map = new Map();
      const allLinks = document.querySelectorAll("a[href]");

      for (const a of allLinks) {
        const href = a.getAttribute("href") || "";

        // Must contain the repertoire path segment.
        if (!href.includes(repPath) && !href.includes(repPathEnc)) continue;

        // Extract only the pathname (handles both absolute and relative URLs).
        let pathname;
        try {
          pathname = new URL(href, base).pathname;
        } catch {
          continue;
        }

        // Skip English-locale pages.
        if (pathname.startsWith("/en/")) continue;

        // Must be a sub-page of the repertoire (not the listing page itself).
        // Strip the repertoire path prefix and check a sub-slug remains.
        const subSlug = pathname
          .replace(repPath, "")
          .replace(repPathEnc, "")
          .replace(/\//g, "");
        if (!subSlug) continue;

        // Skip links inside <video> fallback text.
        if (a.closest("video")) continue;

        // Build absolute URL.
        const url = href.startsWith("http") ? href : `${base}${href}`;

        // Extract title from the first line of the card's text.
        const rawText = a.textContent.trim();
        if (!rawText) continue;

        // Skip video fallback text patterns.
        if (rawText.includes("browser") && rawText.includes("support"))
          continue;

        // Take first line — the rest is genre/writer/director metadata.
        let title = rawText.split("\n")[0].trim();

        // Strip category prefixes that precede the show name.
        for (const prefix of catPrefixes) {
          if (title.startsWith(prefix)) {
            title = title.slice(prefix.length).trim();
            break;
          }
        }

        title = title.replace(/^חדש\s+/, "");
        if (!title) continue;

        // Deduplicate by title (first link wins).
        if (!map.has(title)) {
          map.set(title, url);
        }
      }

      return [...map.entries()].map(([t, u]) => ({ title: t, url: u }));
    },
    CAMERI_BASE,
    REPERTOIRE_PATH,
    REPERTOIRE_PATH_ENCODED,
    CATEGORY_PREFIXES,
  );

  await page.close();
  return shows.sort((a, b) => a.title.localeCompare(b.title, "he"));
}

// ── Detail page scraper ────────────────────────────────────────

/**
 * Scrape a single Cameri show detail page (new WP layout).
 *
 * Key selectors:
 *   h1.huge-title             → title
 *   article#about .show-content → description paragraphs
 *   p.meshech b               → duration text (Hebrew textual, e.g. "שעה וחצי")
 *   #actors p.actor-name      → cast names
 *   og:image / extractImageFromPage → poster image
 *
 * @param {import("puppeteer").Browser} browser
 * @param {string} url
 * @returns {Promise<{ title: string, durationMinutes: number | null, description: string, imageUrl: string | null, cast: string | null }>}
 */
export async function scrapeShowDetails(browser, url) {
  const page = await browser.newPage();
  await setupRequestInterception(page, { allowImages: true });

  await page.goto(url, { waitUntil: "networkidle2", timeout: 30_000 });
  await page.waitForSelector("h1", { timeout: 15_000 });

  // ── FIRST evaluate: title, duration, description, cast ──
  const data = await page.evaluate(() => {
    // ── Title ──
    const h1 = document.querySelector("h1");
    let title = h1 ? h1.textContent.trim() : "";
    title = title.replace(/^חדש\s+/, "");

    // ── Duration (raw text — parsed outside browser context) ──
    let durationRaw = null;
    const meshech = document.querySelector("p.meshech b");
    if (meshech) {
      durationRaw = meshech.textContent.trim();
    }
    // Fallback: try to find it in the body text.
    if (!durationRaw) {
      const body = document.body.innerText;
      const m = body.match(/משך ההצגה:\s*(.+)/);
      if (m) durationRaw = m[1].split("\n")[0].trim();
    }

    // ── Description ──
    let description = "";
    const aboutContent = document.querySelector("#about .show-content");
    if (aboutContent) {
      description = aboutContent.innerText.trim();
    }
    // Fallback: text-marker approach.
    if (!description) {
      const body = document.body.innerText;
      const aboutMarker = "על ההצגה";
      const stopMarkers = [
        "צוות אמנותי",
        "בהשתתפות",
        "חשבנו שתאהבו גם",
        "תאריכים ורכישת כרטיסים",
        "משך ההצגה",
      ];
      const aboutIdx = body.indexOf(aboutMarker);
      if (aboutIdx !== -1) {
        let rest = body.slice(aboutIdx + aboutMarker.length).trim();
        let endIdx = rest.length;
        for (const marker of stopMarkers) {
          const idx = rest.indexOf(marker);
          if (idx !== -1 && idx < endIdx) endIdx = idx;
        }
        description = rest.slice(0, endIdx).trim();
      }
    }
    // Clean up description.
    description = description
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\*צילום:.*$/gm, "")
      .replace(/\*פוסטר.*$/gm, "")
      .replace(/^\*[^\n]*$/gm, "")
      .replace(/צפייה בתוכנייה/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    // ── Cast (DOM-based — much more reliable than text markers) ──
    let cast = null;
    const actorNames = [];
    // Primary: named actor links with p.actor-name.
    document.querySelectorAll("#actors p.actor-name").forEach((el) => {
      const name = el.textContent.trim();
      if (name) actorNames.push(name);
    });
    // Also pick up ensemble members (musicals — section.actors.company).
    document
      .querySelectorAll("section.actors.company p.actor-name")
      .forEach((el) => {
        const name = el.textContent.trim();
        if (name) actorNames.push(name);
      });
    // Also include "doubles" text (alternating cast note).
    const doublesEl = document.querySelector("#actors p.doubles");
    let doublesText = "";
    if (doublesEl) {
      doublesText = doublesEl.textContent.trim();
    }
    if (actorNames.length > 0) {
      // Deduplicate (preserving order).
      cast = [...new Set(actorNames)].join(", ");
      if (doublesText) cast += ` (${doublesText})`;
    }

    return { title, durationRaw, description, cast };
  });

  // ── SECOND evaluate: image (Cameri-specific — skips generic repertoire banners) ──
  const imageUrl = await page.evaluate(extractCameriImage);

  if (imageUrl) {
    data.imageUrl = fixDoubleProtocol(imageUrl);
  } else {
    data.imageUrl = null;
  }

  // Parse duration outside browser context using shared Hebrew parser.
  let durationMinutes = parseLessinDuration(data.durationRaw);
  // Fallback: plain numeric ("90 דקות") in case some pages use that format.
  if (durationMinutes == null && data.durationRaw) {
    const numMatch = data.durationRaw.match(/(\d+)\s*דקות/);
    if (numMatch) durationMinutes = parseInt(numMatch[1], 10);
  }

  await page.close();
  return {
    title: data.title,
    durationMinutes,
    description: data.description,
    imageUrl: data.imageUrl,
    cast: data.cast,
  };
}

// ── Cast-only scraper ──────────────────────────────────────────

/**
 * Scrape only cast data from a Cameri show detail page.
 * Uses DOM-based extraction from the new WP layout.
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
      const names = [];

      // Main cast: actor links with named elements.
      document.querySelectorAll("#actors p.actor-name").forEach((el) => {
        const name = el.textContent.trim();
        if (name) names.push(name);
      });

      // Ensemble (musicals).
      document
        .querySelectorAll("section.actors.company p.actor-name")
        .forEach((el) => {
          const name = el.textContent.trim();
          if (name) names.push(name);
        });

      // Alternating cast / extra actors text.
      const doublesEl = document.querySelector("#actors p.doubles");
      if (doublesEl) {
        const extra = doublesEl.textContent.trim();
        if (extra) names.push(`(${extra})`);
      }

      if (names.length === 0) {
        // Fallback: text-marker approach for pages with non-standard layout.
        const body = document.body.innerText;
        const castMarker = "בהשתתפות";
        const stopMarkers = [
          "להקה",
          "תזמורת",
          "גלריה",
          "ביקורות",
          "חשבנו שתאהבו גם",
          "תאריכים ורכישת כרטיסים",
        ];
        const castIdx = body.indexOf(castMarker);
        if (castIdx !== -1) {
          let castRest = body.slice(castIdx + castMarker.length).trim();
          let castEndIdx = castRest.length;
          for (const marker of stopMarkers) {
            const idx = castRest.indexOf(marker);
            if (idx !== -1 && idx < castEndIdx) castEndIdx = idx;
          }
          const rawCast = castRest.slice(0, castEndIdx).trim();
          if (rawCast) {
            return rawCast
              .replace(/\n/g, " ")
              .replace(/\s{2,}/g, " ")
              .replace(/,\s*$/, "")
              .trim();
          }
        }
        return "";
      }

      return [...new Set(names)].join(", ");
    });

    return cast || null;
  } finally {
    await page.close();
  }
}
