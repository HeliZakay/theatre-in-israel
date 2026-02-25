/**
 * Cameri Theatre scraping helpers — schedule listing and show detail extraction.
 *
 * Centralises all Cameri-specific scraping logic so it can be
 * imported by any script that needs it.
 */

import puppeteer from "puppeteer";
import { extractImageFromPage, fixDoubleProtocol } from "./image.mjs";

// ── Constants ──────────────────────────────────────────────────

export const CAMERI_THEATRE = "תיאטרון הקאמרי";
export const CAMERI_BASE = "https://www.cameri.co.il";
export const SCHEDULE_URL =
  "https://www.cameri.co.il/%D7%9C%D7%95%D7%97_%D7%94%D7%A6%D7%92%D7%95%D7%AA_%D7%9E%D7%9C%D7%90";

// ── Browser helpers ────────────────────────────────────────────

/**
 * Launch a headless Puppeteer browser.
 * @returns {Promise<import("puppeteer").Browser>}
 */
export async function launchBrowser() {
  return puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}

/**
 * Set up lightweight request interception on a page — blocks
 * images, stylesheets, fonts, and media to speed up scraping.
 *
 * @param {import("puppeteer").Page} page
 * @param {{ allowImages?: boolean }} [options]
 */
export async function setupRequestInterception(
  page,
  { allowImages = false } = {},
) {
  await page.setRequestInterception(true);
  const blocked = ["stylesheet", "font", "media"];
  if (!allowImages) blocked.push("image");

  page.on("request", (req) => {
    if (blocked.includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });
}

// ── Schedule page scraper ──────────────────────────────────────

/**
 * Scrape the Cameri schedule page.
 * Returns an array of `{ title, url }` with deduplicated titles,
 * sorted alphabetically in Hebrew.
 *
 * @param {import("puppeteer").Browser} browser
 * @returns {Promise<Array<{ title: string, url: string }>>}
 */
export async function fetchSchedule(browser) {
  const page = await browser.newPage();
  await setupRequestInterception(page);

  await page.goto(SCHEDULE_URL, { waitUntil: "networkidle2", timeout: 30_000 });
  await page.waitForSelector('a[href*="show_"]', { timeout: 15_000 });

  const shows = await page.evaluate((base) => {
    const map = new Map();
    document.querySelectorAll('a[href*="/show_"]').forEach((a) => {
      let text = a.textContent.trim();
      if (!text) return;
      if (text.includes("לפרטים ותאריכים")) return;
      text = text.replace(/^חדש\s+/, "");

      if (!map.has(text)) {
        const href = a.getAttribute("href") || "";
        const url = href.startsWith("http") ? href : `${base}${href}`;
        map.set(text, url);
      }
    });
    return [...map.entries()].map(([title, url]) => ({ title, url }));
  }, CAMERI_BASE);

  await page.close();
  return shows.sort((a, b) => a.title.localeCompare(b.title, "he"));
}

// ── Detail page scraper ────────────────────────────────────────

/**
 * Scrape a single Cameri show detail page.
 * Returns `{ title, durationMinutes, description, imageUrl }`.
 *
 * @param {import("puppeteer").Browser} browser
 * @param {string} url
 * @returns {Promise<{ title: string, durationMinutes: number | null, description: string, imageUrl: string | null }>}
 */
export async function scrapeShowDetails(browser, url) {
  const page = await browser.newPage();
  await setupRequestInterception(page, { allowImages: false });

  await page.goto(url, { waitUntil: "networkidle2", timeout: 30_000 });
  await page.waitForSelector("h1", { timeout: 15_000 });

  const data = await page.evaluate((extractImageFn) => {
    // ── Title ──
    const h1 = document.querySelector("h1");
    let title = h1 ? h1.textContent.trim() : "";
    title = title.replace(/^חדש\s+/, "");

    // ── Duration ──
    let durationMinutes = null;
    const body = document.body.innerText;
    const durationMatch = body.match(/משך ההצגה:\s*(\d+)\s*דקות/);
    if (durationMatch) {
      durationMinutes = parseInt(durationMatch[1], 10);
    }

    // ── Description ──
    let description = "";
    const aboutMarker = "על ההצגה";
    const stopMarkers = ["צוות ושחקנים", "משך ההצגה", "גלריית תמונות"];
    const aboutIdx = body.indexOf(aboutMarker);
    if (aboutIdx !== -1) {
      let rest = body.slice(aboutIdx + aboutMarker.length).trim();
      let endIdx = rest.length;
      for (const marker of stopMarkers) {
        const idx = rest.indexOf(marker);
        if (idx !== -1 && idx < endIdx) endIdx = idx;
      }
      description = rest
        .slice(0, endIdx)
        .trim()
        .replace(/\n{3,}/g, "\n\n")
        .replace(/\*צילום:.*$/gm, "")
        .replace(/^\*[^\n]*$/gm, "")
        .replace(/תכניה/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    }

    // ── Image URL ──
    // We can't call an imported function inside page.evaluate, so
    // the image extraction logic is inlined here (same strategies).
    let imageUrl = null;

    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) {
      const content = ogImage.getAttribute("content");
      if (content) imageUrl = content;
    }

    if (!imageUrl) {
      const twitterImage = document.querySelector('meta[name="twitter:image"]');
      if (twitterImage) {
        const content = twitterImage.getAttribute("content");
        if (content) imageUrl = content;
      }
    }

    if (!imageUrl) {
      const imgs = Array.from(document.querySelectorAll("img"));
      for (const img of imgs) {
        const src = img.src || img.dataset?.src || "";
        if (src.includes("prdPics")) {
          imageUrl = src;
          break;
        }
      }
    }

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
