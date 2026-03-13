/**
 * toMix Theatre scraping helpers — show listing and show detail extraction.
 *
 * Site: to-mix.co.il (WordPress + WooCommerce, custom theme)
 * Listing: div.boxitem[data-url] cards with hover text
 * Detail: custom product template, og:image for images
 */

import { fixDoubleProtocol, extractImageFromPage } from "./image.mjs";
import { setupRequestInterception } from "./browser.mjs";

// ── Constants ──────────────────────────────────────────────────

export const TOMIX_THEATRE = "תיאטרון toMix";
const LISTING_URL =
  "https://www.to-mix.co.il/product-category/tomixtheater/?page=1";

// ── Shows page scraper ─────────────────────────────────────────

/**
 * Scrape the toMix Theatre listing page.
 * Returns an array of `{ title, url }` sorted alphabetically in Hebrew.
 *
 * Cards are `div.boxitem[data-url]` with the show URL in `data-url`.
 * Title is the first line of `.boxitem_content_hover` text.
 *
 * @param {import("puppeteer").Browser} browser
 * @returns {Promise<Array<{ title: string, url: string }>>}
 */
export async function fetchShows(browser) {
  const page = await browser.newPage();
  await setupRequestInterception(page);

  await page.goto(LISTING_URL, { waitUntil: "networkidle2", timeout: 60_000 });
  await page.waitForSelector("div.boxitem[data-url]", { timeout: 30_000 });

  const shows = await page.evaluate(() => {
    const cards = document.querySelectorAll("div.boxitem[data-url]");
    const results = [];
    const seenUrls = new Set();

    for (const card of cards) {
      const url = card.getAttribute("data-url") || "";
      if (!url || !url.includes("/product/") || seenUrls.has(url)) continue;
      seenUrls.add(url);

      // Title is the first paragraph of the hover overlay
      const hoverEl = card.querySelector(".boxitem_content_hover");
      const hoverText = hoverEl?.innerText?.trim() || "";
      const title = hoverText.split("\n")[0]?.trim() || "";

      if (!title) continue;

      results.push({ title, url });
    }

    return results;
  });

  await page.close();
  return shows.sort((a, b) => a.title.localeCompare(b.title, "he"));
}

// ── Detail page scraper ────────────────────────────────────────

/**
 * Scrape a single toMix show detail page.
 * Returns `{ title, durationMinutes, description, imageUrl, cast }`.
 *
 * @param {import("puppeteer").Browser} browser
 * @param {string} url
 * @returns {Promise<{ title: string, durationMinutes: number | null, description: string, imageUrl: string | null, cast: string | null }>}
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
    title = title
      .replace(/\n+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();

    // ── Body text for extraction ──
    const bodyText = document.body.innerText;

    // ── Duration ──
    const durMatch = bodyText.match(/(\d+)\s*דקות/);
    const durationMinutes = durMatch ? parseInt(durMatch[1], 10) : null;

    // ── Description ──
    // Text is between the title area and credits/cast markers
    let description = "";
    const stopMarkers = [
      "שחקנים:",
      "בהשתתפות:",
      "במאי:",
      "בימוי:",
      "כוריאוגרפיה:",
      "תרגום:",
      "עיבוד ובימוי:",
      "ניהול מוסיקלי:",
      "עיצוב",
      "מוסיקה מקורית:",
      "כתיבה:",
      "מחבר:",
      "לקוחות מקס",
      "מחיר כרטיס",
      "לרכישה",
      "MORE",
    ];

    // Find body text starting after the product header area
    // Look for the theatre credit line or the title itself
    const theatreMarker = "תיאטרון toMix";
    let startIdx = bodyText.indexOf(theatreMarker);
    if (startIdx !== -1) {
      startIdx = bodyText.indexOf("\n", startIdx);
    } else {
      // Fallback: start after the h1 title
      const titleIdx = bodyText.indexOf(title);
      if (titleIdx !== -1) {
        startIdx = titleIdx + title.length;
      }
    }

    if (startIdx !== -1) {
      // Skip past "מה במיקס" and "חשוב לדעת" tabs
      let rest = bodyText.slice(startIdx).trim();
      const tabSkip = rest.indexOf("\n\n");
      if (tabSkip !== -1 && tabSkip < 200) {
        // Check if the first chunk is just tab labels
        const firstChunk = rest.slice(0, tabSkip).trim();
        if (
          firstChunk.includes("מה במיקס") ||
          firstChunk.includes("חשוב לדעת")
        ) {
          rest = rest.slice(tabSkip).trim();
        }
      }

      // Also skip repeated title + "מה במיקס\nחשוב לדעת" header
      const headerPatterns = [
        /^מה במיקס\n?חשוב לדעת\n?/,
        /^חשוב לדעת\n?/,
      ];
      for (const pat of headerPatterns) {
        rest = rest.replace(pat, "").trim();
      }

      // Skip past venue lines like "תיאטרון toMix, אקספו ת"א"
      const venuePattern = /^תיאטרון toMix[^\n]*\n/;
      rest = rest.replace(venuePattern, "").trim();

      // Skip "תיאטרון toMix גאה להציג:" or similar
      rest = rest.replace(/^תיאטרון toMix[^\n]*\n/i, "").trim();

      // Find the earliest stop marker
      let endIdx = rest.length;
      for (const marker of stopMarkers) {
        const idx = rest.indexOf(marker);
        if (idx !== -1 && idx < endIdx) endIdx = idx;
      }

      description = rest.slice(0, endIdx).trim();

      // Clean up
      description = description.replace(/צילום:.*$/gm, "");
      description = description.replace(/^\*[^\n]*$/gm, "");
      description = description.replace(/\n{3,}/g, "\n\n").trim();
    }

    // ── Cast ──
    // Only search within the product content area (before "כרטיס להצגה"
    // which marks the purchase section). Everything after that is price
    // info and "MORE" recommended shows whose cast would be wrong.
    let cast = null;
    const productBoundary = bodyText.indexOf("כרטיס להצגה");
    const searchText =
      productBoundary !== -1 ? bodyText.slice(0, productBoundary) : bodyText;

    const castMarkers = ["שחקנים:", "בהשתתפות:"];
    for (const marker of castMarkers) {
      const idx = searchText.indexOf(marker);
      if (idx === -1) continue;

      let castText = searchText.slice(idx + marker.length).trim();

      // End at double newline — cast names are in one block.
      // If the text before \n\n ends with "." it's definitely the end.
      // Otherwise, check if what follows looks like more cast names
      // (short comma-separated Hebrew segments ≤ 20 chars each) vs
      // description (longer segments).
      let searchFrom = 0;
      while (true) {
        const dblNewline = castText.indexOf("\n\n", searchFrom);
        if (dblNewline === -1) break;

        const beforeGap = castText.slice(0, dblNewline).trim();

        // Period before the gap = definite end of cast list
        if (beforeGap.endsWith(".")) {
          castText = beforeGap;
          break;
        }

        const afterGap = castText.slice(dblNewline + 2).trim();
        if (!afterGap) {
          castText = beforeGap;
          break;
        }

        // If the last line before the gap is a "בתפקיד" role line,
        // the ensemble cast likely follows — continue.
        const lastLine = beforeGap.split("\n").filter(Boolean).pop() || "";
        if (lastLine.includes("בתפקיד")) {
          searchFrom = dblNewline + 2;
          continue;
        }

        // Check if what follows looks like a name list:
        // split on commas, each segment should be short (≤ 20 chars)
        const firstLine = afterGap.split("\n")[0];
        const segments = firstLine.split(",").map((s) => s.trim());
        const looksLikeNames =
          segments.length >= 2 &&
          segments.every((s) => s.length > 0 && s.length <= 20);

        if (looksLikeNames) {
          searchFrom = dblNewline + 2;
          continue;
        }

        // Not a name list — this is the boundary
        castText = beforeGap;
        break;
      }

      // Also end at explicit stop markers if they come earlier
      const castStopMarkers = [
        "ובליווי",
        "תרגום:",
        "בימוי:",
        "במאי:",
        "כוריאוגרפיה:",
        "ניהול מוסיקלי:",
        "עיצוב",
        "מוסיקה מקורית:",
        "מאת",
        "קרדיט",
      ];
      let castEnd = castText.length;
      for (const m of castStopMarkers) {
        const i = castText.indexOf(m);
        if (i !== -1 && i < castEnd) castEnd = i;
      }
      castText = castText.slice(0, castEnd).trim();

      // Normalize to single line
      castText = castText
        .replace(/\n+/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();
      castText = castText.replace(/,([^\s])/g, ", $1");
      castText = castText.replace(/\.\s*$/, "").trim();

      if (castText) {
        cast = castText;
        break;
      }
    }

    return { title, durationMinutes, description, cast };
  });

  // ── Image URL (og:image via shared extraction logic) ──
  const imageUrl = await page.evaluate(extractImageFromPage);
  if (imageUrl) {
    data.imageUrl = fixDoubleProtocol(imageUrl);
  } else {
    data.imageUrl = null;
  }

  await page.close();
  return data;
}
