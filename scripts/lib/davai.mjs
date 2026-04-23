/**
 * Davai Clown Theatre scraping helpers — show listing and show detail extraction.
 *
 * Davai (תיאטרון דוואי) is a physical-comedy / clown theatre
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

export const DAVAI_THEATRE = "תיאטרון דוואי";
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

// ── Events page scraper ───────────────────────────────────────

const EVENTS_URL = "https://davai-group.org/events/list/";

const VENUE_CITY_MAP = {
  "davai theatre studio": "תל אביב-יפו",
  "סטודיו דוואי": "תל אביב-יפו",
  "tel aviv museum of art": "תל אביב",
  "מוזיאון תל אביב לאמנות": "תל אביב",
};

function resolveVenueCity(venueName, addressText) {
  const lower = venueName.toLowerCase();
  for (const [key, city] of Object.entries(VENUE_CITY_MAP)) {
    if (lower.includes(key)) return city;
  }
  if (addressText) {
    const text = addressText.toLowerCase();
    if (/תל.?אביב|tel.?aviv/i.test(text)) return "תל אביב-יפו";
    if (/חיפה|haifa/i.test(text)) return "חיפה";
    if (/ירושלים|jerusalem/i.test(text)) return "ירושלים";
    if (/הוד השרון|hod.?hasharon/i.test(text)) return "הוד השרון";
    if (/ערד|arad/i.test(text)) return "ערד";
    if (/ראשון|rishon/i.test(text)) return "ראשון לציון";
    if (/באר.?שבע|beer.?sheva/i.test(text)) return "באר שבע";
    if (/אשדוד|ashdod/i.test(text)) return "אשדוד";
    if (/נתניה|netanya/i.test(text)) return "נתניה";
    if (/רחובות|rehovot/i.test(text)) return "רחובות";
    if (/פתח.?תקו|petah.?tikva/i.test(text)) return "פתח תקווה";
    if (/כפר.?סבא|kfar.?saba/i.test(text)) return "כפר סבא";
    if (/הרצליה|herzliya/i.test(text)) return "הרצליה";
    if (/רמת.?גן|ramat.?gan/i.test(text)) return "רמת גן";
    if (/ראש פינה|rosh.?pina/i.test(text)) return "ראש פינה";
  }
  return null;
}

function normalizeDavaiTitle(raw) {
  return raw
    .replace(/@.*$/, "")
    .replace(/\|.*$/, "")
    .replace(/\s*\(\d+\+?\)\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Fetch all upcoming events from the central /events/list/ page.
 * Returns a Map<normalizedTitle, Array<event>> for use in scrapeShowEvents.
 *
 * The page uses The Events Calendar (Tribe) WordPress plugin v2.
 * Each event is an `article.tribe-events-calendar-list__event` inside
 * a `.tribe-events-calendar-list__event-row` wrapper.
 */
export async function fetchAllEvents(browser) {
  const page = await browser.newPage();
  await setupRequestInterception(page);

  await page.goto(EVENTS_URL, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  await page
    .waitForSelector(".tribe-events-calendar-list__event-row", { timeout: 15_000 })
    .catch(() => {});

  const rawEvents = await page.evaluate(() => {
    const results = [];
    const rows = document.querySelectorAll(".tribe-events-calendar-list__event-row");

    for (const row of rows) {
      // Title from h4 (not the image link which has empty text)
      const h4 = row.querySelector("h4.tribe-events-calendar-list__event-title");
      const title = h4?.textContent?.trim() || "";

      // Ticket URL from the title link
      const titleLink = h4?.querySelector("a");
      const ticketUrl = titleLink?.getAttribute("href") || null;

      // Date from datetime attr, time from text "Month DD @ HH:MM"
      const timeEl = row.querySelector("time.tribe-events-calendar-list__event-datetime");
      const datetime = timeEl?.getAttribute("datetime") || "";
      const startSpan = row.querySelector(".tribe-event-date-start");
      const startText = startSpan?.textContent?.trim() || "";

      // Venue name and address are separate spans inside <address>
      const venueName = row.querySelector(
        ".tribe-events-calendar-list__event-venue-title"
      )?.textContent?.trim() || "";
      const venueAddress = row.querySelector(
        ".tribe-events-calendar-list__event-venue-address"
      )?.textContent?.trim() || "";

      results.push({ title, datetime, startText, venueName, venueAddress, ticketUrl });
    }

    return results;
  });

  await page.close();

  // Build map by normalized title
  const eventsByTitle = new Map();

  for (const raw of rawEvents) {
    if (!raw.title || !raw.datetime) continue;

    const normalizedTitle = normalizeDavaiTitle(raw.title);
    if (!normalizedTitle) continue;

    // Date from datetime attr ("YYYY-MM-DD"), time from startText ("Month DD @ HH:MM")
    let date = "";
    let hour = "";

    const dateMatch = raw.datetime.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;

    // Time is in startText like "April 25 @ 11:00" or "May 9 @ 20:30"
    if (raw.startText) {
      const tm = raw.startText.match(/(\d{1,2}):(\d{2})/);
      if (tm) hour = `${String(parseInt(tm[1], 10)).padStart(2, "0")}:${tm[2]}`;
    }

    if (!date) continue;

    const venueName = raw.venueName || "סטודיו דוואי";
    const venueCity = resolveVenueCity(venueName, raw.venueAddress);

    const event = {
      date,
      hour: hour || "00:00",
      venueName,
      venueCity: venueCity || "תל אביב-יפו",
      ticketUrl: raw.ticketUrl || null,
    };

    if (!eventsByTitle.has(normalizedTitle)) {
      eventsByTitle.set(normalizedTitle, []);
    }
    eventsByTitle.get(normalizedTitle).push(event);
  }

  return eventsByTitle;
}

/**
 * Look up events for a specific show from the pre-fetched events map.
 * The eventsByUrl map (built by prepareDavaiScrape) maps show URL → events.
 */
export async function scrapeShowEvents(_browser, url, { debug = false, eventsByUrl = null } = {}) {
  if (!eventsByUrl) {
    return { events: [] };
  }

  const normalized = url.replace(/\/$/, "");
  const events = eventsByUrl.get(normalized) || [];

  return { events, debugHtml: debug ? JSON.stringify([...eventsByUrl.entries()]) : null };
}

/**
 * Pre-fetch all events and build a URL→events map by cross-referencing
 * the show listing (title→URL) with the events page (title→events).
 */
export async function prepareDavaiScrape(browser) {
  const [listings, eventsByTitle] = await Promise.all([
    fetchListing(browser),
    fetchAllEvents(browser),
  ]);

  // Build lowercase title → URL map from listings
  const titleToUrl = new Map();
  for (const { title, url } of listings) {
    const normalized = normalizeDavaiTitle(title).toLowerCase();
    if (normalized) {
      titleToUrl.set(normalized, url.replace(/\/$/, ""));
    }
  }

  // Cross-reference: map events by URL
  const eventsByUrl = new Map();

  for (const [eventTitle, events] of eventsByTitle) {
    const eventLower = eventTitle.toLowerCase();
    let matchedUrl = null;

    // Exact match (case-insensitive)
    if (titleToUrl.has(eventLower)) {
      matchedUrl = titleToUrl.get(eventLower);
    } else {
      // Fuzzy: check if event title is contained in a listing title or vice versa
      for (const [listTitle, url] of titleToUrl) {
        if (
          listTitle.includes(eventLower) ||
          eventLower.includes(listTitle)
        ) {
          matchedUrl = url;
          break;
        }
      }
    }

    if (matchedUrl) {
      const existing = eventsByUrl.get(matchedUrl) || [];
      eventsByUrl.set(matchedUrl, [...existing, ...events]);
    }
  }

  console.log(`  Events page: ${eventsByTitle.size} show titles, mapped ${eventsByUrl.size} to listing URLs.`);
  return { eventsByUrl };
}
