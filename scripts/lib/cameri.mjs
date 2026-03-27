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
import { parseLessinDuration } from "./duration.mjs";
import { normalizeYear, formatDate } from "./date.mjs";

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
const CATEGORY_PREFIXES = [
  "הצגות הקאמרי",
  "מחזמר",
  "הצגות ילדים",
  "הצגה אורחת",
];

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
    waitUntil: "domcontentloaded",
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

        // Extract text — strip <video> fallback text that
        // contaminates textContent on cards with animated posters.
        const cloned = a.cloneNode(true);
        cloned.querySelectorAll("video").forEach((v) => v.remove());
        const rawText = cloned.textContent.trim();
        if (!rawText) continue;

        // Skip links whose ONLY text is video fallback boilerplate.
        if (
          rawText.includes("browser") &&
          rawText.includes("support") &&
          !a.querySelector("h2, h3, h4")
        )
          continue;

        // --- Title extraction (multi-line aware) ---
        const lines = rawText
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);

        // Strategy 1: semantic heading inside the card link
        const headingEl = a.querySelector("h2, h3, h4, [class*='title']");
        let title = headingEl ? headingEl.textContent.trim() : "";

        // Strategy 2: first non-category line
        if (!title) {
          const catSet = new Set(catPrefixes);
          for (const line of lines) {
            if (catSet.has(line)) continue;
            title = line;
            break;
          }
        }

        // Fallback: strip category prefix if it leaked onto the same line
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

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
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
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
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

// ── Events / dates scraper ─────────────────────────────────────

/**
 * Scrape performance dates/times from a Cameri show detail page.
 *
 * The dates section is dynamically loaded, so we need to scroll down
 * and wait for it to render. In debug mode, dumps the raw HTML of the
 * dates area for selector discovery.
 *
 * @param {import("puppeteer").Browser} browser
 * @param {string} url — show detail page URL
 * @param {{ debug?: boolean }} [options]
 * @returns {Promise<{ events: Array<{ date: string, hour: string, venue: string | null, note: string | null }>, debugHtml?: string }>}
 */
export async function scrapeShowEvents(browser, url, { debug = false } = {}) {
  const page = await browser.newPage();
  await setupRequestInterception(page);

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector("h1", { timeout: 15_000 });

  // Scroll to bottom to trigger lazy-loaded dates section.
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

  // Extra wait for the dates widget to render after scroll.
  await new Promise((r) => setTimeout(r, 3_000));

  // Scroll once more (some widgets only load after the first pass).
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise((r) => setTimeout(r, 2_000));

  const result = await page.evaluate((debugMode) => {
    const output = { events: [], debugHtml: null };

    // ── Locate the dates section ──
    // Strategy: find the heading "תאריכים ורכישת כרטיסים" or similar,
    // then grab its parent/sibling container.
    let datesContainer = null;

    // Try known section id/class patterns first.
    datesContainer =
      document.querySelector("#dates") ||
      document.querySelector("[id*='date']") ||
      document.querySelector("[class*='dates-section']") ||
      document.querySelector("[class*='performances']") ||
      document.querySelector("[class*='schedule']") ||
      document.querySelector("[class*='events']");

    // Fallback: find heading with dates-related text and grab parent section.
    if (!datesContainer) {
      const allHeadings = document.querySelectorAll(
        "h2, h3, h4, h5, .section-title, [class*='title']",
      );
      for (const h of allHeadings) {
        const text = h.textContent.trim();
        if (
          text.includes("תאריכים") ||
          text.includes("לוח הופעות") ||
          text.includes("רכישת כרטיסים") ||
          text.includes("הופעות קרובות")
        ) {
          // Walk up to find a reasonable container.
          datesContainer =
            h.closest("section") ||
            h.closest("article") ||
            h.closest("div[class]") ||
            h.parentElement;
          break;
        }
      }
    }

    // Broader fallback: search all text nodes for the dates heading.
    if (!datesContainer) {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
      );
      while (walker.nextNode()) {
        if (walker.currentNode.textContent.includes("תאריכים ורכישת כרטיסים")) {
          datesContainer =
            walker.currentNode.parentElement?.closest("section") ||
            walker.currentNode.parentElement?.closest("div[class]") ||
            walker.currentNode.parentElement?.parentElement;
          break;
        }
      }
    }

    // Last resort: grab everything after the dates heading in body text.
    if (debugMode) {
      if (datesContainer) {
        output.debugHtml = datesContainer.innerHTML;
      } else {
        // Dump the last ~5000 chars of body innerHTML for discovery.
        const bodyHtml = document.body.innerHTML;
        output.debugHtml = bodyHtml.slice(-8000);
      }

      // Also dump all elements with date-like text patterns.
      const allElements = document.querySelectorAll("*");
      const datePatterns = [];
      for (const el of allElements) {
        if (el.children.length > 10) continue; // skip large containers
        const text = el.textContent?.trim() || "";
        // Look for date-like patterns: DD.MM, DD/MM, or Hebrew month names.
        if (
          /\d{1,2}[./]\d{1,2}/.test(text) &&
          text.length < 200 &&
          !el.closest("script") &&
          !el.closest("style")
        ) {
          datePatterns.push({
            tag: el.tagName.toLowerCase(),
            classes: el.className || "",
            id: el.id || "",
            text: text.slice(0, 150),
          });
        }
      }
      output.debugDateElements = datePatterns;
    }

    // ── Extract date/time entries ──
    // Try multiple strategies for extracting structured date data.

    const events = [];

    // Strategy 1 (precise): Cameri's known DOM structure.
    // <ul class="events-of-this-show"> > <li> > <a> > <p>
    //   <span>DD.MM</span> <span>day</span> <span>HH:MM</span>
    //   [<span class="line-under"><span class="sbttls">English subtitles</span></span>]
    // There may be duplicate lists (desktop vs mobile) — we grab them
    // all and deduplicate below, preferring entries with times.
    const eventItems = document.querySelectorAll("ul.events-of-this-show > li");
    for (const li of eventItems) {
      const spans = li.querySelectorAll("p > span");
      if (spans.length < 2) continue;

      // Find the date span (DD.MM) and time span (HH:MM) by content pattern,
      // not by position — the two lists on the page differ in structure.
      let dateText = "";
      let timeText = "";
      for (const span of spans) {
        const t = span.textContent?.trim() || "";
        if (!dateText && /^\d{1,2}\.\d{1,2}$/.test(t)) dateText = t;
        if (!timeText && /^\d{1,2}:\d{2}$/.test(t)) timeText = t;
      }

      const dateMatch = dateText.match(/^(\d{1,2})\.(\d{1,2})$/);
      if (!dateMatch) continue;

      const subtitleEl = li.querySelector("span.sbttls");
      events.push({
        rawDay: parseInt(dateMatch[1], 10),
        rawMonth: parseInt(dateMatch[2], 10),
        rawYear: "",
        hour: timeText || "",
        note: subtitleEl ? subtitleEl.textContent.trim() : null,
        rawText: li.textContent?.trim().slice(0, 250) || "",
      });
    }

    // Strategy 2 (fallback): generic selector search in dates container.
    if (events.length === 0 && datesContainer) {
      const candidates = datesContainer.querySelectorAll(
        "li, tr, .date-card, .performance, [class*='show-date'], a[href*='ticket'], a[href*='כרטיס']",
      );
      for (const el of candidates) {
        const text = el.textContent?.trim() || "";
        const dateMatch = text.match(
          /(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?/,
        );
        const timeMatch = text.match(/(\d{1,2}:\d{2})/);
        if (dateMatch) {
          events.push({
            rawDay: parseInt(dateMatch[1], 10),
            rawMonth: parseInt(dateMatch[2], 10),
            rawYear: dateMatch[3] || "",
            hour: timeMatch ? timeMatch[1] : "",
            note:
              text.includes("כתוביות") || text.includes("subtitles")
                ? "English subtitles"
                : null,
            rawText: text.slice(0, 250),
          });
        }
      }
    }

    // Strategy 3: If no structured elements found, parse the full body text
    // for date+time pairs near each other.
    if (events.length === 0) {
      const bodyText = document.body.innerText;
      // Find all occurrences of date-like patterns.
      const dateRegex =
        /(\d{1,2})[./](\d{1,2})[./](\d{2,4})\s*[\s|,\-–—]*\s*(\d{1,2}:\d{2})?/g;
      let match;
      while ((match = dateRegex.exec(bodyText)) !== null) {
        const surrounding = bodyText.slice(
          Math.max(0, match.index - 50),
          match.index + match[0].length + 50,
        );
        events.push({
          rawDay: parseInt(match[1], 10),
          rawMonth: parseInt(match[2], 10),
          rawYear: match[3] || "",
          hour: match[4] || "",
          note:
            surrounding.includes("כתוביות") || surrounding.includes("subtitles")
              ? "English subtitles"
              : null,
          rawText: surrounding.trim(),
        });
      }
    }

    // Deduplicate by date+hour — the page has duplicate desktop/mobile
    // lists, but two shows on the same day at different times are distinct.
    const bestByDateHour = new Map();
    for (const e of events) {
      const key = `${e.rawDay}.${e.rawMonth}.${e.rawYear}|${e.hour}`;
      const existing = bestByDateHour.get(key);
      if (!existing || (!existing.hour && e.hour)) {
        bestByDateHour.set(key, e);
      }
    }
    output.events = [...bestByDateHour.values()];

    // ── Extract venue from page text ──
    const bodyText = document.body.innerText;
    let venue = null;
    const venueMatch = bodyText.match(/מוצגת ב([^\n,."]+)/);
    if (venueMatch) {
      venue = venueMatch[1].trim();
    }
    output.venue = venue;

    return output;
  }, debug);

  await page.close();

  // ── Convert raw date components to YYYY-MM-DD (Node context) ──
  for (const e of result.events) {
    const year = parseInt(normalizeYear(String(e.rawYear ?? ""), e.rawDay, e.rawMonth), 10);
    e.date = formatDate(e.rawDay, e.rawMonth, year);
    delete e.rawDay;
    delete e.rawMonth;
    delete e.rawYear;
  }

  return result;
}

// Alias for consistent naming across all theatre modules.
export { fetchSchedule as fetchShows };
