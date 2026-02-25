/**
 * Habima Theatre scraping helpers — repertoire listing and show detail extraction.
 *
 * Centralises all Habima-specific scraping logic so it can be
 * imported by any script that needs it.
 */

import { fixDoubleProtocol } from "./image.mjs";
import { setupRequestInterception } from "./browser.mjs";

// ── Constants ──────────────────────────────────────────────────

export const HABIMA_THEATRE = "תיאטרון הבימה";
export const HABIMA_BASE = "https://www.habima.co.il";
export const REPERTOIRE_URL =
  "https://www.habima.co.il/%D7%A8%D7%A4%D7%A8%D7%98%D7%95%D7%90%D7%A8/";

// ── Repertoire page scraper ────────────────────────────────────

/**
 * Scrape the Habima repertoire page.
 * Returns an array of `{ title, url }` with deduplicated titles,
 * sorted alphabetically in Hebrew.
 *
 * @param {import("puppeteer").Browser} browser
 * @returns {Promise<Array<{ title: string, url: string }>>}
 */
export async function fetchRepertoire(browser) {
  const page = await browser.newPage();
  await setupRequestInterception(page);

  await page.goto(REPERTOIRE_URL, {
    waitUntil: "networkidle2",
    timeout: 60_000,
  });
  await page.waitForSelector('a[href*="/shows/"]', { timeout: 30_000 });

  const shows = await page.evaluate((base) => {
    const map = new Map();

    // Strategy: find all show cards by looking for h3 elements,
    // then locate the nearest a[href*="/shows/"] within the same
    // parent container to get the URL.
    const headings = document.querySelectorAll("h3");

    for (const h3 of headings) {
      let title = h3.textContent.trim();
      if (!title) continue;
      // Normalize whitespace (some titles have extra spaces)
      title = title.replace(/\s+/g, " ").trim();

      // Skip generic non-title text
      if (
        title === "לרכישה" ||
        title === "לתאריכים ורכישה" ||
        title === "רוצים לראות עוד?" ||
        title.length < 2
      )
        continue;

      // Walk up to find a parent container that also contains a show link
      let container = h3.parentElement;
      let link = null;
      for (let i = 0; i < 5 && container; i++) {
        link = container.querySelector('a[href*="/shows/"]');
        if (link) break;
        container = container.parentElement;
      }

      if (!link) continue;

      const href = link.getAttribute("href") || "";
      if (!href.includes("/shows/")) continue;

      const url = href.startsWith("http") ? href : `${base}${href}`;

      if (!map.has(title)) {
        map.set(title, url);
      }
    }

    // Fallback: also collect unique /shows/ hrefs that we might have missed
    // and try to pair them with nearby headings
    const allLinks = document.querySelectorAll('a[href*="/shows/"]');
    for (const a of allLinks) {
      const href = a.getAttribute("href") || "";
      if (!href.includes("/shows/")) continue;

      const url = href.startsWith("http") ? href : `${base}${href}`;

      // Check if we already have this URL
      const existingUrls = new Set([...map.values()]);
      if (existingUrls.has(url)) continue;

      // Try to find a title from a nearby h3
      let container = a.parentElement;
      let h3 = null;
      for (let i = 0; i < 5 && container; i++) {
        h3 = container.querySelector("h3");
        if (h3) break;
        container = container.parentElement;
      }

      if (h3) {
        const title = h3.textContent.trim().replace(/\s+/g, " ");
        if (title && title.length >= 2 && !map.has(title)) {
          map.set(title, url);
        }
      }
    }

    return [...map.entries()].map(([title, url]) => ({ title, url }));
  }, HABIMA_BASE);

  await page.close();
  return shows.sort((a, b) => a.title.localeCompare(b.title, "he"));
}

// ── Detail page scraper ────────────────────────────────────────

/**
 * Scrape a single Habima show detail page.
 * Returns `{ title, durationMinutes, description, imageUrl }`.
 *
 * @param {import("puppeteer").Browser} browser
 * @param {string} url
 * @returns {Promise<{ title: string, durationMinutes: number | null, description: string, imageUrl: string | null }>}
 */
export async function scrapeShowDetails(browser, url) {
  const page = await browser.newPage();
  await setupRequestInterception(page, { allowImages: true });

  await page.goto(url, { waitUntil: "networkidle2", timeout: 60_000 });
  await page.waitForSelector("h1", { timeout: 30_000 });

  const data = await page.evaluate(() => {
    // ── Title ──
    const h1 = document.querySelector("h1");
    let title = h1 ? h1.textContent.trim() : "";
    // Strip "הצגה אורחת" prefix (sometimes concatenated without space)
    title = title.replace(/^הצגה אורחת/, "").trim();
    // Collapse newlines in multi-line h1 elements to a single space
    title = title
      .replace(/\n+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();

    // ── Duration ──
    let durationMinutes = null;
    const body = document.body.innerText;
    const durationMatch = body.match(/משך ההצגה:\s*(\d+)\s*דקות/);
    if (durationMatch) {
      durationMinutes = parseInt(durationMatch[1], 10);
    }

    // ── Description ──
    // Habima pages: h1 title, then h2 subtitle, then description body.
    // No "על ההצגה" marker like Cameri. Description starts after h1.
    let description = "";
    const stopMarkers = [
      "הצגות קרובות",
      "יוצרים ומשתתפים",
      "יוצרים ושחקנים",
      "ביקורות",
      "משך ההצגה",
      "מנויים מקבלים",
    ];

    // Find h1 title position in body text, then capture text after it
    const titleIdx = body.indexOf(title);
    if (titleIdx !== -1) {
      let rest = body.slice(titleIdx + title.length).trim();

      // Find the earliest stop marker
      let endIdx = rest.length;
      for (const marker of stopMarkers) {
        const idx = rest.indexOf(marker);
        if (idx !== -1 && idx < endIdx) endIdx = idx;
      }

      description = rest.slice(0, endIdx).trim();

      // Clean up
      // Remove age restriction lines
      description = description.replace(/גילאי\s*\d+\s*\+/g, "");
      // Remove photo credit lines
      description = description.replace(/\*צילום:.*$/gm, "");
      // Remove asterisked lines
      description = description.replace(/^\*[^\n]*$/gm, "");
      // Remove book/sponsor credit blocks
      description = description.replace(/הספר.*יצא לאור[^\n]*/g, "");
      description = description.replace(/הפקה נתמכה[^\n]*/g, "");
      // Collapse excess newlines
      description = description.replace(/\n{3,}/g, "\n\n").trim();
    }

    // ── Image URL ──
    let imageUrl = null;

    // Strategy 1: og:image meta tag
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) {
      const content = ogImage.getAttribute("content");
      if (content) imageUrl = content;
    }

    // Strategy 2: twitter:image meta tag
    if (!imageUrl) {
      const twitterImage = document.querySelector('meta[name="twitter:image"]');
      if (twitterImage) {
        const content = twitterImage.getAttribute("content");
        if (content) imageUrl = content;
      }
    }

    // Strategy 3: Large visible <img> elements (skip logos/icons)
    if (!imageUrl) {
      const imgs = Array.from(document.querySelectorAll("img"));
      for (const img of imgs) {
        const src = img.src || img.dataset?.src || "";
        if (
          !src ||
          src.includes("logo") ||
          src.includes("icon") ||
          src.includes("facebook") ||
          src.includes("instagram")
        )
          continue;
        const rect = img.getBoundingClientRect();
        if (rect.width > 200 && rect.height > 100) {
          imageUrl = src;
          break;
        }
      }
    }

    // Strategy 4: Hero/banner background images
    if (!imageUrl) {
      const heroSelectors = [
        ".hero",
        ".show-hero",
        ".banner",
        ".header-image",
        '[class*="hero"]',
        '[class*="banner"]',
      ];
      for (const selector of heroSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          const bg = getComputedStyle(el).backgroundImage;
          const match = bg.match(/url\(["']?(.*?)["']?\)/);
          if (match) {
            imageUrl = match[1];
            break;
          }
        }
      }
    }

    return { title, durationMinutes, description, imageUrl };
  });

  // Fix double-protocol URLs outside the browser context
  if (data.imageUrl) {
    data.imageUrl = fixDoubleProtocol(data.imageUrl);
  }

  await page.close();
  return data;
}
