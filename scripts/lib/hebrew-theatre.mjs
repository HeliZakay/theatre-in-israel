/**
 * Hebrew Theatre scraping helpers — show listing and show detail extraction.
 *
 * Centralises all Hebrew-Theatre-specific scraping logic so it can be
 * imported by any script that needs it.
 */

import { fixDoubleProtocol, extractImageFromPage } from "./image.mjs";
import { setupRequestInterception } from "./browser.mjs";

// ── Constants ──────────────────────────────────────────────────

export const HEBREW_THEATRE = "התיאטרון העברי";
export const HEBREW_THEATRE_BASE = "https://www.teatron.org.il";
export const SHOWS_URL = "https://www.teatron.org.il/shows/";

// ── Shows page scraper ─────────────────────────────────────────

/**
 * Scrape the Hebrew Theatre shows page.
 * Returns an array of `{ title, url }` with deduplicated titles,
 * sorted alphabetically in Hebrew.
 *
 * @param {import("puppeteer").Browser} browser
 * @returns {Promise<Array<{ title: string, url: string }>>}
 */
export async function fetchShows(browser) {
  const page = await browser.newPage();
  await setupRequestInterception(page);

  await page.goto(SHOWS_URL, {
    waitUntil: "networkidle2",
    timeout: 60_000,
  });
  await page.waitForSelector('a[href*="/shows/"]', { timeout: 30_000 });

  const shows = await page.evaluate((base) => {
    const map = new Map();

    const blocklist = [
      "הצטרפו לתוכנית המנויים שלנו",
      "הצגות",
      "שתפו חברים",
      "תאריכי הצגות",
      "ניווט מהיר",
      "צרו קשר",
      "הצטרפו אלינו",
    ];

    // Strategy: find all show cards by looking for h2 and h3 elements,
    // then locate the nearest a[href*="/shows/"] within the same
    // parent container to get the URL.
    const headings = document.querySelectorAll("h2, h3");

    for (const heading of headings) {
      let title = heading.textContent.trim();
      if (!title) continue;
      // Normalize whitespace (some titles have extra spaces)
      title = title.replace(/\s+/g, " ").trim();

      // Skip generic non-title text
      if (blocklist.includes(title) || title.length < 2) continue;

      // Walk up to find a parent container that also contains a show link
      let container = heading.parentElement;
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

      // Try to find a title from a nearby h2 or h3
      let container = a.parentElement;
      let heading = null;
      for (let i = 0; i < 5 && container; i++) {
        heading =
          container.querySelector("h2") || container.querySelector("h3");
        if (heading) break;
        container = container.parentElement;
      }

      if (heading) {
        const title = heading.textContent.trim().replace(/\s+/g, " ");
        if (title && title.length >= 2 && !map.has(title)) {
          map.set(title, url);
        }
      }
    }

    return [...map.entries()].map(([title, url]) => ({ title, url }));
  }, HEBREW_THEATRE_BASE);

  await page.close();
  return shows.sort((a, b) => a.title.localeCompare(b.title, "he"));
}

// ── Detail page scraper ────────────────────────────────────────

/**
 * Scrape a single Hebrew Theatre show detail page.
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
    // Collapse newlines in multi-line h1 elements to a single space
    title = title
      .replace(/\n+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();

    // ── Duration ──
    const durationMinutes = null;

    // ── Description ──
    let description = "";
    const stopMarkers = ["יוצרים:", "שתפו חברים", "תאריכי הצגות", "משתתפים:"];

    // Find h1 title position in body text, then capture text after it
    const body = document.body.innerText;
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
      // Remove photo credit lines
      description = description.replace(/צילום:.*$/gm, "");
      // Remove asterisked lines
      description = description.replace(/^\*[^\n]*$/gm, "");
      // Collapse excess newlines
      description = description.replace(/\n{3,}/g, "\n\n").trim();
    }

    return { title, durationMinutes, description };
  });

  // ── Image URL (using shared extraction logic) ──
  // extractImageFromPage must be passed as the pageFunction (not as a
  // serialised argument) because Puppeteer cannot serialise functions.
  const imageUrl = await page.evaluate(extractImageFromPage);

  // Fix double-protocol URLs outside the browser context
  if (imageUrl) {
    data.imageUrl = fixDoubleProtocol(imageUrl);
  } else {
    data.imageUrl = null;
  }

  await page.close();
  return data;
}
