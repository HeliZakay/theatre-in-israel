# Hebrew Theatre Events Scraper — Implementation Plan

## 1. Overview

This plan adds event (performance date/time) scraping for **התיאטרון העברי** (Hebrew Theatre, `teatron.org.il`) to the existing scraping infrastructure. Working scrapers already exist for Cameri and Beit Lessin — both single-venue theatres. Hebrew Theatre is a **touring company**: each performance row names a different venue across Israel. The scraper must therefore handle **per-event venue resolution** (name → city lookup) rather than a single canonical venue.

### Deliverables

| #   | File                                           | Action                                                                           |
| --- | ---------------------------------------------- | -------------------------------------------------------------------------------- |
| 1   | `scripts/lib/hebrew-theatre.mjs`               | Add `VENUE_CITY_MAP`, `KNOWN_CITIES`, `resolveVenueCity()`, `scrapeShowEvents()` |
| 2   | `scripts/scrape-hebrew-theatre-events.mjs`     | New — single-show CLI                                                            |
| 3   | `scripts/scrape-all-hebrew-theatre-events.mjs` | New — all-shows CLI                                                              |
| 4   | `prisma/sync-events.js`                        | Add `syncTouringFile()`, update `main()`                                         |
| 5   | `.github/workflows/refresh-events.yml`         | Add scrape step + update git add                                                 |

---

## 2. Implementation Order

1. **Add venue resolution to `scripts/lib/hebrew-theatre.mjs`** — `VENUE_CITY_MAP`, `KNOWN_CITIES`, `resolveVenueCity()`.
2. **Add `scrapeShowEvents()` to `scripts/lib/hebrew-theatre.mjs`** — the core event-scraping function.
3. **Create `scripts/scrape-hebrew-theatre-events.mjs`** — single-show CLI for manual testing.
4. **Test single-show scraping** against 2–3 live URLs to validate selectors and regexes.
5. **Create `scripts/scrape-all-hebrew-theatre-events.mjs`** — all-shows CLI with `--json` output.
6. **Test all-shows scraping** in `--json` mode; inspect output JSON.
7. **Add `syncTouringFile()` to `prisma/sync-events.js`** and wire it into `main()`.
8. **Test end-to-end** — scrape → JSON → sync to local DB.
9. **Update `.github/workflows/refresh-events.yml`** — add CI step.
10. **Final verification** — run `npx next build` to confirm no regressions.

---

## 3. File: `scripts/lib/hebrew-theatre.mjs` — Modifications

### 3.1 New constants

Add below the existing constants block (after `export const SHOWS_URL = ...`):

```js
// ── Venue → City resolution ────────────────────────────────────

/**
 * Maps known venue strings (as they appear on the Hebrew Theatre website)
 * to their city. Keys should be trimmed, normalised strings.
 */
export const VENUE_CITY_MAP = {
  // Tel Aviv area
  "היכל התרבות תל אביב": "תל אביב",
  "היכל התרבות": "תל אביב",
  "תיאטרון הבימה": "תל אביב",
  "בית ליסין": "תל אביב",
  "תיאטרון הקאמרי": "תל אביב",
  צוותא: "תל אביב",
  תמונע: "תל אביב",
  "התיאטרון העברי": "תל אביב",
  // Haifa
  "תיאטרון הצפון": "חיפה",
  "תיאטרון חיפה": "חיפה",
  "אודיטוריום חיפה": "חיפה",
  // Jerusalem
  "תיאטרון ירושלים": "ירושלים",
  "תיאטרון החאן": "ירושלים",
  "גררד בכר": "ירושלים",
  "היכל התרבות ירושלים": "ירושלים",
  // Beer Sheva
  "תיאטרון באר שבע": "באר שבע",
  "היכל התרבות באר שבע": "באר שבע",
  "המרכז לאמנויות הבמה באר שבע": "באר שבע",
  // Other cities
  "היכל התרבות הרצליה": "הרצליה",
  "היכל התרבות רעננה": "רעננה",
  "היכל התרבות כפר סבא": "כפר סבא",
  "היכל התרבות אשדוד": "אשדוד",
  "היכל התרבות ראשון לציון": "ראשון לציון",
  "היכל התרבות נתניה": "נתניה",
  "היכל התרבות פתח תקווה": "פתח תקווה",
  "היכל התרבות רמת גן": "רמת גן",
  "מרכז תרבות גבעתיים": "גבעתיים",
  "היכל התרבות מודיעין": "מודיעין",
  "היכל התרבות קריית מוצקין": "קריית מוצקין",
  "היכל התרבות לוד": "לוד",
  "תיאטרון גשר": "יפו",
};

/**
 * Known Israeli cities for trailing-city heuristic, sorted longest-first
 * so "ראשון לציון" matches before "ציון" (if that were a city).
 */
export const KNOWN_CITIES = [
  "ראשון לציון",
  "פתח תקווה",
  "קריית מוצקין",
  "קריית ביאליק",
  "קריית שמונה",
  "כפר סבא",
  "רמת גן",
  "באר שבע",
  "רמת השרון",
  "גבעתיים",
  "תל אביב",
  "ירושלים",
  "הרצליה",
  "רעננה",
  "אשדוד",
  "חולון",
  "נתניה",
  "חיפה",
  "אשקלון",
  "מודיעין",
  "עפולה",
  "לוד",
  "יפו",
  "עכו",
  "אילת",
].sort((a, b) => b.length - a.length);
```

### 3.2 New export: `resolveVenueCity(rawVenueName)`

```js
/**
 * Resolve the city for a raw venue name scraped from the Hebrew Theatre website.
 *
 * Resolution tiers (in order):
 *   1. Exact match in VENUE_CITY_MAP
 *   2. Partial/contains match — venue key is a substring of rawVenueName or vice versa
 *   3. Trailing city heuristic — rawVenueName ends with a known city name
 *   4. Fallback — "לא ידוע" with a console warning
 *
 * @param {string} rawVenueName — venue string exactly as scraped from the page
 * @returns {string} — city name
 */
export function resolveVenueCity(rawVenueName) {
  const trimmed = rawVenueName.replace(/\s+/g, " ").trim();

  // Tier 1: exact match
  if (VENUE_CITY_MAP[trimmed]) {
    return VENUE_CITY_MAP[trimmed];
  }

  // Tier 2: partial/contains match (either direction)
  for (const [key, city] of Object.entries(VENUE_CITY_MAP)) {
    if (trimmed.includes(key) || key.includes(trimmed)) {
      return city;
    }
  }

  // Tier 3: trailing city heuristic
  for (const city of KNOWN_CITIES) {
    if (trimmed.endsWith(city)) {
      return city;
    }
  }

  // Tier 4: fallback
  console.warn(
    `  ⚠  Unknown venue city for: "${trimmed}" — defaulting to "לא ידוע"`,
  );
  return "לא ידוע";
}
```

### 3.3 New export: `scrapeShowEvents(browser, url, { debug })`

```js
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

  await page.goto(url, { waitUntil: "networkidle2", timeout: 60_000 });
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
    // Find all <a> whose href matches TICKET_RE.
    // Walk up to the row container, extract date/time/venue from row text.
    const ticketLinks = [...document.querySelectorAll("a")].filter((a) =>
      TICKET_RE.test(a.getAttribute("href") || ""),
    );

    if (ticketLinks.length > 0) {
      const seenHrefs = new Map();

      for (const a of ticketLinks) {
        const href = a.getAttribute("href") || "";
        if (seenHrefs.has(href)) continue;

        // Walk up to find the row: <tr>, or a container with date+time text
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

        // Extract venue: text between the time and "רכישה" (the buy button label)
        let venueName = "";
        if (timeMatch) {
          const afterTime = text.slice(
            text.indexOf(timeMatch[0]) + timeMatch[0].length,
          );
          // Remove "רכישה" and trim
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
    // Find the "תאריכי הצגות" heading, then parse rows in its container.
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
      // Match: DD/MM/YY  day-abbrev  HH:MM  venue-text
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

  // Resolve venue cities in Node context (has access to VENUE_CITY_MAP)
  for (const ev of result.events) {
    ev.venueCity = resolveVenueCity(ev.venueName);
  }

  return result;
}
```

### 3.4 Updated import block

The top of the file stays the same — no new imports are needed:

```js
import { fixDoubleProtocol, extractImageFromPage } from "./image.mjs";
import { setupRequestInterception } from "./browser.mjs";
```

`resolveVenueCity` is defined in the same file and `setupRequestInterception` is already imported.

---

## 4. File: `scripts/scrape-hebrew-theatre-events.mjs` — New File

### 4.1 Purpose

Single-show CLI for ad-hoc testing. Takes a Hebrew Theatre show URL, scrapes events, optionally writes to DB.

### 4.2 Usage

```
node scripts/scrape-hebrew-theatre-events.mjs <show-url>             # dry-run
node scripts/scrape-hebrew-theatre-events.mjs <show-url> --debug     # dump DOM
node scripts/scrape-hebrew-theatre-events.mjs <show-url> --apply     # write to DB
```

### 4.3 Import list

```js
#!/usr/bin/env node
import { launchBrowser } from "./lib/browser.mjs";
import {
  scrapeShowEvents,
  HEBREW_THEATRE_BASE,
  resolveVenueCity,
} from "./lib/hebrew-theatre.mjs";
import {
  bold,
  cyan,
  yellow,
  green,
  red,
  dim,
  bidi,
  separator,
} from "./lib/cli.mjs";
```

### 4.4 CLI arg parsing

Identical pattern to `scrape-lessin-events.mjs`:

```js
const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const positional = args.filter((a) => !a.startsWith("--"));

const debug = flags.has("--debug");
const apply = flags.has("--apply");
const url = positional[0];

if (!url) {
  console.error(
    red(
      "Usage: node scripts/scrape-hebrew-theatre-events.mjs <show-url> [--debug] [--apply]",
    ),
  );
  process.exit(1);
}
```

### 4.5 Slug extraction from URL

```js
const urlPath = decodeURIComponent(new URL(url).pathname);
const segments = urlPath.split("/").filter(Boolean);
let slug = segments[segments.length - 1];
// Normalise dashes: replace en-dash (–) and em-dash (—) with hyphen (-)
slug = slug.replace(/[–—]/g, "-");
```

URL pattern: `https://www.teatron.org.il/shows/{encoded-slug}/`

### 4.6 `--apply` mode: per-event venue upsert

**Key difference from Lessin**: instead of upserting a single canonical venue, `--apply` must upsert a venue **per event** using `resolveVenueCity()`:

```js
if (apply && result.events.length > 0) {
  separator();
  console.log(bold(cyan("  Writing to database…")));

  const { createPrismaClient } = await import("./lib/db.mjs");
  const db = await createPrismaClient();
  if (!db) {
    console.error(red("  DATABASE_URL not set — cannot apply."));
    process.exit(1);
  }

  try {
    // Resolve show from URL slug
    const urlPath = decodeURIComponent(new URL(url).pathname);
    const segments = urlPath.split("/").filter(Boolean);
    let slug = segments[segments.length - 1];
    slug = slug.replace(/[–—]/g, "-");

    const show = await db.prisma.show.findFirst({ where: { slug } });
    if (!show) {
      console.error(red(`  Show not found for slug: ${slug}`));
      process.exit(1);
    }
    console.log(dim(`  Show: ${show.title} (id=${show.id})`));

    const venueCache = new Map(); // "name|city" → venue row
    let created = 0;
    let skipped = 0;

    for (const ev of result.events) {
      try {
        const venueName = ev.venueName || "התיאטרון העברי";
        const venueCity = ev.venueCity || resolveVenueCity(venueName);
        const cacheKey = `${venueName}|${venueCity}`;

        let venue = venueCache.get(cacheKey);
        if (!venue) {
          venue = await db.prisma.venue.upsert({
            where: { name_city: { name: venueName, city: venueCity } },
            create: { name: venueName, city: venueCity },
            update: {},
          });
          venueCache.set(cacheKey, venue);
        }

        await db.prisma.event.upsert({
          where: {
            showId_venueId_date_hour: {
              showId: show.id,
              venueId: venue.id,
              date: new Date(ev.date),
              hour: ev.hour || "00:00",
            },
          },
          create: {
            showId: show.id,
            venueId: venue.id,
            date: new Date(ev.date),
            hour: ev.hour || "00:00",
          },
          update: {},
        });
        created++;
      } catch (e) {
        console.log(dim(`  Skipped ${ev.date} ${ev.hour}: ${e.message}`));
        skipped++;
      }
    }
    console.log(green(`\n  Created: ${created}, Skipped: ${skipped}`));
  } finally {
    await db.prisma.$disconnect();
    await db.pool.end();
  }
}
```

### 4.7 Event display (dry-run)

Table columns differ from Lessin — include venue name and city:

```
  Date         Time    Venue                     City
  ──────────────────────────────────────────────────────────────
  2026-04-05   20:30   תיאטרון הצפון             חיפה
  2026-04-12   20:00   היכל התרבות תל אביב       תל אביב
```

Print logic:

```js
if (result.events.length === 0) {
  console.log(red("\n  No dates/events found on this page."));
  console.log(dim("  Try --debug to inspect the DOM structure.\n"));
} else {
  console.log(`\n  ${green(`Found ${result.events.length} event(s):`)}\n`);
  console.log(`  ${bold("Date")}         ${bold("Time")}    ${bold("Venue")}`);
  console.log(dim("  " + "-".repeat(60)));
  for (const ev of result.events) {
    const venue = ev.venueName ? bidi(ev.venueName) : dim("(unknown)");
    const city = ev.venueCity ? dim(`(${bidi(ev.venueCity)})`) : "";
    console.log(`  ${ev.date}    ${ev.hour || "??:??"}    ${venue}  ${city}`);
    if (debug && ev.rawText) {
      console.log(dim(`    raw: ${bidi(ev.rawText)}`));
    }
  }
}
```

---

## 5. File: `scripts/scrape-all-hebrew-theatre-events.mjs` — New File

### 5.1 Purpose

Batch CLI that scrapes events for all Hebrew Theatre shows. Matches DB records to website listings via `normaliseForMatch()`. Supports `--json`, `--apply`, `--debug` modes.

### 5.2 Usage

```
node scripts/scrape-all-hebrew-theatre-events.mjs                                          # dry-run
node scripts/scrape-all-hebrew-theatre-events.mjs --apply                                   # write to DB
node scripts/scrape-all-hebrew-theatre-events.mjs --json prisma/data/events-hebrew-theatre.json  # JSON file
node scripts/scrape-all-hebrew-theatre-events.mjs --debug                                   # dump DOM
```

### 5.3 Import list

```js
#!/usr/bin/env node
import fs from "fs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { launchBrowser } from "./lib/browser.mjs";
import {
  fetchShows,
  scrapeShowEvents,
  HEBREW_THEATRE,
  resolveVenueCity,
} from "./lib/hebrew-theatre.mjs";
import { createPrismaClient, normaliseForMatch } from "./lib/db.mjs";
import {
  bold,
  cyan,
  yellow,
  green,
  red,
  dim,
  bidi,
  separator,
  thinSeparator,
} from "./lib/cli.mjs";
```

### 5.4 Differences from Lessin version

| Aspect                 | Lessin (`scrape-all-lessin-events.mjs`)                      | Hebrew Theatre                                                                            |
| ---------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Venue handling         | Single canonical venue upserted once before the loop         | Per-event venue — `venueName` + `venueCity` stored in JSON and upserted per-event in loop |
| JSON `venue` field     | Top-level `{ name: "תיאטרון בית ליסין", city: "תל אביב" }`   | None — replaced by `touring: true` flag                                                   |
| JSON event shape       | `{ showId, date, hour, note }`                               | `{ showId, date, hour, venueName, venueCity }`                                            |
| `--apply` venue upsert | One `prisma.venue.upsert` before the loop, `venue.id` reused | `prisma.venue.upsert` inside the loop with a `Map` cache keyed by `"name\|city"`          |
| Listing source         | `fetchShows()` from `./lib/lessin.mjs`                       | `fetchShows()` from `./lib/hebrew-theatre.mjs`                                            |
| Theatre constant       | `LESSIN_THEATRE` (`"תיאטרון בית ליסין"`)                     | `HEBREW_THEATRE` (`"התיאטרון העברי"`)                                                     |
| Dry-run display        | Date / Time / Note columns                                   | Date / Time / Venue / City columns                                                        |

### 5.5 JSON collection logic

```js
// Inside the per-show loop, when --json is active:
if (jsonPath) {
  for (const ev of result.events) {
    collectedEvents.push({
      showId: show.id,
      date: ev.date,
      hour: ev.hour || "00:00",
      venueName: ev.venueName || "התיאטרון העברי",
      venueCity:
        ev.venueCity || resolveVenueCity(ev.venueName || "התיאטרון העברי"),
    });
  }
}
```

### 5.6 JSON output format

```json
{
  "scrapedAt": "2026-03-12T10:30:00.000Z",
  "touring": true,
  "events": [
    {
      "showId": 42,
      "date": "2026-04-05",
      "hour": "20:30",
      "venueName": "תיאטרון הצפון",
      "venueCity": "חיפה"
    },
    {
      "showId": 42,
      "date": "2026-04-12",
      "hour": "20:00",
      "venueName": "היכל התרבות תל אביב",
      "venueCity": "תל אביב"
    },
    {
      "showId": 55,
      "date": "2026-05-01",
      "hour": "21:00",
      "venueName": "תיאטרון ירושלים",
      "venueCity": "ירושלים"
    }
  ]
}
```

Written at end of `main()`:

```js
if (jsonPath) {
  const output = {
    scrapedAt: new Date().toISOString(),
    touring: true,
    events: collectedEvents,
  };
  const outPath = path.resolve(rootDir, jsonPath);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");
  console.log(
    green(`\n  Wrote ${collectedEvents.length} events to ${outPath}`),
  );
}
```

### 5.7 `--apply` mode: per-event venue upsert with cache

```js
// Venue cache lives OUTSIDE the per-show loop, shared across all shows
const venueCache = new Map(); // "name|city" → venue row

// Inside the per-show loop:
if (apply && !jsonPath) {
  let created = 0;
  let skipped = 0;

  for (const ev of result.events) {
    const venueName = ev.venueName || "התיאטרון העברי";
    const venueCity = ev.venueCity;
    const cacheKey = `${venueName}|${venueCity}`;

    let venue = venueCache.get(cacheKey);
    if (!venue) {
      venue = await db.prisma.venue.upsert({
        where: { name_city: { name: venueName, city: venueCity } },
        create: { name: venueName, city: venueCity },
        update: {},
      });
      venueCache.set(cacheKey, venue);
    }

    try {
      await db.prisma.event.upsert({
        where: {
          showId_venueId_date_hour: {
            showId: show.id,
            venueId: venue.id,
            date: new Date(ev.date),
            hour: ev.hour || "00:00",
          },
        },
        create: {
          showId: show.id,
          venueId: venue.id,
          date: new Date(ev.date),
          hour: ev.hour || "00:00",
        },
        update: {},
      });
      created++;
    } catch (e) {
      skipped++;
      if (debug) {
        console.log(dim(`        skip ${ev.date} ${ev.hour}: ${e.message}`));
      }
    }
  }
  totals.created += created;
  totals.skipped += skipped;
  console.log(dim(`        → DB: ${created} created, ${skipped} skipped`));
}
```

---

## 6. File: `prisma/sync-events.js` — Modifications

### 6.1 New function: `syncTouringFile(prisma, filePath)`

Add immediately after the closing `}` of the existing `syncFile()` function (before the `main()` function):

```js
// ---------------------------------------------------------------------------
// 2b. Reusable sync function — touring format (per-event venues)
// ---------------------------------------------------------------------------
/**
 * Sync a touring-format JSON file.
 *
 * Unlike syncFile() (single venue), this handles per-event venue resolution.
 * JSON shape:
 *   { scrapedAt, touring: true, events: [{ showId, date, hour, venueName, venueCity }] }
 */
async function syncTouringFile(prisma, filePath) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    // Return null to signal the file couldn't be read
    return null;
  }

  if (
    !data.scrapedAt ||
    !data.touring ||
    !Array.isArray(data.events) ||
    data.events.length === 0
  ) {
    console.log(`No touring events to sync in ${path.basename(filePath)}`);
    return 0;
  }

  // ── 1. Upsert all unique venues ──
  const venueCache = new Map(); // "name|city" → venue row
  for (const ev of data.events) {
    const key = `${ev.venueName}|${ev.venueCity}`;
    if (!venueCache.has(key)) {
      const venue = await prisma.venue.upsert({
        where: { name_city: { name: ev.venueName, city: ev.venueCity } },
        create: { name: ev.venueName, city: ev.venueCity },
        update: {},
      });
      venueCache.set(key, venue);
    }
  }

  // ── 2. Build set of expected composite keys ──
  const expectedKeys = new Set(
    data.events.map((e) => {
      const venue = venueCache.get(`${e.venueName}|${e.venueCity}`);
      return `${e.showId}|${venue.id}|${new Date(e.date).toISOString()}|${e.hour}`;
    }),
  );

  // ── 3. Delete stale events ──
  // For touring shows, delete by showId without venue filter.
  // Safe because show IDs are globally unique to this theatre.
  const showIds = [...new Set(data.events.map((e) => e.showId))];
  const existingEvents = await prisma.event.findMany({
    where: { showId: { in: showIds } },
    select: { id: true, showId: true, venueId: true, date: true, hour: true },
  });

  const staleIds = existingEvents
    .filter(
      (e) =>
        !expectedKeys.has(
          `${e.showId}|${e.venueId}|${e.date.toISOString()}|${e.hour}`,
        ),
    )
    .map((e) => e.id);

  if (staleIds.length > 0) {
    await prisma.event.deleteMany({ where: { id: { in: staleIds } } });
    console.log(`  Removed ${staleIds.length} stale touring events`);
  }

  // ── 4. Upsert events ──
  let synced = 0;
  for (const ev of data.events) {
    const venue = venueCache.get(`${ev.venueName}|${ev.venueCity}`);
    try {
      await prisma.event.upsert({
        where: {
          showId_venueId_date_hour: {
            showId: ev.showId,
            venueId: venue.id,
            date: new Date(ev.date),
            hour: ev.hour,
          },
        },
        create: {
          showId: ev.showId,
          venueId: venue.id,
          date: new Date(ev.date),
          hour: ev.hour,
        },
        update: {},
      });
      synced++;
    } catch (err) {
      console.error(
        `Failed to upsert touring event (showId=${ev.showId}, venue=${ev.venueName}, date=${ev.date}, hour=${ev.hour}):`,
        err.message,
      );
    }
  }

  console.log(
    `Synced ${synced} touring events from ${path.basename(filePath)} (${venueCache.size} venues)`,
  );
  return synced;
}
```

### 6.2 Update to `main()` — add after the Lessin block

```js
// Hebrew Theatre events (optional — touring format)
const hebrewTheatrePath = path.join(
  __dirname,
  "data",
  "events-hebrew-theatre.json",
);
if (fs.existsSync(hebrewTheatrePath)) {
  const htResult = await syncTouringFile(prisma, hebrewTheatrePath);
  if (htResult === null) {
    console.error(
      "Failed to read events-hebrew-theatre.json (file exists but could not be parsed)",
    );
  }
} else {
  console.log(
    "No events-hebrew-theatre.json found — skipping Hebrew Theatre sync.",
  );
}
```

### 6.3 Stale deletion strategy (detailed)

The stale deletion for touring shows differs from the single-venue approach:

- **Single-venue** (`syncFile`): Queries existing events with `WHERE venueId = X AND showId IN (...)`. Safe because all events for that theatre share one venue.
- **Touring** (`syncTouringFile`): Queries existing events with `WHERE showId IN (...)` **without** venue filter. This is safe because:
  1. Show IDs are globally unique — each show belongs to exactly one theatre.
  2. Hebrew Theatre show IDs will never overlap with Cameri/Lessin show IDs (they are autoincrement values assigned when the show was seeded).
  3. The expected keys set includes `venueId` in the composite key (`showId|venueId|date|hour`), so events at venues that still appear in the JSON are correctly preserved.

The composite key for staleness comparison is `showId|venueId|date.toISOString()|hour`. If a show moved from venue A to venue B for a given date, the old venue-A event is correctly identified as stale and deleted, while the new venue-B event is upserted.

---

## 7. File: `.github/workflows/refresh-events.yml` — Modifications

### 7.1 New step YAML

Insert after the "Scrape Lessin events" step:

```yaml
- name: Scrape Hebrew Theatre events
  run: node scripts/scrape-all-hebrew-theatre-events.mjs --json prisma/data/events-hebrew-theatre.json
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### 7.2 Updated git add/commit step

```yaml
- name: Commit updated events
  run: |
    git config user.name "github-actions[bot]"
    git config user.email "github-actions[bot]@users.noreply.github.com"
    git add prisma/data/events.json prisma/data/events-lessin.json prisma/data/events-hebrew-theatre.json
    if git diff --staged --quiet; then
      echo "No changes to events"
    else
      git commit -m "chore: refresh Cameri + Lessin + Hebrew Theatre events [$(date -u +%Y-%m-%d)]"
      git push
    fi
```

---

## 8. Venue City Resolution — VENUE_CITY_MAP

### 8.1 Full lookup map

See section 3.1 — 30+ entries covering the major Israeli venues that Hebrew Theatre tours to. The map is defined as a plain object (not a `Map`) for simplicity and exported for potential reuse by other scripts.

### 8.2 KNOWN_CITIES list

See section 3.1 — 25 Israeli city names, sorted longest-first via `.sort((a, b) => b.length - a.length)`. This ensures that multi-word city names like "ראשון לציון" are matched before any shorter suffix could match.

### 8.3 `resolveVenueCity()` algorithm — 4 tiers

| Tier | Method                                                               | Example Input                                             | Result                       |
| ---- | -------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------------- |
| 1    | **Exact match** in `VENUE_CITY_MAP`                                  | `"תיאטרון הצפון"`                                         | `"חיפה"`                     |
| 2    | **Partial/contains** — venue key is substring of input or vice versa | `"תיאטרון הצפון - אולם 1"` contains key `"תיאטרון הצפון"` | `"חיפה"`                     |
| 3    | **Trailing city** — input ends with a known city from `KNOWN_CITIES` | `"מרכז לאמנויות באר שבע"` ends with `"באר שבע"`           | `"באר שבע"`                  |
| 4    | **Fallback** — print warning, return `"לא ידוע"`                     | `"מועדון סודי"`                                           | `"לא ידוע"` + `console.warn` |

The function is pure (no side effects except Tier 4's `console.warn`), deterministic, and O(n) in `VENUE_CITY_MAP` size. The `KNOWN_CITIES` list is pre-sorted at module level so Tier 3 is also fast and longest-match-first.

---

## 9. Edge Cases

| #   | Edge Case                                                                    | Handling                                                                                                                                                                                                                                                      |
| --- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Show has no events** (show page exists but dates section is empty/missing) | `scrapeShowEvents()` returns `{ events: [] }`. CLI prints "no events found" and skips. JSON output simply omits entries for that show.                                                                                                                        |
| 2   | **2-digit year ≥ 70** (e.g. `YY = 99`)                                       | `parseYear(99)` → `1999`. In practice Hebrew Theatre only lists future dates, so this is a safe guard against malformed data.                                                                                                                                 |
| 3   | **2-digit year < 70** (e.g. `YY = 26`)                                       | `parseYear(26)` → `2026`. Standard Y2K convention.                                                                                                                                                                                                            |
| 4   | **Missing time in a row**                                                    | `hour` falls back to `""` in scraping, stored as `"00:00"` when writing to DB/JSON. CLI shows `??:??` in dry-run.                                                                                                                                             |
| 5   | **Missing venue name in a row**                                              | `venueName` falls back to `""`. In `--apply`/`--json` mode defaults to `"התיאטרון העברי"` as the venue name.                                                                                                                                                  |
| 6   | **Unknown venue (not in `VENUE_CITY_MAP`, no trailing city)**                | `resolveVenueCity()` Tier 4 → `"לא ידוע"` + console warning. Venue is still created in DB with city `"לא ידוע"`. Monitor warnings and add entries to `VENUE_CITY_MAP` as needed.                                                                              |
| 7   | **Duplicate events** (same date+hour+venue appear twice on page)             | Deduplication via `bestByKey` Map. Key = `ticketUrl` (if available from Strategy 1) or `"date\|hour\|venueName"`.                                                                                                                                             |
| 8   | **Show in DB but not on website listing**                                    | `normaliseForMatch()` fails to match → show appears in "unmatched" list. No events scraped for it. Existing DB events are NOT deleted (stale deletion only touches showIds present in the JSON).                                                              |
| 9   | **Show on website but not in DB**                                            | Listing match fails → show is skipped. The all-shows CLI only scrapes events for shows that exist in the DB.                                                                                                                                                  |
| 10  | **Venue name contains extra whitespace or newlines**                         | `rawVenueName.replace(/\s+/g, " ").trim()` normalises before lookup. Row text is also collapsed with `.replace(/\s+/g, " ")` during scraping.                                                                                                                 |
| 11  | **Ticket link uses an unexpected domain**                                    | Strategy 1 only matches `smarticket.co.il` or `tickets.asp` via `TICKET_RE`. Unrecognised ticket links are ignored by Strategy 1 but may be caught by Strategy 2/3 if the row contains parseable date/time.                                                   |
| 12  | **Lazy-loaded dates section doesn't render**                                 | Two scroll passes + 5 seconds of wait time total. If still not loaded, Strategy 3 (full body text regex) is the final fallback. `--debug` mode dumps raw HTML for inspection.                                                                                 |
| 13  | **Page load timeout**                                                        | Puppeteer's `goto` has a 60s timeout. On failure, the outer `try/catch` in the all-shows CLI increments `totals.failed` and continues to the next show.                                                                                                       |
| 14  | **JSON file doesn't exist at sync time**                                     | `fs.existsSync()` check in `main()` → skip gracefully with console message.                                                                                                                                                                                   |
| 15  | **JSON file exists but is malformed**                                        | `syncTouringFile()` returns `null` → error message printed, process continues (no `process.exit`).                                                                                                                                                            |
| 16  | **Show moved to a different venue for a date**                               | Stale key includes `venueId`. Old `(showId, oldVenueId, date, hour)` doesn't appear in expected set → deleted. New `(showId, newVenueId, date, hour)` → upserted.                                                                                             |
| 17  | **Multiple shows at the same venue on the same date**                        | Different `showId` values → different unique keys under `@@unique([showId, venueId, date, hour])`. No conflict.                                                                                                                                               |
| 18  | **Same show, same venue, same date, different hours**                        | Different `hour` values → different unique keys. Both events stored.                                                                                                                                                                                          |
| 19  | **"רכישה" button text missing from row**                                     | Strategy 1 still captures the row via ticket link href. Venue extraction `afterTime.replace(/רכישה.*$/, "")` has no effect if absent — the entire post-time text becomes the venue name. Tier 2 partial matching in `resolveVenueCity` handles trailing junk. |
| 20  | **Day abbreviation contains geresh (׳) or apostrophe (')**                   | Strategy 3 regex uses `[א-ת][׳']` to match either character. Strategies 1 and 2 don't depend on the day abbreviation.                                                                                                                                         |
| 21  | **CI scrape fails**                                                          | Script exits non-zero → workflow step fails. The commit step uses `git diff --staged --quiet` so an empty/unchanged file doesn't produce an empty commit.                                                                                                     |
| 22  | **Date format uses `/` not `.`**                                             | All regexes use `\/` (slash) as the date separator: `DD/MM/YY`. This matches the observed Hebrew Theatre format. Lessin's `DD.MM` format is not used here.                                                                                                    |
| 23  | **Venue string contains "רכישה"**                                            | Unlikely but handled — the venue extraction regex `afterTime.replace(/רכישה.*$/, "")` would truncate at the embedded "רכישה". If this ever occurs, add the truncated form to `VENUE_CITY_MAP`.                                                                |

---

## 10. Verification Steps

### 10.1 Syntax check

```bash
node --check scripts/lib/hebrew-theatre.mjs
node --check scripts/scrape-hebrew-theatre-events.mjs
node --check scripts/scrape-all-hebrew-theatre-events.mjs
node --check prisma/sync-events.js
```

### 10.2 Single-show dry-run

```bash
# Pick a show URL from teatron.org.il
node scripts/scrape-hebrew-theatre-events.mjs "https://www.teatron.org.il/shows/%D7%97%D7%93%D7%A8-%D7%90%D7%97%D7%93/"
```

Expected: table of dates/times/venues/cities printed to stdout.

### 10.3 Single-show debug

```bash
node scripts/scrape-hebrew-theatre-events.mjs "https://www.teatron.org.il/shows/%D7%97%D7%93%D7%A8-%D7%90%D7%97%D7%93/" --debug
```

Expected: raw HTML of dates container + date-like elements dumped. Verify that `DD/MM/YY` patterns are detected.

### 10.4 Single-show apply (local DB required)

```bash
node scripts/scrape-hebrew-theatre-events.mjs "https://www.teatron.org.il/shows/%D7%97%D7%93%D7%A8-%D7%90%D7%97%D7%93/" --apply
```

Expected: events written to DB, venue rows created. Verify with:

```bash
npx prisma studio
```

### 10.5 All-shows dry-run

```bash
node scripts/scrape-all-hebrew-theatre-events.mjs
```

Expected: lists matched/unmatched shows, per-show event counts with venue info.

### 10.6 All-shows JSON output

```bash
node scripts/scrape-all-hebrew-theatre-events.mjs --json prisma/data/events-hebrew-theatre.json
```

Then verify the output:

```bash
cat prisma/data/events-hebrew-theatre.json | python3 -m json.tool | head -40
```

Confirm: `"touring": true`, events array with `venueName` + `venueCity` fields. No top-level `venue` object.

### 10.7 Sync to DB

```bash
node prisma/sync-events.js
```

Expected output includes: `"Synced N touring events from events-hebrew-theatre.json (M venues)"`.

### 10.8 Verify DB state

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.event.findMany({
  where: { show: { theatre: 'התיאטרון העברי' } },
  include: { venue: true },
  take: 5
}).then(r => { console.log(JSON.stringify(r, null, 2)); p.\$disconnect(); });
"
```

### 10.9 Stale deletion test

1. Run JSON scrape → sync.
2. Manually remove one event from the JSON file.
3. Re-run `node prisma/sync-events.js`.
4. Verify output: `"Removed 1 stale touring events"`.

### 10.10 Build check

```bash
npx next build
```

Expected: no regressions. `sync-events.js` is CJS and not imported by the Next.js app.

### 10.11 CI workflow lint

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/refresh-events.yml'))"
```

### 10.12 Venue resolution smoke test

```bash
node -e "
import { resolveVenueCity } from './scripts/lib/hebrew-theatre.mjs';
console.log(resolveVenueCity('תיאטרון הצפון'));           // → חיפה
console.log(resolveVenueCity('היכל התרבות תל אביב'));     // → תל אביב
console.log(resolveVenueCity('היכל התרבות כפר סבא'));      // → כפר סבא
console.log(resolveVenueCity('מרכז חדש באר שבע'));         // → באר שבע (trailing city)
console.log(resolveVenueCity('מקום לא מוכר'));             // → לא ידוע (with warning)
"
```
