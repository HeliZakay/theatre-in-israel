/**
 * Davai Clown Theatre scraping helpers — show listing and show detail extraction.
 *
 * Davai (תיאטרון הליצנות דוואי) is a physical-comedy / clown theatre
 * company based in Tel Aviv producing wordless shows for all ages.
 * Their website is built on WordPress with the Bridge theme.
 *
 * Listing page: /our-shows/ displays portfolio items in a static grid.
 * Detail pages: /portfolio_page/{slug}/ with title, description,
 * creator credits, duration (sometimes), and gallery images.
 */

import { fixDoubleProtocol } from "./image.mjs";
import { setupRequestInterception } from "./browser.mjs";
import { parseLessinDuration } from "./duration.mjs";

// ── Constants ──────────────────────────────────────────────────

export const DAVAI_THEATRE = "תיאטרון הליצנות דוואי";
const LISTING_URL = "https://davai-group.org/our-shows/";

// ── Shows listing page scraper ─────────────────────────────────

/**
 * Fetch the list of current shows from the Davai website.
 *
 * Scrapes the /our-shows/ page which displays portfolio items
 * in a Bridge-theme grid. Each card has an h5 title linking to
 * the detail page at /portfolio_page/{slug}/.
 *
 * @param {import('puppeteer').Browser} browser
 * @returns {Promise<Array<{title: string, url: string}>>}
 */
export async function fetchListing(browser) {
  const page = await browser.newPage();
  await setupRequestInterception(page);

  await page.goto(LISTING_URL, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  await page.waitForSelector('a[href*="/portfolio_page/"]', {
    timeout: 30_000,
  });

  const shows = await page.evaluate(() => {
    const seen = new Map(); // url → title

    const links = document.querySelectorAll('a[href*="/portfolio_page/"]');
    for (const link of links) {
      const url = link.href;
      if (!url) continue;
      if (seen.has(url)) continue;

      // Title: prefer text from parent h5, fall back to link text
      const h5 = link.closest("h5") || link.querySelector("h5");
      let title = "";
      if (h5) {
        title = h5.textContent.trim();
      } else if (link.textContent.trim().length > 1) {
        title = link.textContent.trim();
      }
      if (!title) continue;

      // Strip age rating suffix like "(3+)", "(12+)"
      title = title.replace(/\s*\(\d+\+\)\s*$/, "").trim();
      title = title.replace(/\s+/g, " ");
      if (!title) continue;

      seen.set(url, title);
    }

    return [...seen.entries()].map(([url, title]) => ({ title, url }));
  });

  await page.close();
  return shows.sort((a, b) => a.title.localeCompare(b.title, "he"));
}

// ── Detail page scraper ────────────────────────────────────────

/**
 * Credit line prefixes — paragraphs starting with these are credits,
 * not part of the show description.
 */
const CREDIT_PREFIXES = [
  "יוצרים:",
  "מאת:",
  "בימוי:",
  "שחקנים:",
  "בכיכוב:",
  "משחק:",
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
  "עיבוד:",
  "מנהל אומנותי:",
];

/**
 * Cast markers — text following these labels contains performer names.
 */
const CAST_MARKERS = [
  "שחקנים:",
  "בכיכוב:",
  "משחק:",
  "בהשתתפות:",
  "שחקנים יוצרים:",
];

/**
 * Scrape show details (title, duration, description, image, cast)
 * from a Davai detail page.
 *
 * @param {import('puppeteer').Browser} browser
 * @param {string} url
 * @returns {Promise<{title: string, durationMinutes: number|null, description: string, imageUrl: string|null, cast: string|null}>}
 */
export async function scrapeShowDetails(browser, url) {
  const page = await browser.newPage();
  await setupRequestInterception(page, { allowImages: true });

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector("h1, h2", { timeout: 30_000 });

  // Small delay for client-side rendering to settle
  await new Promise((r) => setTimeout(r, 1500));

  const data = await page.evaluate((creditPrefixes, castMarkers) => {
    // ── Title ──
    const heading = document.querySelector("h1") || document.querySelector("h2");
    let title = heading ? heading.textContent.trim().replace(/\s+/g, " ") : "";
    // Strip age rating suffix
    title = title.replace(/\s*\(\d+\+\)\s*$/, "").trim();

    // ── Duration (raw text) ──
    let rawDuration = null;
    const bodyText = document.body.innerText;

    // Try "משך ההצגה:" label first
    const durLabelMatch = bodyText.match(/משך[^:]*:\s*([^\n]+)/);
    if (durLabelMatch) {
      rawDuration = durLabelMatch[1]
        .replace(/כולל הפסקה\.?/, "")
        .replace(/ללא הפסקה\.?/, "")
        .replace(/בערך/, "")
        .replace(/\.\s*$/, "")
        .trim();
    }

    // Fallback: standalone "NN דק׳" pattern
    if (!rawDuration) {
      const durMatch = bodyText.match(/(\d+)\s*דק[׳']/);
      if (durMatch) {
        rawDuration = durMatch[0];
      }
    }

    // ── Description ──
    const allPs = [...document.querySelectorAll("p")];
    const descParts = [];

    for (const p of allPs) {
      const text = p.textContent.trim();
      if (!text || text.length < 20) continue;
      if (p.closest("nav") || p.closest("footer") || p.closest("header"))
        continue;

      // Skip credit lines
      if (creditPrefixes.some((prefix) => text.startsWith(prefix))) continue;
      // Skip duration lines
      if (text.includes("משך ההצגה:") || text.includes("משך ההצגה")) continue;
      // Skip promotional/ticket lines
      if (text.includes("לרכישת כרטיסים")) continue;
      if (text.includes("להזמנת כרטיסים")) continue;
      // Skip cookie/tracking text
      if (text.includes("עוגיות") && text.includes("מדיניות")) continue;
      // Skip age recommendation lines
      if (/מגיל\s*\d+|לגילאי\s*\d+|מותאם לגילאי|מיועדת לגילאי/i.test(text))
        continue;

      descParts.push(text.replace(/\s+/g, " ").trim());
    }
    const description = descParts.join("\n\n");

    // ── Cast ──
    let cast = null;
    for (const marker of castMarkers) {
      const idx = bodyText.indexOf(marker);
      if (idx === -1) continue;

      let raw = bodyText.slice(idx + marker.length).trim();

      // Stop at the next credit label or double-newline
      let endIdx = raw.length;
      for (const prefix of creditPrefixes) {
        const pi = raw.indexOf(prefix);
        if (pi !== -1 && pi < endIdx) endIdx = pi;
      }
      const dblNewline = raw.indexOf("\n\n");
      if (dblNewline !== -1 && dblNewline < endIdx) endIdx = dblNewline;
      const singleNewline = raw.indexOf("\n");
      if (singleNewline !== -1 && singleNewline < endIdx) endIdx = singleNewline;

      cast = raw.slice(0, endIdx).trim();
      cast = cast.replace(/[.\u200F\u200E]+$/, "").trim();
      cast = cast.replace(/,\s*$/, "").trim();
      if (cast) break;
      cast = null;
    }

    // ── Image ──
    let imageUrl = null;

    // Strategy 1: og:image meta tag
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) {
      const content = ogImage.getAttribute("content");
      if (content && content.startsWith("http")) imageUrl = content;
    }

    // Strategy 2: large <img> with wp-content/uploads
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

    // Strategy 3: CSS background-image with wp-content/uploads
    if (!imageUrl) {
      const styledEls = document.querySelectorAll('[style*="background-image"]');
      for (const el of styledEls) {
        const style = el.getAttribute("style") || "";
        const match = style.match(/background-image:\s*url\(["']?(.*?)["']?\)/);
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
