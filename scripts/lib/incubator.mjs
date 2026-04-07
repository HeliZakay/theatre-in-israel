/**
 * Incubator Theatre scraping helpers — show listing and show detail extraction.
 *
 * Centralises all Incubator-specific scraping logic so it can be
 * imported by any script that needs it.
 *
 * Incubator (תיאטרון האינקובטור) is a theatre company producing
 * original Hebrew productions and English-language musicals.
 * Their website is built on WordPress + Elementor + JetEngine.
 *
 * Listing pages: two JetEngine grids contain different subsets of shows:
 *   /repertoire/           — English-language musicals + select Hebrew shows
 *   /show-type/play-category/ — Hebrew original productions
 * Both must be scraped and deduplicated.
 *
 * Detail pages: /{show-slug}/ with h1 title, description paragraphs,
 * "יוצרים ושחקנים" credits heading, "משך ההצגה:" duration text,
 * and CSS background-image posters on Elementor elements.
 */

import { fixDoubleProtocol } from "./image.mjs";
import { setupRequestInterception } from "./browser.mjs";
import { parseLessinDuration } from "./duration.mjs";

// ── Constants ──────────────────────────────────────────────────

export const INCUBATOR_THEATRE = "תיאטרון האינקובטור";
const INCUBATOR_BASE = "https://incubator.org.il";
const LISTING_URLS = [
  "https://incubator.org.il/repertoire/",
  "https://incubator.org.il/show-type/play-category/",
];

/** Entries on listing pages that are not theatrical shows. */
const NON_SHOW_PATTERNS = ["פואטרי סלאם", "poetry slam", "קול קורא"];

// ── Shows listing page scraper ─────────────────────────────────

/**
 * Fetch the list of current shows from the Incubator website.
 *
 * Scrapes both listing pages (repertoire + play-category) and
 * deduplicates by URL. Each page uses a JetEngine grid with
 * `.jet-listing-grid__item` cards containing overlay links.
 *
 * @param {import('puppeteer').Browser} browser
 * @returns {Promise<Array<{title: string, url: string}>>}
 */
export async function fetchListing(browser) {
  const allShows = new Map(); // url → title

  for (const listingUrl of LISTING_URLS) {
    const page = await browser.newPage();
    await setupRequestInterception(page);

    await page.goto(listingUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });

    // Wait for the JetEngine grid to render
    try {
      await page.waitForSelector(".jet-listing-grid__item", {
        timeout: 30_000,
      });
    } catch {
      // No items on this page — continue to the next listing
      await page.close();
      continue;
    }

    // Click "View More" button repeatedly to load all items
    for (let i = 0; i < 10; i++) {
      const clicked = await page.evaluate(() => {
        const btn = document.querySelector(".jet-view-more__button");
        if (!btn || btn.offsetParent === null) return false;
        btn.click();
        return true;
      });
      if (!clicked) break;
      await new Promise((r) => setTimeout(r, 2000));
    }

    const shows = await page.evaluate((nonShowPatterns) => {
      const results = [];
      const items = document.querySelectorAll(".jet-listing-grid__item");

      for (const item of items) {
        // Find the overlay link pointing to the show detail page
        const link =
          item.querySelector(".jet-engine-listing-overlay-link") ||
          item.querySelector("a[href]");
        if (!link) continue;

        const url = link.href;
        if (!url || url === window.location.href) continue;
        // Only include show detail pages (skip venue/location links)
        if (!url.includes("/repertoire/")) continue;

        // Extract title from card text — first meaningful line
        const text = item.innerText.trim();
        const lines = text
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 1);

        let title = lines[0] || "";
        title = title.replace(/\s+/g, " ").trim();
        if (!title || title.length < 2) continue;

        // Skip non-show entries
        const lower = title.toLowerCase();
        if (
          nonShowPatterns.some(
            (p) => lower.includes(p) || title.includes(p),
          )
        )
          continue;

        results.push({ title, url });
      }

      return results;
    }, NON_SHOW_PATTERNS);

    for (const show of shows) {
      if (!allShows.has(show.url)) {
        allShows.set(show.url, show.title);
      }
    }

    await page.close();
  }

  return [...allShows.entries()]
    .map(([url, title]) => ({ title, url }))
    .sort((a, b) => a.title.localeCompare(b.title, "he"));
}

// ── Detail page scraper ────────────────────────────────────────

/**
 * Credit line prefixes — paragraphs starting with these are credits,
 * not part of the show description.
 */
const CREDIT_PREFIXES = [
  "מאת:",
  "מאת ובבימוי:",
  "בימוי:",
  "דרמטורגיה:",
  "שחקנים:",
  "שחקנים יוצרים:",
  "צוות השחקנים:",
  "בהשתתפות:",
  "בכיכוב:",
  "תפאורה:",
  "תלבושות:",
  "מוסיקה:",
  "תאורה:",
  "צילום:",
  "כוריאוגרפיה:",
  "עיצוב תנועה:",
  "עיצוב תלבושות:",
  "עיצוב במה:",
  "עיצוב תאורה:",
  "עיצוב סאונד:",
  "הפקה:",
  "ניהול הפקה:",
  "מנהל מוסיקלי:",
  "כתיבה ולחנים:",
  "כתיבה:",
  "לחנים:",
  "תרגום:",
  "עריכה ובימוי:",
  "ליווי אומנותי:",
  "עיבוד:",
  "עיבוד מוסיקלי:",
];

/**
 * Cast markers — text following these labels contains actor names.
 */
const CAST_MARKERS = [
  "שחקנים יוצרים:",
  "צוות השחקנים:",
  "שחקנים:",
  "שחקניות:",
  "שחקנים/ות:",
  "בהשתתפות:",
  "בכיכוב:",
  "משחק:",
];

/**
 * Scrape show details (title, duration, description, image, cast)
 * from an Incubator Theatre detail page.
 *
 * @param {import('puppeteer').Browser} browser
 * @param {string} url
 * @returns {Promise<{title: string, durationMinutes: number|null, description: string, imageUrl: string|null, cast: string|null}>}
 */
export async function scrapeShowDetails(browser, url) {
  const page = await browser.newPage();
  await setupRequestInterception(page, { allowImages: true });

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector("h1", { timeout: 30_000 });

  // Small delay for Elementor client-side rendering to settle
  await new Promise((r) => setTimeout(r, 1500));

  const data = await page.evaluate((creditPrefixes, castMarkers) => {
    // ── Title ──
    const h1 = document.querySelector("h1");
    let title = h1 ? h1.textContent.trim().replace(/\s+/g, " ") : "";

    // ── Duration (raw text) ──
    let rawDuration = null;
    const bodyText = document.body.innerText;
    const durMatch = bodyText.match(/משך ההצגה:\s*(.+?)(?:\n|$)/);
    if (durMatch) {
      rawDuration = durMatch[1]
        .replace(/כולל הפסקה\.?/, "")
        .replace(/ללא הפסקה\.?/, "")
        .replace(/בערך/, "")
        .replace(/\.\s*$/, "")
        .trim();
    }

    // ── Find credits section boundary ──
    // The credits heading "יוצרים ושחקנים" is typically an h4 element.
    const creditsHeading = [...document.querySelectorAll("h1, h2, h3, h4, h5, h6")]
      .find((h) => h.textContent.trim().includes("יוצרים ושחקנים"));

    // ── Description ──
    // Collect paragraphs that appear BEFORE the credits heading in the DOM.
    const allPs = [...document.querySelectorAll("p")];
    const descParts = [];

    for (const p of allPs) {
      const text = p.textContent.trim();
      if (!text || text.length < 20) continue;
      if (p.closest("nav") || p.closest("footer") || p.closest("header"))
        continue;

      // Skip paragraphs that come after the credits heading
      // compareDocumentPosition bit 4 = DOCUMENT_POSITION_FOLLOWING
      if (creditsHeading && creditsHeading.compareDocumentPosition(p) & 4)
        continue;

      // Skip duration lines
      if (text.includes("משך ההצגה:")) continue;
      // Skip credit lines
      if (creditPrefixes.some((prefix) => text.startsWith(prefix))) continue;
      // Skip English credit lines
      if (/^(Director|Musical Director|Choreographer|Production Manager|Stage Manager|Lighting Design|Cast|Starring):/i.test(text))
        continue;
      // Skip promotional/ticket lines
      if (text.includes("לרכישת כרטיסים")) continue;
      if (text.includes("הצגה קרובה:")) continue;
      if (text.includes("Click for tickets")) continue;
      // Skip age recommendation lines
      if (/מגיל\s*\d+|לגילאי\s*\d+|מותאם לגילאי|מיועדת לגילאי|Recommended for ages|Parental guidance/i.test(text))
        continue;
      // Skip cookie/tracking text
      if (text.includes("עוגיות") && text.includes("מדיניות הפרטיות"))
        continue;
      // Skip date/time-only lines
      if (/^\w+,\s+(January|February|March|April|May|June|July|August|September|October|November|December|\d)/.test(text))
        continue;

      descParts.push(text.replace(/\s+/g, " ").trim());
    }
    const description = descParts.join("\n\n");

    // ── Cast ──
    let cast = null;
    const creditsText = creditsHeading
      ? bodyText.slice(bodyText.indexOf("יוצרים ושחקנים"))
      : bodyText;

    for (const marker of castMarkers) {
      const idx = creditsText.indexOf(marker);
      if (idx === -1) continue;

      let raw = creditsText.slice(idx + marker.length).trim();

      // Stop at the next credit label or double-newline
      let endIdx = raw.length;
      for (const prefix of creditPrefixes) {
        const pi = raw.indexOf(prefix);
        if (pi !== -1 && pi < endIdx) endIdx = pi;
      }
      const dblNewline = raw.indexOf("\n\n");
      if (dblNewline !== -1 && dblNewline < endIdx) endIdx = dblNewline;
      // Also stop at single newline (each credit is on its own line)
      const singleNewline = raw.indexOf("\n");
      if (singleNewline !== -1 && singleNewline < endIdx) endIdx = singleNewline;

      cast = raw.slice(0, endIdx).trim();
      // Clean up — trim trailing punctuation
      cast = cast.replace(/[.\u200F\u200E]+$/, "").trim();
      cast = cast.replace(/,\s*$/, "").trim();
      if (cast) break;
      cast = null;
    }

    // ── Image ──
    // Incubator uses CSS background-image on Elementor elements (inline styles).
    let imageUrl = null;

    // Strategy 1: inline style background-image with wp-content/uploads
    const styledEls = document.querySelectorAll(
      '[style*="background-image"]',
    );
    for (const el of styledEls) {
      const style = el.getAttribute("style") || "";
      const match = style.match(
        /background-image:\s*url\(["']?(.*?)["']?\)/,
      );
      if (!match) continue;
      const src = match[1];
      if (!src.includes("wp-content/uploads")) continue;
      if (/logo|icon/i.test(src)) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width > 200 && rect.height > 150) {
        imageUrl = src;
        break;
      }
    }

    // Strategy 2: og:image fallback
    if (!imageUrl) {
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) {
        const content = ogImage.getAttribute("content");
        if (content && content.startsWith("http")) imageUrl = content;
      }
    }

    // Strategy 3: large <img> in content area
    if (!imageUrl) {
      const imgs = document.querySelectorAll("img");
      for (const img of imgs) {
        const src = img.src || "";
        if (!src.includes("wp-content/uploads")) continue;
        if (/logo|icon/i.test(src)) continue;
        if (img.closest("nav") || img.closest("footer")) continue;
        const rect = img.getBoundingClientRect();
        if (rect.width > 200 && rect.height > 150) {
          imageUrl = src;
          break;
        }
      }
    }

    return { title, rawDuration, description, imageUrl, cast };
  }, CREDIT_PREFIXES, CAST_MARKERS);

  await page.close();

  // Parse duration outside browser context
  const durationMinutes = parseLessinDuration(data.rawDuration);

  // Fix image URL
  const imageUrl = data.imageUrl ? fixDoubleProtocol(data.imageUrl) : null;

  return {
    title: data.title,
    durationMinutes,
    description: data.description,
    imageUrl,
    cast: data.cast,
  };
}
