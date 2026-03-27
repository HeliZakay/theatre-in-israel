/**
 * Beit Lessin Theatre scraping helpers — show listing and show detail extraction.
 *
 * Centralises all Beit Lessin-specific scraping logic so it can be
 * imported by any script that needs it.
 */

import { fixDoubleProtocol, extractImageFromPage } from "./image.mjs";
import { setupRequestInterception } from "./browser.mjs";
import { parseLessinDuration } from "./duration.mjs";
import { normalizeYear, formatDate } from "./date.mjs";

// Re-export so existing consumers can still import from here
export { parseLessinDuration };

// ── Constants ──────────────────────────────────────────────────

export const LESSIN_THEATRE = "תיאטרון בית ליסין";
export const LESSIN_BASE = "https://www.lessin.co.il";
export const SHOWS_URL = "https://www.lessin.co.il/";

// ── Shows listing page scraper ─────────────────────────────────

/**
 * Fetch the list of current shows from the Beit Lessin main page.
 *
 * @param {import('puppeteer').Browser} browser
 * @returns {Promise<Array<{title: string, url: string}>>}
 */
export async function fetchShows(browser) {
  const page = await browser.newPage();
  await setupRequestInterception(page);

  await page.goto(SHOWS_URL, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForSelector('a[href*="/shows/"]', { timeout: 30_000 });

  const shows = await page.evaluate((base) => {
    const suffixRe = /\s*\((?:הצגות אחרונות|הצגה אורחת)\)\s*$/;
    const map = new Map();

    const headings = document.querySelectorAll("h3");
    for (const h3 of headings) {
      let title = h3.textContent.trim();
      if (!title) continue;
      title = title.replace(/\s+/g, " ").trim();
      if (
        title === "לרכישה" ||
        title === "לתאריכים ורכישה" ||
        title === "רוצים לראות עוד?" ||
        title === "הזמנה מהירה" ||
        title === "GIFT CARD" ||
        title === "לוח הצגות" ||
        title === "אזור אישי" ||
        title === "דלג לתוכן" ||
        title.length < 2
      )
        continue;
      title = title.replace(suffixRe, "").trim();

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
      // Skip if this title is already mapped, or if this URL is already claimed by another title
      const existingUrls = new Set([...map.values()]);
      if (!map.has(title) && !existingUrls.has(url)) {
        map.set(title, url);
      }
    }

    // Fallback: collect any show links not yet captured
    const allLinks = document.querySelectorAll('a[href*="/shows/"]');
    for (const a of allLinks) {
      const href = a.getAttribute("href") || "";
      if (!href.includes("/shows/")) continue;
      const url = href.startsWith("http") ? href : `${base}${href}`;
      const existingUrls = new Set([...map.values()]);
      if (existingUrls.has(url)) continue;

      let container = a.parentElement;
      let h3 = null;
      for (let i = 0; i < 5 && container; i++) {
        h3 = container.querySelector("h3");
        if (h3) break;
        container = container.parentElement;
      }
      if (h3) {
        let title = h3.textContent.trim().replace(/\s+/g, " ");
        title = title.replace(suffixRe, "").trim();
        if (title && title.length >= 2 && !map.has(title)) {
          map.set(title, url);
        }
      }
    }

    return [...map.entries()].map(([title, url]) => ({ title, url }));
  }, LESSIN_BASE);

  await page.close();
  return shows.sort((a, b) => a.title.localeCompare(b.title, "he"));
}

// ── Cast extraction helpers ────────────────────────────────────

/**
 * Crew-role keywords — lines whose left side (role label) contains
 * any of these are crew, not cast.  Shared with Habima; extended
 * with Lessin-specific entries (`מאת`).
 */
const crewKeywords = [
  "מאת",
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
  "תפאורה",
  "קונספט",
  "עוזר",
  "עוזרת",
  "הפקת",
];

// ── Detail page scraper ────────────────────────────────────────

/**
 * Scrape a single Beit Lessin show page for title, duration,
 * description, image, and cast.
 *
 * @param {import('puppeteer').Browser} browser
 * @param {string} url  Full URL of the show page
 * @returns {Promise<{title: string, durationMinutes: number|null, description: string, imageUrl: string|null, cast: string|null}>}
 */
export async function scrapeShowDetails(browser, url) {
  const page = await browser.newPage();
  await setupRequestInterception(page, { allowImages: true });

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector("h1", { timeout: 30_000 });

  const data = await page.evaluate((_crewKeywords) => {
    const suffixRe = /\s*\((?:הצגות אחרונות|הצגה אורחת)\)\s*$/;

    const h1 = document.querySelector("h1");
    let title = h1 ? h1.textContent.trim() : "";
    title = title.replace(suffixRe, "").trim();
    title = title
      .replace(/\n+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();

    const body = document.body.innerText;

    // Extract raw duration text for parsing in Node context
    let durationText = null;
    const durationLineMatch = body.match(/משך ההצגה:\s*([^\n]+)/);
    if (durationLineMatch) {
      durationText = durationLineMatch[1].trim();
    }

    // Extract description using "על ההצגה" as start marker
    let description = "";
    const descStopMarkers = [
      "יוצרים ושחקנים",
      "משך ההצגה",
      "הביקורות משבחות",
      "מועמדויות",
    ];
    const startIdx = body.indexOf("על ההצגה");
    if (startIdx !== -1) {
      let rest = body.slice(startIdx + "על ההצגה".length).trim();
      let endIdx = rest.length;
      for (const marker of descStopMarkers) {
        const idx = rest.indexOf(marker);
        if (idx !== -1 && idx < endIdx) endIdx = idx;
      }
      description = rest.slice(0, endIdx).trim();

      // Clean up photo credits and promotional lines
      description = description.replace(/\*צילום:.*$/gm, "");
      description = description.replace(/צילום פוסטר:.*$/gm, "");
      description = description.replace(/^\*[^\n]*$/gm, "");
      description = description.replace(/לא תותר הכניסה למאחרים[^\n]*/g, "");
      description = description.replace(/מוצג בהסדר עם[^\n]*/g, "");
      description = description.replace(/50 הצגות בלבד[^\n]*/g, "");
      description = description.replace(/\n{3,}/g, "\n\n").trim();
    }

    // ── Cast extraction ──
    // The "יוצרים ושחקנים" section lists role: name pairs.
    // We filter out crew roles and keep only actors.
    let cast = "";
    const castSectionMarkers = ["יוצרים ושחקנים", "יוצרים ומשתתפים"];
    const castStopMarkers = [
      "משך ההצגה",
      "להזמנת מנוי",
      "להורדת התכנייה",
      "קופה וכרטיסים",
      "רוצים לראות עוד",
      "מנויים מקבלים",
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
        const isCrew = _crewKeywords.some((kw) => left.includes(kw));
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

    return { title, durationText, description, cast };
  }, crewKeywords);

  // Parse duration in Node context
  data.durationMinutes = parseLessinDuration(data.durationText);
  delete data.durationText;
  data.cast = data.cast || null;

  const imageUrl = await page.evaluate(extractImageFromPage);
  if (imageUrl) {
    data.imageUrl = fixDoubleProtocol(imageUrl);
  } else {
    data.imageUrl = null;
  }

  await page.close();
  return data;
}

// ── Events / dates scraper ─────────────────────────────────────

/**
 * Scrape performance dates/times from a Beit Lessin show detail page.
 *
 * The dates table appears below the description/cast/reviews sections,
 * with rows linking to `lessin.pres.global/eWeb/event/{id}`.
 * We scroll to trigger lazy content, then extract using multiple strategies.
 *
 * @param {import("puppeteer").Browser} browser
 * @param {string} url — show detail page URL
 * @param {{ debug?: boolean }} [options]
 * @returns {Promise<{ events: Array<{ date: string, hour: string, note: string|null, rawText: string }>, venue: string|null, debugHtml?: string, debugDateElements?: Array }>}
 */
export async function scrapeShowEvents(browser, url, { debug = false } = {}) {
  const page = await browser.newPage();
  await setupRequestInterception(page);

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector("h1", { timeout: 15_000 });

  // Scroll to bottom to trigger lazy-loaded dates section.
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

  // Extra wait for the dates widget to render after scroll.
  await new Promise((r) => setTimeout(r, 3_000));

  // Scroll once more (some widgets only load after the first pass).
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise((r) => setTimeout(r, 2_000));

  const result = await page.evaluate((debugMode) => {
    const output = { events: [], venue: null, debugHtml: null };
    const events = [];

    // ── Strategy 1 (precise): pres.global ticket links ──
    // Each row in the events table has an <a> linking to pres.global/eWeb/event/{id}.
    // We group by href, find the parent <tr>, and extract date/time/hall from the row text.
    const presLinks = document.querySelectorAll(
      'a[href*="pres.global/eWeb/event"]',
    );
    if (presLinks.length > 0) {
      // Walk up from an element looking for a container whose text
      // includes both a date (DD.MM) and a time (HH:MM) pattern.
      function findRowWithDateTime(el) {
        let cur = el.parentElement;
        while (cur && cur !== document.body) {
          const t = cur.textContent || "";
          if (/\d{1,2}\.\d{1,2}/.test(t) && /\d{1,2}:\d{2}/.test(t)) return cur;
          cur = cur.parentElement;
        }
        return null;
      }

      const seenHrefs = new Map(); // href → row element
      for (const a of presLinks) {
        const href = a.getAttribute("href") || "";
        if (seenHrefs.has(href)) continue;
        const row =
          a.closest("tr") ||
          a.closest(".mulrow") ||
          findRowWithDateTime(a) ||
          a.closest("div");
        if (!row) continue;
        seenHrefs.set(href, row);
      }

      for (const [href, row] of seenHrefs) {
        const text = row.textContent?.trim() || "";

        // Extract date: DD.MM pattern
        const dateMatch = text.match(/(\d{1,2})\.(\d{1,2})/);
        // Extract time: HH:MM pattern
        const timeMatch = text.match(/(\d{1,2}:\d{2})/);

        if (!dateMatch) continue;

        const rawDay = parseInt(dateMatch[1], 10);
        const rawMonth = parseInt(dateMatch[2], 10);

        // Hall: look for "אולם X" in cell text
        let hall = null;
        const cells = row.querySelectorAll("td, th, div");
        for (const cell of cells) {
          const cellText = cell.textContent?.trim() || "";
          const hallMatch = cellText.match(/אולם\s*\S+/);
          if (hallMatch) {
            hall = hallMatch[0];
            break;
          }
        }
        // Also try row text if not found in cells
        if (!hall) {
          const hallMatch = text.match(/אולם\s*\S+/);
          if (hallMatch) hall = hallMatch[0];
        }

        // Subtitle note: look for "כתוביות" in row text
        let subtitleNote = null;
        const subtitleMatch = text.match(/כתוביות\s*[^\n,)]+/);
        if (subtitleMatch) {
          subtitleNote = subtitleMatch[0].trim();
        }

        // Compose note field
        const noteParts = [];
        if (hall) noteParts.push(hall);
        if (subtitleNote) noteParts.push(subtitleNote);
        const note = noteParts.length > 0 ? noteParts.join(" | ") : null;

        events.push({
          rawDay,
          rawMonth,
          rawYear: "",
          hour: timeMatch ? timeMatch[1] : "",
          note,
          href: href || null,
          rawText: text.slice(0, 250),
        });
      }
    }

    // ── Strategy 2 (container fallback) ──
    // Search for a table/container by heading text or <th> containing "תאריך"
    if (events.length === 0) {
      let datesContainer = null;

      // Try finding by heading text
      const allHeadings = document.querySelectorAll(
        "h2, h3, h4, h5, .section-title, [class*='title']",
      );
      for (const h of allHeadings) {
        const text = h.textContent.trim();
        if (
          text.includes("תאריכים") ||
          text.includes("לוח הופעות") ||
          text.includes("רכישת כרטיסים") ||
          text.includes("הופעות קרובות")
        ) {
          datesContainer =
            h.closest("section") ||
            h.closest("article") ||
            h.closest("div[class]") ||
            h.parentElement;
          break;
        }
      }

      // Try finding by <th> containing "תאריך"
      if (!datesContainer) {
        const ths = document.querySelectorAll("th");
        for (const th of ths) {
          if (th.textContent.includes("תאריך")) {
            datesContainer =
              th.closest("table") || th.closest("section") || th.parentElement;
            break;
          }
        }
      }

      if (datesContainer) {
        const candidates = datesContainer.querySelectorAll(
          "li, tr, .date-card, .performance, [class*='show-date'], a[href*='ticket'], a[href*='כרטיס']",
        );
        for (const el of candidates) {
          const text = el.textContent?.trim() || "";
          const dateMatch = text.match(
            /(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?/,
          );
          const timeMatch = text.match(/(\d{1,2}:\d{2})/);
          if (!dateMatch) continue;

          const rawDay = parseInt(dateMatch[1], 10);
          const rawMonth = parseInt(dateMatch[2], 10);
          const rawYear = dateMatch[3] || "";

          // Hall
          let hall = null;
          const hallMatch = text.match(/אולם\s*\S+/);
          if (hallMatch) hall = hallMatch[0];

          // Subtitle
          let subtitleNote = null;
          if (text.includes("כתוביות")) {
            const sm = text.match(/כתוביות\s*[^\n,)]+/);
            if (sm) subtitleNote = sm[0].trim();
          }

          const noteParts = [];
          if (hall) noteParts.push(hall);
          if (subtitleNote) noteParts.push(subtitleNote);
          const note = noteParts.length > 0 ? noteParts.join(" | ") : null;

          events.push({
            rawDay,
            rawMonth,
            rawYear,
            hour: timeMatch ? timeMatch[1] : "",
            note,
            rawText: text.slice(0, 250),
          });
        }
      }
    }

    // ── Strategy 3 (body text regex — last resort) ──
    if (events.length === 0) {
      const bodyText = document.body.innerText;
      const dateRegex =
        /(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?\s*[\s|,\-–—]*\s*(\d{1,2}:\d{2})?/g;
      let match;
      while ((match = dateRegex.exec(bodyText)) !== null) {
        const rawDay = parseInt(match[1], 10);
        const rawMonth = parseInt(match[2], 10);
        const rawYear = match[3] || "";

        const surrounding = bodyText.slice(
          Math.max(0, match.index - 50),
          match.index + match[0].length + 50,
        );

        let subtitleNote = null;
        if (
          surrounding.includes("כתוביות") ||
          surrounding.includes("subtitles")
        ) {
          const sm = surrounding.match(/כתוביות\s*[^\n,)]+/);
          subtitleNote = sm ? sm[0].trim() : "כתוביות";
        }

        events.push({
          rawDay,
          rawMonth,
          rawYear,
          hour: match[4] || "",
          note: subtitleNote,
          rawText: surrounding.trim(),
        });
      }
    }

    // ── Deduplicate: prefer href as key (Strategy 1), fall back to day.month|hour ──
    const bestByKey = new Map();
    for (const e of events) {
      const key = e.href || `${e.rawDay}.${e.rawMonth}.${e.rawYear}|${e.hour}`;
      const existing = bestByKey.get(key);
      if (!existing || (!existing.hour && e.hour)) {
        bestByKey.set(key, e);
      }
    }
    output.events = [...bestByKey.values()];

    // ── Extract venue from page text ──
    const bodyText = document.body.innerText;
    let venue = null;
    const venueMatch = bodyText.match(/מוצגת ב([^\n,."]+)/);
    if (venueMatch) {
      venue = venueMatch[1].trim();
    }
    output.venue = venue;

    // ── Debug output ──
    if (debugMode) {
      // Try to find the dates container for debug HTML
      let datesContainer = null;
      const presLinks = document.querySelectorAll(
        'a[href*="pres.global/eWeb/event"]',
      );
      if (presLinks.length > 0) {
        const firstRow =
          presLinks[0].closest("table") ||
          presLinks[0].closest("section") ||
          presLinks[0].closest("div[class]");
        if (firstRow) datesContainer = firstRow;
      }
      if (!datesContainer) {
        const allHeadings = document.querySelectorAll("h2, h3, h4, h5");
        for (const h of allHeadings) {
          const text = h.textContent.trim();
          if (text.includes("תאריכים") || text.includes("לוח הופעות")) {
            datesContainer =
              h.closest("section") ||
              h.closest("div[class]") ||
              h.parentElement;
            break;
          }
        }
      }

      if (datesContainer) {
        output.debugHtml = datesContainer.innerHTML;
      } else {
        const bodyHtml = document.body.innerHTML;
        output.debugHtml = bodyHtml.slice(-8000);
      }

      // Dump all elements with date-like text patterns
      const allElements = document.querySelectorAll("*");
      const datePatterns = [];
      for (const el of allElements) {
        if (el.children.length > 10) continue;
        const text = el.textContent?.trim() || "";
        if (
          /\d{1,2}[./]\d{1,2}/.test(text) &&
          text.length < 200 &&
          !el.closest("script") &&
          !el.closest("style")
        ) {
          datePatterns.push({
            tag: el.tagName.toLowerCase(),
            classes: el.className || "",
            id: el.id || "",
            text: text.slice(0, 150),
          });
        }
      }
      output.debugDateElements = datePatterns;
    }

    return output;
  }, debug);

  await page.close();

  // ── Convert raw date components to YYYY-MM-DD (Node context) ──
  for (const e of result.events) {
    const year = parseInt(normalizeYear(String(e.rawYear ?? ""), e.rawDay, e.rawMonth), 10);
    e.date = formatDate(e.rawDay, e.rawMonth, year);
    delete e.rawDay;
    delete e.rawMonth;
    delete e.rawYear;
  }

  return result;
}
