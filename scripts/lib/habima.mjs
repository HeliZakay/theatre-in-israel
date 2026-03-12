/**
 * Habima Theatre scraping helpers — repertoire listing and show detail extraction.
 *
 * Centralises all Habima-specific scraping logic so it can be
 * imported by any script that needs it.
 */

import { fixDoubleProtocol, extractImageFromPage } from "./image.mjs";
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
 * Returns `{ title, durationMinutes, description, imageUrl, cast }`.
 *
 * @param {import("puppeteer").Browser} browser
 * @param {string} url
 * @returns {Promise<{ title: string, durationMinutes: number | null, description: string, imageUrl: string | null, cast: string }>}
 */
export async function scrapeShowDetails(browser, url) {
  const page = await browser.newPage();
  await setupRequestInterception(page, { allowImages: true });

  await page.goto(url, { waitUntil: "networkidle2", timeout: 60_000 });
  await page.waitForSelector("h1", { timeout: 30_000 });

  const data = await page.evaluate((extractImage) => {
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

    // ── Cast ──
    let cast = "";
    const castSectionMarkers = ["יוצרים ושחקנים", "יוצרים ומשתתפים"];
    const castStopMarkers = [
      "להורדת התכנייה",
      "רוצים לראות עוד",
      "מנויים מקבלים",
    ];

    // Crew-role keywords — lines whose LEFT side contains any of these are crew, not cast
    const crewKeywords = [
      "מחזה",
      "בימוי",
      "עיצוב",
      "מוסיקה",
      "תאורה",
      "תלבושות",
      "וידאו",
      "תנועה",
      "קריינות",
      "צילום",
      'עפ"י',
      "ע.במאי",
      "דרמטורג",
      "תרגום",
      "הפקה",
      "כוריאוגרפיה",
      "עריכה",
      "הלחנה",
      "ליווי",
      "עיבוד",
      "פוסטר",
      "לחן",
      "מילים",
      "עיבוד מוסיקלי",
      "ניהול מוסיקלי",
      "עיצוב סאונד",
      "סאונד",
      "הנחיה",
      "ייעוץ",
      "פיקוח",
      "תסריט",
      "עריכת",
      "ניהול",
      "במאי",
      "מעצב",
      "מלחין",
      "מתרגם",
      "כתיבה",
    ];

    let castSectionStart = -1;
    for (const marker of castSectionMarkers) {
      const idx = body.indexOf(marker);
      if (idx !== -1) {
        castSectionStart = idx + marker.length;
        break;
      }
    }

    if (castSectionStart !== -1) {
      let castText = body.slice(castSectionStart);

      // Trim at the earliest stop marker
      for (const stop of castStopMarkers) {
        const idx = castText.indexOf(stop);
        if (idx !== -1) castText = castText.slice(0, idx);
      }

      const lines = castText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const actors = [];

      for (const line of lines) {
        if (!line.includes(":") && !line.includes("：")) continue;

        // Split on the LAST colon to handle role names that might contain colons
        const colonIdx = line.lastIndexOf(":");
        if (colonIdx === -1) continue;

        const left = line.slice(0, colonIdx).trim();
        const right = line.slice(colonIdx + 1).trim();

        if (!left || !right) continue;

        // Check if the left side is a crew role
        const leftLower = left;
        const isCrew = crewKeywords.some((kw) => leftLower.includes(kw));
        if (isCrew) continue;

        // right side contains actor name(s), possibly with / for alternates
        // Normalize slash separators: ensure spaces around /
        const cleaned = right
          .replace(/\s*\/\s*/g, " / ")
          .replace(/\s+/g, " ")
          .trim();

        if (cleaned) actors.push(cleaned);
      }

      cast = actors.join(", ");
    }

    return { title, durationMinutes, description, cast };
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

// ── Events scraper ─────────────────────────────────────────────

/**
 * Scrape performance dates/times from a Habima Theatre show detail page.
 *
 * Website format — performances are in `div.presentations ul li` items.
 * There are two `<ul>` elements inside `.presentations`:
 *   - First `<ul>` (no class): next 3 upcoming dates (visible)
 *   - Second `<ul class="collapse" id="presentationsDates">`: additional dates (collapsed)
 * Both are queried together via `div.presentations ul li`.
 *
 * Each `<li>` contains a `<time class="time" datetime="YYYY-MM-DD HH:MM:SS">` —
 * the full ISO datetime is read directly from the `datetime` attribute.
 * Ticket URL is in the `href` of the `<a>` link inside the `<li>`.
 *
 * Habima is a fixed venue (תיאטרון הבימה, תל אביב).
 *
 * @param {import("puppeteer").Browser} browser
 * @param {string} url — show detail page URL
 * @param {{ debug?: boolean }} [options]
 * @returns {Promise<{
 *   events: Array<{ date: string, hour: string, venueName: string, venueCity: string, ticketUrl: string|null, rawText: string }>,
 *   title: string,
 *   debugHtml?: string
 * }>}
 */
export async function scrapeShowEvents(browser, url, { debug = false } = {}) {
  const page = await browser.newPage();
  await setupRequestInterception(page);

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector("h1", { timeout: 15_000 });
  // Wait for the presentations section (gracefully absent if show has no upcoming dates)
  await page
    .waitForSelector("div.presentations", { timeout: 8_000 })
    .catch(() => {});

  const result = await page.evaluate((debugMode) => {
    const output = { events: [], title: "", debugHtml: null };

    // ── Page title ──
    const h1 = document.querySelector("h1");
    let title = h1 ? h1.textContent.replace(/\s+/g, " ").trim() : "";
    // Strip "הצגה אורחת" prefix (sometimes concatenated without space)
    title = title.replace(/^הצגה אורחת/, "").trim();
    output.title = title;

    const container = document.querySelector("div.presentations");
    if (!container) {
      if (debugMode) output.debugHtml = document.body.innerHTML.slice(0, 10_000);
      return output;
    }

    // Query both visible and collapsed UL lists
    const items = container.querySelectorAll("ul li");
    const events = [];

    for (const li of items) {
      const timeEl = li.querySelector("time.time");
      if (!timeEl) continue;

      // datetime="2026-03-30 20:00:00"
      const datetimeAttr = timeEl.getAttribute("datetime") || "";
      // Parse: "YYYY-MM-DD HH:MM" (with optional :SS)
      const dtMatch = datetimeAttr.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/);
      if (!dtMatch) continue;

      const dateStr = dtMatch[1]; // "2026-03-30"
      const timeStr = dtMatch[2]; // "20:00"

      const ticketLink = li.querySelector("a[href]");
      const ticketUrl = ticketLink ? ticketLink.getAttribute("href") : null;

      const rawText = li.textContent?.replace(/\s+/g, " ").trim() || "";

      events.push({
        date: dateStr,
        hour: timeStr,
        ticketUrl,
        rawText: rawText.slice(0, 250),
      });
    }

    if (debugMode) {
      output.debugHtml = container.outerHTML;
    }

    output.events = events;
    return output;
  }, debug);

  await page.close();

  // Deduplicate by ticketUrl or date+hour
  const processed = [];
  const seen = new Set();

  for (const e of result.events) {
    const key = e.ticketUrl || `${e.date}|${e.hour}`;

    if (!seen.has(key)) {
      seen.add(key);
      processed.push({
        date: e.date,
        hour: e.hour,
        venueName: HABIMA_THEATRE,
        venueCity: "תל אביב",
        ticketUrl: e.ticketUrl,
        rawText: e.rawText,
      });
    }
  }

  result.events = processed;
  return result;
}
