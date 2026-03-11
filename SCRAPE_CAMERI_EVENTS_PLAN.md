# Scrape Cameri Show Events (Dates & Times)

## Goal

Scrape performance dates/times from Cameri show detail pages and populate the `Event` + `Venue` tables in the DB. Starting with **לילה טוב אמא** but the script must be **generic/reusable for any Cameri show URL**.

The user must **review scraped data before any DB changes** — dry-run by default.

## Context

### DB Schema (prisma/schema.prisma)

```prisma
model Venue {
  id      Int     @id @default(autoincrement())
  name    String
  city    String
  address String?
  events  Event[]
  @@unique([name, city])
}

model Event {
  id      Int      @id @default(autoincrement())
  show    Show     @relation(fields: [showId], references: [id], onDelete: Cascade)
  showId  Int
  venue   Venue    @relation(fields: [venueId], references: [id], onDelete: Cascade)
  venueId Int
  date    DateTime @db.Date
  hour    String
  @@unique([showId, venueId, date, hour])
  @@index([showId])
  @@index([venueId])
  @@index([date])
}
```

- **Event/Venue tables exist but are completely empty** — no scraper has ever populated them.
- The Show model has `events Event[]` relation (line 30 of schema).

### Existing Show Record

"לילה טוב אמא" already exists: **id=23, slug=`לילה-טוב-אמא`, theatre=`תיאטרון הקאמרי`** (from seed migration `20260225000000_seed_shows_data`).

### Known Dates (from schedule page cross-reference)

These 3 dates were confirmed by scraping the Cameri schedule page (`/לוח-הופעות/`):

| Date       | Time  | Notes             |
| ---------- | ----- | ----------------- |
| 2026-03-17 | 19:30 |                   |
| 2026-03-18 | 19:00 | English subtitles |
| 2026-04-08 | 18:30 |                   |

There may be more in later months (Sep-Dec 2026) — the schedule page loads dynamically.

### Venue

From the show description: _"מוצגת בקאמרי 3, אולם ייחודי ואינטימי"_ — venue is **"קאמרי 3"**, city **"תל אביב"**.

## Existing Codebase Patterns

### Scraping infrastructure (scripts/lib/)

| Module        | Key exports                                                                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `browser.mjs` | `launchBrowser()` — headless Puppeteer; `setupRequestInterception(page, opts)` — blocks fonts/media/images                                              |
| `cameri.mjs`  | `CAMERI_THEATRE`, `CAMERI_BASE`, `scrapeShowDetails(browser, url)` — scrapes title/duration/desc/cast/image; `fetchSchedule(browser)` — lists all shows |
| `db.mjs`      | `createPrismaClient()` → `{ prisma, pool }`, `fetchExistingTitles()`, `normalise()`, `escapeSql()`                                                      |
| `cli.mjs`     | `bold()`, `cyan()`, `yellow()`, `green()`, `red()`, `dim()`, `bidi()`, `separator()`, `printField()`                                                    |
| `slug.mjs`    | `generateSlug(title)` — Hebrew-preserving URL slugs                                                                                                     |

### How existing scrapers work

All scrapers follow the same Puppeteer pattern:

1. `launchBrowser()` → browser instance
2. `page = browser.newPage()` → `setupRequestInterception(page)` → `page.goto(url, { waitUntil: 'networkidle2' })`
3. `page.evaluate(() => { ... })` for DOM extraction
4. Parse results outside browser context

**Key**: The dates section on Cameri show pages loads dynamically via JavaScript. Static fetching (fetch_webpage) does NOT capture it. A Puppeteer-based approach is required.

### Cameri show page URL pattern

`https://www.cameri.co.il/הצגות_הקאמרי/{slug}/` (percent-encoded in practice)

The show page has sections: על ההצגה → צוות אמנותי → בהשתתפות → גלריה → ביקורות → (dates section, dynamically loaded) → "תאריכים ורכישת כרטיסים"

## Implementation Plan

### 1. Add `scrapeShowEvents()` to `scripts/lib/cameri.mjs`

New exported async function:

```javascript
export async function scrapeShowEvents(browser, url) {
  // Opens show page with Puppeteer
  // Waits for networkidle2 + scrolls to trigger lazy-loaded dates section
  // page.evaluate() to extract date+time entries from DOM
  // Returns Array<{ date: string, hour: string, venue: string | null }>
}
```

**DOM discovery challenge**: The exact selectors for the dates section are unknown. Include a debug mode that dumps the raw `innerHTML` of the dates area so we can see what the browser rendered and refine selectors.

Approach:

- Scroll down to trigger lazy loading (same pattern as `fetchSchedule`)
- Wait extra time for the dates widget to render
- Look for the section after "תאריכים ורכישת כרטיסים" or similar heading
- Search for date patterns (DD.MM, DD/MM/YYYY) and time patterns (HH:MM) in that section
- Try common selectors: calendar cells, date cards, list items, table rows
- Extract venue name from page text (e.g. "מוצגת בקאמרי 3")

### 2. Create `scripts/scrape-cameri-events.mjs`

Entry-point script:

```
node scripts/scrape-cameri-events.mjs <cameri-show-url> [--debug] [--apply]
```

- **Default (dry-run)**: Scrapes and prints a formatted table of dates/times/venue for review
- **`--debug`**: Also dumps raw HTML of the dates section for selector refinement
- **`--apply`**: After displaying results, upserts `Venue` + `Event` records to DB via Prisma
  - Resolves `showId` by converting URL path to slug and looking up `Show.findUnique({ where: { slug } })`
  - Upserts venue using `@@unique([name, city])` constraint
  - Creates events using `@@unique([showId, venueId, date, hour])` constraint

### 3. Verification

After running, cross-check output against the 3 known dates above. If the show page's dates widget doesn't render or yields nothing, fall back to `--debug` to inspect the DOM and iterate on selectors.

## Files to Create/Modify

| File                               | Action                            |
| ---------------------------------- | --------------------------------- |
| `scripts/lib/cameri.mjs`           | Add `scrapeShowEvents()` function |
| `scripts/scrape-cameri-events.mjs` | New entry-point script            |

## First Run Command

```bash
node scripts/scrape-cameri-events.mjs "https://www.cameri.co.il/%D7%94%D7%A6%D7%92%D7%95%D7%AA_%D7%94%D7%A7%D7%90%D7%9E%D7%A8%D7%99/%d7%9c%d7%99%d7%9c%d7%94_%d7%98%d7%95%d7%91_%d7%90%d7%9e%d7%90/" --debug
```
