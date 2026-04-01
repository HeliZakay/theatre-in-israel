/**
 * Meshulash Theatre scraping helpers — show listing and show detail extraction.
 *
 * Centralises all Meshulash-specific scraping logic so it can be
 * imported by any script that needs it.
 *
 * Meshulash (תיאטרון המשולש) is an LGBTQ+ theatre based at the
 * Gay Center in Tel Aviv. Their website is built on Wix (fully
 * client-rendered).
 *
 * Listing: the /shows page has a Wix Pro Gallery, but gallery items
 * lack href links. Active shows with proper URLs are available in
 * the nav submenu under "הצגות המשולש".
 *
 * Detail pages: Wix freeform pages with multiple h1 elements (badge,
 * title, tagline), description paragraphs, duration in "משך ההצגה:"
 * format, cast in "בהשתתפות:" format, and a hero image.
 */

import { fixDoubleProtocol } from "./image.mjs";
import { setupRequestInterception } from "./browser.mjs";
import { parseLessinDuration } from "./duration.mjs";

// ── Constants ──────────────────────────────────────────────────

export const MESHULASH_THEATRE = "תיאטרון המשולש";
export const MESHULASH_BASE = "https://www.hameshulash.com";
export const SHOWS_URL = "https://www.hameshulash.com/shows";

// ── Shows listing page scraper ─────────────────────────────────

/**
 * Fetch the list of current shows from the Meshulash website.
 *
 * Extracts show links from the nav submenu under "הצגות המשולש".
 * On the /shows page the parent menu item has aria-current="page",
 * so its submenu links point to individual show detail pages.
 *
 * The submenu is always present in the DOM (inside the expandable
 * hamburger menu), even when visually hidden.
 *
 * @param {import('puppeteer').Browser} browser
 * @returns {Promise<Array<{title: string, url: string}>>}
 */
export async function fetchListing(browser) {
  const page = await browser.newPage();
  await setupRequestInterception(page);

  await page.goto(SHOWS_URL, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForSelector("nav", { timeout: 30_000 });

  const shows = await page.evaluate((showsUrl) => {
    // Find the menu item marked as current page (we're on /shows)
    const currentItem = document.querySelector(
      'li[aria-current="page"]',
    );
    if (!currentItem) return [];

    // Get submenu links within the current item
    const submenu = currentItem.querySelector("ul");
    if (!submenu) return [];

    const results = [];
    const links = submenu.querySelectorAll("a");

    for (const a of links) {
      const href = a.href;
      if (!href || href === showsUrl) continue;

      let title = a.textContent.trim();
      if (!title || title.length < 2) continue;

      // Normalize whitespace
      title = title.replace(/\s+/g, " ").trim();

      results.push({ title, url: href });
    }

    return results;
  }, SHOWS_URL);

  await page.close();
  return shows.sort((a, b) => a.title.localeCompare(b.title, "he"));
}

// ── Show detail page scraper ──────────────────────────────────

/**
 * Badge patterns to skip when looking for the real show title.
 * These appear as h1 elements on detail pages but are not titles.
 */
const BADGE_PATTERNS = [
  /בכורה/,
  /חדש/,
  /פרמייר/,
  /premiere/i,
];

/**
 * Credit line prefixes — paragraphs starting with these are credits,
 * not part of the show description.
 */
const CREDIT_PREFIXES = [
  "מאת:",
  "מאת ובבימוי:",
  "בימוי:",
  "דרמטורגיה:",
  "בהשתתפות:",
  "תפאורה:",
  "תלבושות:",
  "מוסיקה:",
  "תאורה:",
  "וידאו:",
  "צילום:",
  "ע. במאי:",
  "עוזר במאי:",
  "עוזרת במאי:",
  "כוריאוגרפיה:",
  "עיצוב:",
  "אריזה גרפית:",
  "ליווי אומנותי:",
  "יוצר שותף:",
  "יוצרת שותפה:",
  "עיבוד מוסיקלי:",
  "ניהול מוסיקלי:",
  "הפקה:",
];

/**
 * Scrape show details (title, duration, description, image, cast)
 * from a Meshulash Theatre detail page.
 *
 * @param {import('puppeteer').Browser} browser
 * @param {string} url
 * @returns {Promise<{title: string, durationMinutes: number|null, description: string, imageUrl: string|null, cast: string|null}>}
 */
export async function scrapeShowDetails(browser, url) {
  const page = await browser.newPage();
  await setupRequestInterception(page, { allowImages: true });

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForFunction(
    () => document.querySelectorAll("h1").length > 0,
    { timeout: 30_000 },
  );

  // Small delay for Wix client-side rendering to settle
  await new Promise((r) => setTimeout(r, 1500));

  const data = await page.evaluate((badgePatterns, creditPrefixes) => {
    // ── Title ──
    const h1s = [...document.querySelectorAll("h1")];
    const badgeRe = badgePatterns.map((p) => new RegExp(p));
    let title = "";
    for (const h1 of h1s) {
      const text = h1.textContent.trim().replace(/\s+/g, " ");
      if (text.length < 2) continue;
      if (badgeRe.some((re) => re.test(text))) continue;
      title = text;
      break;
    }

    // ── Duration (raw text) ──
    let rawDuration = null;
    const allPs = [...document.querySelectorAll("p")];
    for (const p of allPs) {
      const text = p.textContent.trim();
      const match = text.match(/משך ההצגה:\s*(.+?)\.?\s*$/);
      if (match) {
        rawDuration = match[1].trim();
        break;
      }
    }

    // ── Cast ──
    let cast = null;
    for (const p of allPs) {
      const text = p.textContent.trim();
      if (text.startsWith("בהשתתפות:")) {
        cast = text.slice("בהשתתפות:".length).trim();
        // Clean: remove trailing credit lines if they appear on the same line
        cast = cast.split("\n")[0].trim();
        break;
      }
    }

    // ── Description ──
    const descParts = [];
    for (const p of allPs) {
      const text = p.textContent.trim();
      if (text.length < 30) continue;
      // Skip paragraphs inside nav or footer
      if (p.closest("nav") || p.closest("footer")) continue;
      // Skip duration lines
      if (text.includes("משך ההצגה:")) continue;
      // Skip credit lines
      if (creditPrefixes.some((prefix) => text.startsWith(prefix))) continue;
      // Skip promotional/disclaimer lines
      if (text.includes("הנחה על בירה") || text.includes("להכניס לאולם"))
        continue;
      if (text.includes("שימו לב:") && text.includes("מגיל")) continue;
      descParts.push(text);
    }
    const description = descParts.join("\n\n");

    // ── Image ──
    let imageUrl = null;
    const imgs = [...document.querySelectorAll("img")];
    for (const img of imgs) {
      const src = img.src || "";
      if (!src.includes("wixstatic.com")) continue;
      // Skip small images
      const rect = img.getBoundingClientRect();
      if (rect.width < 300 || rect.height < 200) continue;
      // Skip nav/footer/logo images
      if (img.closest("nav") || img.closest("footer")) continue;
      if (/logo|icon|גרדיאנט|gradient/i.test(img.alt || "")) continue;
      if (/logo|icon|גרדיאנט|gradient/i.test(src)) continue;
      imageUrl = src;
      break;
    }

    // Fallback: og:image
    if (!imageUrl) {
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) imageUrl = ogImage.getAttribute("content");
    }

    return { title, rawDuration, description, imageUrl, cast };
  },
  BADGE_PATTERNS.map((re) => re.source),
  CREDIT_PREFIXES,
  );

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
