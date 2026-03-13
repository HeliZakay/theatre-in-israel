/**
 * toMix Theatre scraping helpers — show listing and show detail extraction.
 *
 * Site: to-mix.co.il (WordPress + WooCommerce, custom theme)
 * Listing: div.boxitem[data-url] cards with hover text
 * Detail: custom product template, og:image for images
 */

import { fixDoubleProtocol, extractImageFromPage } from "./image.mjs";
import { setupRequestInterception } from "./browser.mjs";
import { resolveVenueCity } from "./venues.mjs";
import { parseShortYear } from "./date.mjs";

// ── Constants ──────────────────────────────────────────────────

export const TOMIX_THEATRE = "תיאטרון toMix";
const LISTING_URL =
  "https://www.to-mix.co.il/product-category/tomixtheater/?page=1";

// ── Title prefixes to strip ────────────────────────────────────

const TITLE_PREFIXES = [/^המחזמר\s+/];

/**
 * Clean a toMix listing title:
 * - Strip known prefixes (e.g. "המחזמר")
 * - Strip subtitles after " - " or " | "
 * - Strip trailing "| לכרטיסים" etc.
 * - If the first line is a producer credit (ends with ":"),
 *   take the next line and strip surrounding quotes.
 *
 * @param {string} raw — raw first-line text from hover overlay
 * @param {string} fullText — full hover overlay text
 * @returns {string}
 */
function cleanListingTitle(raw, fullText) {
  let title = raw;

  // If the first line ends with ":" (producer credit), use the next line
  if (title.endsWith(":") || !title) {
    const lines = fullText.split("\n").map((l) => l.trim()).filter(Boolean);
    const nextLine = title.endsWith(":")
      ? lines.find((l) => l !== title)
      : lines[0];
    if (nextLine) {
      title = nextLine.replace(/^["״"]+|["״"]+$/g, ""); // strip quotes
    }
  }

  // Strip known prefixes
  for (const re of TITLE_PREFIXES) {
    title = title.replace(re, "");
  }

  // Strip subtitle after " - " or " | " (keep the main title)
  title = title.replace(/\s+[-–—]\s+.+$/, "");
  title = title.replace(/\s*\|.+$/, "");

  return title.trim();
}

// ── Shows page scraper ─────────────────────────────────────────

/**
 * Scrape the toMix Theatre listing page.
 * Returns an array of `{ title, url }` sorted alphabetically in Hebrew.
 *
 * Cards are `div.boxitem[data-url]` with the show URL in `data-url`.
 * Title is extracted from `.boxitem_content_hover` text and cleaned.
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

      const hoverEl = card.querySelector(".boxitem_content_hover");
      const fullText = hoverEl?.innerText?.trim() || "";
      const firstLine = fullText.split("\n")[0]?.trim() || "";

      results.push({ rawTitle: firstLine, fullText, url });
    }

    return results;
  });

  await page.close();

  // Clean titles outside browser context
  const cleaned = shows
    .map((s) => ({
      title: cleanListingTitle(s.rawTitle, s.fullText),
      url: s.url,
    }))
    .filter((s) => s.title);

  return cleaned.sort((a, b) => a.title.localeCompare(b.title, "he"));
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

// ── Events scraper ─────────────────────────────────────────────

/**
 * Scrape performance dates/times from a toMix show page.
 *
 * Events are loaded via an eventer.co.il iframe embedded on each show page.
 * The iframe URL is `https://www.eventer.co.il/user/tomix?tag=<tag>`.
 * The eventer page renders a table with `tr.ticketItem` rows containing:
 *   - td[0]: venue name (may include ", city" suffix)
 *   - td[1]: "יום DD/MM/YY"
 *   - td[2]: "HH:MM"
 *   - <a>:   ticket link
 *
 * @param {import("puppeteer").Browser} browser
 * @param {string} url — toMix show page URL
 * @param {{ debug?: boolean }} [options]
 * @returns {Promise<{
 *   events: Array<{ date: string, hour: string, venueName: string, venueCity: string, ticketUrl: string|null }>,
 *   debugHtml?: string
 * }>}
 */
export async function scrapeShowEvents(browser, url, { debug = false } = {}) {
  const page = await browser.newPage();
  await setupRequestInterception(page);

  // Load the show page with ?eventbuzz=true to trigger the eventer iframe
  const showUrl = url.includes("eventbuzz")
    ? url
    : `${url}${url.includes("?") ? "&" : "?"}eventbuzz=true`;

  await page.goto(showUrl, { waitUntil: "networkidle2", timeout: 60_000 });

  // Find the eventer iframe src
  const eventerUrl = await page.evaluate(() => {
    const iframe = document.querySelector("iframe.resizableFrame");
    return iframe?.src || "";
  });

  await page.close();

  const result = { events: [], debugHtml: null };

  if (!eventerUrl || !eventerUrl.includes("eventer.co.il")) {
    return result;
  }

  // Navigate directly to the eventer page to scrape events
  const eventerPage = await browser.newPage();
  await setupRequestInterception(eventerPage);

  await eventerPage.goto(eventerUrl, {
    waitUntil: "networkidle2",
    timeout: 60_000,
  });

  const scraped = await eventerPage.evaluate((debugMode) => {
    const output = { events: [], debugHtml: null };

    const rows = document.querySelectorAll("tr.ticketItem");
    for (const tr of rows) {
      const tds = tr.querySelectorAll("td");
      if (tds.length < 3) continue;

      const rawVenue = (tds[0]?.textContent || "").trim();
      const rawDate = (tds[1]?.textContent || "").trim();
      const rawTime = (tds[2]?.textContent || "").trim();
      const link = tr.querySelector("a[href]");
      const ticketUrl = link?.getAttribute("href") || null;

      // Parse date: "יום DD/MM/YY"
      const dateMatch = rawDate.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
      if (!dateMatch) continue;

      const day = dateMatch[1];
      const month = dateMatch[2];
      const rawYear = dateMatch[3];

      // Parse time: "HH:MM"
      const timeMatch = rawTime.match(/(\d{1,2}:\d{2})/);
      const hour = timeMatch ? timeMatch[1] : "";

      output.events.push({
        day: parseInt(day, 10),
        month: parseInt(month, 10),
        rawYear,
        hour,
        rawVenue,
        ticketUrl,
      });
    }

    if (debugMode) {
      output.debugHtml = document.body.innerHTML.slice(0, 5000);
    }

    return output;
  }, debug);

  await eventerPage.close();

  // Process events in Node context (year parsing, venue resolution)
  const seen = new Map();

  for (const e of scraped.events) {
    const year =
      e.rawYear.length >= 4
        ? parseInt(e.rawYear, 10)
        : parseShortYear(e.rawYear);

    const dateStr = `${year}-${String(e.month).padStart(2, "0")}-${String(e.day).padStart(2, "0")}`;

    // Venue: eventer often uses "VenueName, City" format
    let venueName = e.rawVenue;
    let venueCity = "";

    const commaIdx = e.rawVenue.lastIndexOf(",");
    if (commaIdx !== -1) {
      venueName = e.rawVenue.slice(0, commaIdx).trim();
      venueCity = e.rawVenue.slice(commaIdx + 1).trim();
    }

    // Fall back to resolveVenueCity if no city from comma split
    if (!venueCity) {
      venueCity = resolveVenueCity(venueName);
    }

    const key = `${dateStr}|${e.hour}|${venueName}`;
    if (!seen.has(key)) {
      seen.set(key, true);
      result.events.push({
        date: dateStr,
        hour: e.hour,
        venueName,
        venueCity,
        ticketUrl: e.ticketUrl,
      });
    }
  }

  result.debugHtml = scraped.debugHtml;
  return result;
}
