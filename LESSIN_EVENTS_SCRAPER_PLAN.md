# Beit Lessin Events Scraper — Implementation Plan

## Overview

Replicate the full Cameri events scraping + sync pipeline for Beit Lessin. The Lessin website uses a standard `<table>` with rows linked to `lessin.pres.global/eWeb/event/{id}` — simpler to parse than Cameri.

## Files to Create / Modify

| File                                   | Action     | Description                                                  |
| -------------------------------------- | ---------- | ------------------------------------------------------------ |
| `scripts/lib/lessin.mjs`               | **Modify** | Add `scrapeShowEvents()` export                              |
| `scripts/scrape-lessin-events.mjs`     | **Create** | Single-show CLI entry point                                  |
| `scripts/scrape-all-lessin-events.mjs` | **Create** | All-shows CLI entry point                                    |
| `prisma/sync-events.js`                | **Modify** | Support syncing `events-lessin.json` alongside `events.json` |
| `.github/workflows/refresh-events.yml` | **Modify** | Add Lessin scrape step                                       |

---

## Step 1: Add `scrapeShowEvents()` to `scripts/lib/lessin.mjs`

Add a new exported function following the Cameri signature: `(browser, url, { debug }) → { events, venue, debugHtml }`.

### Implementation Details

- Open page with `setupRequestInterception(page)` (block images/fonts — no `allowImages` needed unlike `scrapeShowDetails`)
- Navigate with `networkidle2`, wait for `h1` (60s / 15s timeouts matching Cameri)
- **Scroll to bottom** — copy Cameri's incremental 400px-step scroll pattern:
  - Incremental scroll in 400px steps with 100ms intervals
  - 3-second wait for lazy content
  - Second `scrollTo(0, document.body.scrollHeight)`
  - 2-second wait
- The table appears below the fold after description/cast/reviews sections

### Extraction Strategies (in order)

**Strategy 1 (precise — pres.global links):**

- Select all `a[href*="pres.global/eWeb/event"]`
- Group by `href` → find parent `<tr>` (using `a.closest('tr')`)
- For each unique row, extract:
  - Date: `DD.MM` regex from row text
  - Time: `HH:MM` regex from row text
  - Hall: `אולם X` from `<td>` text (iterate cells, find one starting with "אולם")
  - Subtitle note: match `כתוביות ...` in row text
- Natural deduplication via the `href` Map

**Strategy 2 (container fallback):**

- Search for a table/container by heading text ("תאריכים", "לוח הופעות") or by `<th>` containing "תאריך"
- Parse `<tr>` rows within that container using date/time regex
- Also try generic selectors: `li, tr, .date-card, .performance, [class*='show-date']`

**Strategy 3 (body text regex — last resort):**

- Same as Cameri — scan `body.innerText` for `DD.MM(.YYYY)? HH:MM` patterns
- Use surrounding text context to detect subtitle notes

### Year Inference

- If parsed month < current month → assume next year
- Otherwise use current year
- Same logic as Cameri

### Deduplication

- Deduplicate by `date|hour` key (prefer entries with time over those without)
- Strategy 1's `href` Map provides natural first-pass dedup

### Note Field

- Combine hall + subtitle info: e.g. `"אולם 2 | כתוביות בצרפתית"`
- Not persisted to DB (Event model has no `note` column) — used in dry-run output and JSON

### Debug Mode

- Dump raw HTML of dates container (or last 8000 chars of body)
- Dump all elements matching date patterns with tag/class/id/text info

### Function Signature

```js
export async function scrapeShowEvents(browser, url, { debug = false } = {}) {
  // Returns: { events: [{ date, hour, note, rawText }], venue, debugHtml?, debugDateElements? }
}
```

### Reference

- Model after `scrapeShowEvents()` in `scripts/lib/cameri.mjs` lines 525–800
- The existing `scrapeShowDetails()` in `scripts/lib/lessin.mjs` shows the page structure patterns

---

## Step 2: Create `scripts/scrape-lessin-events.mjs`

Single-show CLI entry point, modeled on `scripts/scrape-cameri-events.mjs`.

### CLI Interface

```
node scripts/scrape-lessin-events.mjs <lessin-show-url>             # dry-run
node scripts/scrape-lessin-events.mjs <lessin-show-url> --debug     # dump DOM
node scripts/scrape-lessin-events.mjs <lessin-show-url> --apply     # write to DB
```

### Key Differences from Cameri Version

- Import `scrapeShowEvents`, `LESSIN_BASE` from `./lib/lessin.mjs` (+ `launchBrowser` from `./lib/browser.mjs`)
- **Slug extraction**: `decodeURIComponent(pathname)` → last non-empty segment
  - No underscore→hyphen conversion needed (Lessin URLs already use hyphens like DB slugs)
  - **Must normalise dashes**: replace `–` (en-dash) and `—` (em-dash) with `-` (hyphen) before DB lookup
  - This handles edge cases like "לילה – סיפורה של לילה מוראד" where `generateSlug()` preserves the en-dash
- DB lookup: `prisma.show.findFirst({ where: { slug } })`
- Venue upsert: `{ name: "תיאטרון בית ליסין", city: "תל אביב" }`
- Same output formatting (events table, venue display, debug dump)

### Reference

- Model after `scripts/scrape-cameri-events.mjs` (205 lines)

---

## Step 3: Create `scripts/scrape-all-lessin-events.mjs`

All-shows CLI entry point, modeled on `scripts/scrape-all-cameri-events.mjs`.

### CLI Interface

```
node scripts/scrape-all-lessin-events.mjs                              # dry-run
node scripts/scrape-all-lessin-events.mjs --apply                       # write to DB
node scripts/scrape-all-lessin-events.mjs --json prisma/data/events-lessin.json  # write JSON
node scripts/scrape-all-lessin-events.mjs --debug                       # dump DOM per show
```

### Flow

1. Connect to DB → query all Lessin shows: `prisma.show.findMany({ where: { theatre: LESSIN_THEATRE } })`
   - `LESSIN_THEATRE = "תיאטרון בית ליסין"` (already exported from `scripts/lib/lessin.mjs`)
2. Launch browser → call existing `fetchShows(browser)` to get listing `[{ title, url }]`
3. Match DB shows to listings using `normaliseForMatch()` title comparison
4. Upsert venue: `{ name: "תיאטרון בית ליסין", city: "תל אביב" }`
5. Iterate matched shows, calling `scrapeShowEvents(browser, show.url, { debug })` for each
6. 1.5s polite delay between requests
7. Output to JSON / DB / dry-run based on flags

### Key Differences from Cameri Version

- Import `LESSIN_THEATRE`, `fetchShows`, `scrapeShowEvents` from `./lib/lessin.mjs`
- Use `fetchShows(browser)` instead of `fetchSchedule(browser)`
- Theatre filter: `{ theatre: LESSIN_THEATRE }` instead of `{ theatre: CAMERI_THEATRE }`
- Venue: `"תיאטרון בית ליסין"` / `"תל אביב"`
- JSON output venue: `{ name: "תיאטרון בית ליסין", city: "תל אביב" }`
- Header: `"Lessin Events Scraper — All Shows"`

### Reference

- Model after `scripts/scrape-all-cameri-events.mjs` (320 lines)

---

## Step 4: Update `prisma/sync-events.js`

Currently hardcoded to read one file (`prisma/data/events.json`) with one venue. Extend to also sync `prisma/data/events-lessin.json`.

### Approach

- Extract the upsert logic into a reusable `syncFile(prisma, filePath)` function
- Call it for `events.json` (always — fail if missing)
- Call it for `events-lessin.json` (if file exists — skip gracefully if not)
- Each file has its own `venue` object, so the function upserts its own venue and events independently

### JSON Format (unchanged)

```json
{
  "scrapedAt": "2026-03-11T...",
  "venue": { "name": "תיאטרון בית ליסין", "city": "תל אביב" },
  "events": [
    { "showId": 42, "date": "2026-04-16", "hour": "20:00", "note": "אולם 2" },
    { "showId": 42, "date": "2026-04-17", "hour": "12:00", "note": "אולם 2" }
  ]
}
```

### Why Separate Files (Option B from EVENTS_SYSTEM.md)

- Avoids restructuring existing Cameri pipeline
- Keeps theatre scrapes independent
- Each scraper writes its own file; sync reads both
- Adding more theatres later follows the same pattern

---

## Step 5: Update `.github/workflows/refresh-events.yml`

Add a second scrape step for Lessin after the existing Cameri scrape.

### Changes

- Add step: `node scripts/scrape-all-lessin-events.mjs --json prisma/data/events-lessin.json`
- Update `git add` to include `prisma/data/events-lessin.json`
- Update commit message to mention both theatres
- Workflow name could be updated from "Refresh Cameri Events" to "Refresh Events" or similar

---

## Technical Details

### Database Schema (no changes needed)

```prisma
model Venue {
  id      Int     @id @default(autoincrement())
  name    String
  city    String
  events  Event[]
  @@unique([name, city])
}

model Event {
  id      Int      @id @default(autoincrement())
  show    Show     @relation(...)
  showId  Int
  venue   Venue    @relation(...)
  venueId Int
  date    DateTime @db.Date
  hour    String
  @@unique([showId, venueId, date, hour])
}
```

The schema already supports multiple venues — no migration needed.

### Constants (already exist in `scripts/lib/lessin.mjs`)

- `LESSIN_THEATRE = "תיאטרון בית ליסין"` (line 17)
- `LESSIN_BASE = "https://www.lessin.co.il"` (line 18)
- `SHOWS_URL = "https://www.lessin.co.il/"` (line 19)

### Shared Utilities (already available)

- `launchBrowser()` from `scripts/lib/browser.mjs`
- `setupRequestInterception(page)` from `scripts/lib/browser.mjs`
- `createPrismaClient()`, `normaliseForMatch()` from `scripts/lib/db.mjs`
- `bold()`, `cyan()`, `yellow()`, `green()`, `red()`, `dim()`, `bidi()`, `separator()` from `scripts/lib/cli.mjs`

### Lessin Website DOM Structure

- Show pages: `https://www.lessin.co.il/shows/{slug}/`
- Events table: standard `<table>` with `<th>` headers (יום, תאריך, שעה, אולם)
- Each row has 3-4 `<a>` tags linking to `https://lessin.pres.global/eWeb/event/{id}`
- Date format: `DD.MM` (no year)
- Time format: `HH:MM`
- Optional subtitles: text like `כתוביות בצרפתית` in the row

### Slug Matching Caveat

- DB slugs are Hebrew with hyphens (generated by `generateSlug()`)
- `generateSlug()` preserves en-dashes (`–`) between hyphens: e.g. `לילה-–-סיפורה-של-לילה-מוראד`
- Single-show script must normalise `–`/`—` → `-` in URL-extracted slugs before DB lookup
- All-shows script avoids this by matching on normalised titles, not URL slugs

---

## Verification Steps

1. `node scripts/scrape-lessin-events.mjs https://www.lessin.co.il/shows/קרנפים/`
   → Should print events table (16.04 20:00, 17.04 12:00, etc.)

2. `node scripts/scrape-lessin-events.mjs https://www.lessin.co.il/shows/קרנפים/ --debug`
   → Verify selector matching against raw HTML

3. `node scripts/scrape-all-lessin-events.mjs`
   → Dry-run verifying all DB Lessin shows are matched and events scraped

4. `node scripts/scrape-all-lessin-events.mjs --json prisma/data/events-lessin.json`
   → Verify JSON output format matches expected schema

5. `node prisma/sync-events.js`
   → Verify both Cameri and Lessin events are synced to DB
