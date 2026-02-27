/**
 * Shared browser helpers for Puppeteer-based scrapers.
 *
 * Extracted from cameri.mjs so both Cameri and Habima scrapers
 * can import them without cross-dependency.
 */

import puppeteer from "puppeteer";

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
 * @param {{ allowImages?: boolean, allowStylesheets?: boolean }} [options]
 */
export async function setupRequestInterception(
  page,
  { allowImages = false, allowStylesheets = false } = {},
) {
  await page.setRequestInterception(true);
  const blocked = ["font", "media"];
  if (!allowStylesheets) blocked.push("stylesheet");
  if (!allowImages) blocked.push("image");

  page.on("request", (req) => {
    if (blocked.includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });
}
