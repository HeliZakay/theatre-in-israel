/**
 * Hebrew Theatre scraping helpers — show listing and show detail extraction.
 *
 * Centralises all Hebrew-Theatre-specific scraping logic so it can be
 * imported by any script that needs it.
 */

import { fixDoubleProtocol, extractImageFromPage } from "./image.mjs";
import { setupRequestInterception } from "./browser.mjs";
import { resolveVenueCity } from "./venues.mjs";

// Re-export for any external consumers
export { resolveVenueCity };

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
export async function fetchListing(browser) {
  const page = await browser.newPage();
  await setupRequestInterception(page);

  await page.goto(SHOWS_URL, {
    waitUntil: "domcontentloaded",
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
 * Returns `{ title, durationMinutes, description, imageUrl, cast }`.
 *
 * @param {import("puppeteer").Browser} browser
 * @param {string} url
 * @returns {Promise<{ title: string, durationMinutes: number | null, description: string, imageUrl: string | null, cast: string | null }>}
 */
export async function scrapeShowDetails(browser, url) {
  const page = await browser.newPage();
  await setupRequestInterception(page, { allowImages: true });

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
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

    // ── Cast ──
    let cast = null;
    const castMarker = "משתתפים:";
    const castStopMarkers = ["שתפו חברים", "תאריכי הצגות"];
    const castIdx = body.indexOf(castMarker);
    if (castIdx !== -1) {
      let castText = body.slice(castIdx + castMarker.length).trim();

      // Find the earliest stop marker
      let castEnd = castText.length;
      for (const marker of castStopMarkers) {
        const idx = castText.indexOf(marker);
        if (idx !== -1 && idx < castEnd) castEnd = idx;
      }

      castText = castText.slice(0, castEnd).trim();

      // Collapse to a single line and normalize whitespace
      castText = castText
        .replace(/\n+/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();

      // Normalize spacing after commas: ",ניר" → ", ניר"
      castText = castText.replace(/,([^\s])/g, ", $1");

      // Remove trailing period if present
      castText = castText.replace(/\.\s*$/, "").trim();

      if (castText) {
        cast = castText;
      }
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
 * Scrape performance dates/times from a Hebrew Theatre show detail page.
 *
 * Website format per row:
 *   DD/MM/YY   day-abbrev   HH:MM   venue-name   [רכישה](ticket-link)
 *
 * Heading marker: "תאריכי הצגות"
 * Ticket hrefs: *.smarticket.co.il or *tickets.asp
 *
 * @param {import("puppeteer").Browser} browser
 * @param {string} url — show detail page URL
 * @param {{ debug?: boolean }} [options]
 * @returns {Promise<{
 *   events: Array<{ date: string, hour: string, venueName: string, venueCity: string, ticketUrl: string|null, rawText: string }>,
 *   debugHtml?: string,
 *   debugDateElements?: Array
 * }>}
 */
export async function scrapeShowEvents(browser, url, { debug = false } = {}) {
  const page = await browser.newPage();
  await setupRequestInterception(page);

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector("h1", { timeout: 15_000 });

  // Scroll to trigger lazy-loaded dates section
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let total = 0;
      const step = 400;
      const timer = setInterval(() => {
        window.scrollBy(0, step);
        total += step;
        if (total >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
  await new Promise((r) => setTimeout(r, 3_000));

  // Second scroll pass
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise((r) => setTimeout(r, 2_000));

  const result = await page.evaluate((debugMode) => {
    const output = { events: [], debugHtml: null, debugDateElements: null };
    const events = [];

    // ── Helpers ──
    function parseYear(yy) {
      const n = parseInt(yy, 10);
      return n < 70 ? 2000 + n : 1900 + n;
    }

    const TICKET_RE = /smarticket\.co\.il|tickets\.asp/i;
    const DATE_RE = /(\d{1,2})\/(\d{1,2})\/(\d{2})/;
    const TIME_RE = /(\d{1,2}:\d{2})/;

    // ── Strategy 1: ticket links (precise) ──
    const ticketLinks = [...document.querySelectorAll("a")].filter((a) =>
      TICKET_RE.test(a.getAttribute("href") || ""),
    );

    if (ticketLinks.length > 0) {
      const seenHrefs = new Map();

      for (const a of ticketLinks) {
        const href = a.getAttribute("href") || "";
        if (seenHrefs.has(href)) continue;

        let row = a.closest("tr");
        if (!row) {
          let cur = a.parentElement;
          while (cur && cur !== document.body) {
            const t = cur.textContent || "";
            if (DATE_RE.test(t) && TIME_RE.test(t)) {
              row = cur;
              break;
            }
            cur = cur.parentElement;
          }
        }
        if (!row) row = a.closest("div");
        if (!row) continue;

        seenHrefs.set(href, row);
      }

      for (const [href, row] of seenHrefs) {
        const text = row.textContent?.replace(/\s+/g, " ").trim() || "";

        const dateMatch = text.match(DATE_RE);
        const timeMatch = text.match(TIME_RE);
        if (!dateMatch) continue;

        const day = dateMatch[1].padStart(2, "0");
        const month = dateMatch[2].padStart(2, "0");
        const year = parseYear(dateMatch[3]);

        let venueName = "";
        if (timeMatch) {
          const afterTime = text.slice(
            text.indexOf(timeMatch[0]) + timeMatch[0].length,
          );
          venueName = afterTime.replace(/רכישה.*$/, "").trim();
        }

        events.push({
          date: `${year}-${month}-${day}`,
          hour: timeMatch ? timeMatch[1] : "",
          venueName,
          ticketUrl: href || null,
          rawText: text.slice(0, 250),
        });
      }
    }

    // ── Strategy 2: container fallback ──
    if (events.length === 0) {
      let datesContainer = null;

      const headings = document.querySelectorAll(
        "h2, h3, h4, h5, .section-title, [class*='title']",
      );
      for (const h of headings) {
        const text = h.textContent.trim();
        if (text.includes("תאריכי הצגות") || text.includes("תאריכים")) {
          datesContainer =
            h.closest("section") ||
            h.closest("article") ||
            h.closest("div[class]") ||
            h.parentElement;
          break;
        }
      }

      if (datesContainer) {
        const candidates = datesContainer.querySelectorAll(
          "li, tr, .date-card, .performance, [class*='date'], a",
        );
        for (const el of candidates) {
          const text = el.textContent?.replace(/\s+/g, " ").trim() || "";
          const dateMatch = text.match(DATE_RE);
          const timeMatch = text.match(TIME_RE);
          if (!dateMatch) continue;

          const day = dateMatch[1].padStart(2, "0");
          const month = dateMatch[2].padStart(2, "0");
          const year = parseYear(dateMatch[3]);

          let venueName = "";
          if (timeMatch) {
            const afterTime = text.slice(
              text.indexOf(timeMatch[0]) + timeMatch[0].length,
            );
            venueName = afterTime.replace(/רכישה.*$/, "").trim();
          }

          const link = el.querySelector
            ? el.querySelector("a")
            : el.tagName === "A"
              ? el
              : null;
          const ticketUrl = link ? link.getAttribute("href") || null : null;

          events.push({
            date: `${year}-${month}-${day}`,
            hour: timeMatch ? timeMatch[1] : "",
            venueName,
            ticketUrl:
              ticketUrl && TICKET_RE.test(ticketUrl) ? ticketUrl : null,
            rawText: text.slice(0, 250),
          });
        }
      }
    }

    // ── Strategy 3: full body text regex (last resort) ──
    if (events.length === 0) {
      const bodyText = document.body.innerText;
      const fullRowRe =
        /(\d{1,2})\/(\d{1,2})\/(\d{2})\s+[א-ת][׳']\s+(\d{1,2}:\d{2})\s+(.+?)(?:\s*רכישה|$)/gm;
      let m;
      while ((m = fullRowRe.exec(bodyText)) !== null) {
        const day = m[1].padStart(2, "0");
        const month = m[2].padStart(2, "0");
        const year = parseYear(m[3]);
        const venueName = m[5].trim();

        events.push({
          date: `${year}-${month}-${day}`,
          hour: m[4],
          venueName,
          ticketUrl: null,
          rawText: bodyText
            .slice(Math.max(0, m.index - 10), m.index + m[0].length + 10)
            .trim(),
        });
      }
    }

    // ── Deduplicate ──
    const bestByKey = new Map();
    for (const e of events) {
      const key = e.ticketUrl || `${e.date}|${e.hour}|${e.venueName}`;
      const existing = bestByKey.get(key);
      if (!existing || (!existing.hour && e.hour)) {
        bestByKey.set(key, e);
      }
    }
    output.events = [...bestByKey.values()];

    // ── Debug output ──
    if (debugMode) {
      let datesContainer = null;
      const headings = document.querySelectorAll("h2, h3, h4, h5");
      for (const h of headings) {
        if (h.textContent.includes("תאריכי הצגות")) {
          datesContainer =
            h.closest("section") || h.closest("div[class]") || h.parentElement;
          break;
        }
      }
      output.debugHtml = datesContainer
        ? datesContainer.innerHTML
        : document.body.innerHTML.slice(-8000);

      const allEls = document.querySelectorAll("*");
      const datePatterns = [];
      for (const el of allEls) {
        if (el.children.length > 10) continue;
        const text = el.textContent?.trim() || "";
        if (
          /\d{1,2}\/\d{1,2}\/\d{2}/.test(text) &&
          text.length < 300 &&
          !el.closest("script") &&
          !el.closest("style")
        ) {
          datePatterns.push({
            tag: el.tagName.toLowerCase(),
            classes: el.className || "",
            id: el.id || "",
            text: text.slice(0, 200),
          });
        }
      }
      output.debugDateElements = datePatterns;
    }

    return output;
  }, debug);

  await page.close();

  // Resolve venue cities in Node context (has access to resolveVenueCity)
  for (const ev of result.events) {
    ev.venueCity = resolveVenueCity(ev.venueName);
  }

  return result;
}
