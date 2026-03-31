# Theatre Scraping & Pipeline Guide

> Reference document for adding new theatre scrapers. Read this before building a scraper for a new theatre.
>
> For **event scraping** (performance dates/times), see `events-system.md`.

## 1. Architecture Overview

The scraping system has three layers:

| Layer           | File                                             | Role                                                                                                  |
| --------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Entry point     | `scripts/find-missing/find-missing-{id}-shows.mjs` | ~15-line CLI wrapper that wires theatre-specific functions into the pipeline                          |
| Theatre scraper | `scripts/lib/{id}.mjs`                           | Theatre-specific listing + detail scraping logic                                                      |
| Shared pipeline | `scripts/lib/pipeline.mjs`                       | Everything else: DB dedup, AI processing, image download, migration generation, interactive review UI |

**Data flow:**

```
Listing page → [{title, url}]
       ↓
Filter against DB (keep only missing shows)
       ↓
Detail pages → [{title, durationMinutes, description, imageUrl}] (1.5s delay between requests)
       ↓
Download & convert images to .webp → public/
       ↓
AI summaries (GPT-4o-mini, batches of 7) → 20-40 word Hebrew summaries
       ↓
AI genre classification (GPT-4o-mini) → 1-3 genres per show
       ↓
Interactive review server (localhost:3456+) → user edits & validates
       ↓
Generate migration SQL → prisma/migrations/{timestamp}_add_{id}_shows/migration.sql
```

## 2. The Pipeline Contract

`runPipeline(config)` in `scripts/lib/pipeline.mjs` accepts:

```js
{
  theatreId: string,           // lowercase, used in migration filename (e.g. "cameri", "habima", "lessin")
  theatreName: string,         // Hebrew display name (e.g. "תיאטרון הקאמרי")
  theatreConst: string,        // Value stored in DB `theatre` column (same as theatreName)
  fetchListing: Function,      // (browser) → Promise<{title, url}[]>
  scrapeDetails: Function,     // (browser, url) → Promise<{title, durationMinutes, description, imageUrl}>
  titlePreference: string,     // "listing-first" | "detail-first"
  launchBrowser: Function,     // from scripts/lib/browser.mjs
}
```

### `fetchListing(browser)`

- Input: Puppeteer `Browser` instance
- Output: Array of `{title: string, url: string}` — deduplicated by title, sorted alphabetically in Hebrew
- Must handle: page navigation, waiting for selectors, title cleanup, deduplication

### `scrapeDetails(browser, url)`

- Input: Puppeteer `Browser` instance + show detail page URL
- Output: `{title: string, durationMinutes: number|null, description: string, imageUrl: string|null}`
- `title` — cleaned show title from the page
- `durationMinutes` — integer minutes or `null` (user can edit in review UI)
- `description` — raw description text (AI will clean and summarize it)
- `imageUrl` — poster/hero image URL or `null`

### `titlePreference`

- `"listing-first"` — use the title from the listing page; fall back to detail page title. Best when listing titles are cleaner (Habima, Lessin)
- `"detail-first"` — use the title from the detail page h1; fall back to listing title. Best when listing titles are truncated or inconsistent (Cameri)

## 3. Shared Utilities (Do NOT Reimplement)

| Module                     | Key exports                                                                          | What it does                                                                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/lib/browser.mjs`  | `launchBrowser()`, `setupRequestInterception(page, opts)`                            | Launches headless Puppeteer; intercepts requests to block stylesheets/fonts/media (pass `{allowImages: true}` to keep images)                                  |
| `scripts/lib/image.mjs`    | `extractImageFromPage()`, `downloadAndConvert(title, url)`, `fixDoubleProtocol(url)` | Extracts best image from a page (5 fallback strategies: og:image → twitter:image → CDN → large visible img → background hero); downloads and converts to .webp |
| `scripts/lib/db.mjs`       | `getExistingTitles(theatreName)`, `getAllExistingSlugs()`                            | Queries local DB for deduplication                                                                                                                             |
| `scripts/lib/slug.mjs`     | `generateSlug(title)`                                                                | Creates Hebrew-preserving URL slugs                                                                                                                            |
| `scripts/lib/pipeline.mjs` | `runPipeline(config)`                                                                | Full orchestration: dedup, scrape, AI, review, migration                                                                                                       |

## 4. What Each Theatre Scraper Must Implement

Create `scripts/lib/{id}.mjs` exporting:

1. **Theatre name constant** — e.g. `export const XXX_THEATRE = "שם התיאטרון";`
2. **Listing function** — e.g. `export async function fetchShows(browser) { ... }`
3. **Detail function** — `export async function scrapeShowDetails(browser, url) { ... }`

### Listing Function Patterns

Two patterns exist in the codebase:

**Pattern A: Direct link scraping (Cameri)**

- Find all `<a>` tags matching a URL pattern (e.g. `a[href*="/show_"]`)
- Extract title from the link text or nearby heading
- Simple and reliable when the link text IS the title

**Pattern B: Heading + parent walk (Habima, Lessin)**

- Find all `<h3>` headings on the page
- For each h3, walk up the DOM (up to 5 parents) to find the nearest `<a>` matching the URL pattern
- Fallback: scan remaining links not yet captured
- Better when titles and links are separate DOM elements

### Detail Function Patterns

| Field           | Common approach                                                                                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Title**       | `document.querySelector('h1')?.textContent.trim()` with theatre-specific cleanup                                                                                       |
| **Duration**    | Search page text for `משך ההצגה` marker, then parse. Standard format: `X דקות` → parseInt. Some theatres use textual Hebrew — see `scripts/lib/duration.js` for parser |
| **Description** | Find text between a start marker (e.g. `"על ההצגה"`) and stop markers (e.g. `"יוצרים ושחקנים"`, `"משך ההצגה"`). Clean up credits, phone numbers, promotional lines     |
| **Image**       | Call `extractImageFromPage` (shared utility). Requires `allowImages: true` in request interception if the image is a DOM `<img>` element rather than a meta tag        |

## 5. Existing Theatre Scrapers

There are currently **11 theatre scrapers** and **16+ venue scrapers** for events, plus show-discovery scrapers for all theatres. All are registered in `scripts/lib/theatres-config.mjs`.

### Show-discovery scrapers (find-missing)

Each theatre has a `scripts/find-missing/find-missing-{id}-shows.mjs` entry point and a `scripts/lib/{id}.mjs` module. The original three (Cameri, Habima, Lessin) established the patterns used by all subsequent scrapers.

| Theatre | Module | Theatre Name | Title Preference |
| ------- | ------ | ------------ | --------------- |
| Cameri | `scripts/lib/cameri.mjs` | תיאטרון הקאמרי | detail-first |
| Habima | `scripts/lib/habima.mjs` | תיאטרון הבימה | listing-first |
| Lessin | `scripts/lib/lessin.mjs` | תיאטרון בית ליסין | listing-first |
| Khan | `scripts/lib/hakahn.mjs` | תיאטרון החאן | listing-first |
| Gesher | `scripts/lib/gesher.mjs` | תיאטרון גשר | listing-first |
| Haifa | `scripts/lib/haifa.mjs` | תיאטרון חיפה | listing-first |
| Tmuna | `scripts/lib/tmuna.mjs` | תיאטרון תמונע | listing-first |
| Beer Sheva | `scripts/lib/beer-sheva.mjs` | תיאטרון באר שבע | listing-first |
| Tzavta | `scripts/lib/tzavta.mjs` | תיאטרון צוותא | listing-first |
| Habima | `scripts/lib/habima.mjs` | תיאטרון הבימה | listing-first |

## 6. Step-by-Step: Adding a New Theatre

### Prerequisites

- Node.js, Puppeteer, local PostgreSQL with the app's schema
- `DATABASE_URL` in `.env.local` pointing to local DB
- `GITHUB_TOKEN` for AI summaries/genres (optional but recommended)

### Steps

1. **Research the website**: Open the theatre's website in a browser. Identify:
   - The URL that lists all current shows (repertoire/schedule page)
   - The CSS selector pattern for show links (e.g. `a[href*="/shows/"]`)
   - How show titles appear (in the link? in a heading? in a card?)
   - The show detail page structure: where is the title (h1?), duration, description, image?
   - Any non-show items that appear in the listing (gift cards, tours, etc.)

2. **Create `scripts/lib/{id}.mjs`**:
   - Import shared utilities: `fixDoubleProtocol`, `extractImageFromPage` from `./image.mjs`; `setupRequestInterception` from `./browser.mjs`
   - Export the theatre name constant
   - Export the listing function (choose Pattern A or B based on research)
   - Export the detail scraping function
   - If duration format is non-standard, add a custom parser (see `scripts/lib/duration.js`)

3. **Create `scripts/find-missing/find-missing-{id}-shows.mjs`**:

   ```js
   #!/usr/bin/env node
   import { runPipeline } from "../lib/pipeline.mjs";
   import { launchBrowser } from "../lib/browser.mjs";
   import { THEATRE_CONST, fetchXxx, scrapeShowDetails } from "../lib/{id}.mjs";

   await runPipeline({
     theatreId: "{id}",
     theatreName: THEATRE_CONST,
     theatreConst: THEATRE_CONST,
     fetchListing: fetchXxx,
     scrapeDetails: scrapeShowDetails,
     titlePreference: "listing-first", // or "detail-first"
     launchBrowser,
   });
   ```

4. **Run and test**:

   ```bash
   node scripts/find-missing/find-missing-{id}-shows.mjs
   ```

   - Verify listing count looks right
   - Check titles are clean (no promotional suffixes/prefixes)
   - Confirm durations parse correctly
   - Review descriptions in the interactive UI
   - Generate migration, then: `npx prisma migrate deploy`

5. **Commit**: The migration file + scraper module + entry point script

## 7. Common Pitfalls

- **`extractImageFromPage` serialization**: Puppeteer's `page.evaluate()` can't serialize imported functions as arguments in all cases. Habima/Lessin pass the function directly (`page.evaluate(extractImageFromPage)`); Cameri serializes it differently. **Use the Habima/Lessin pattern for new scrapers.**

- **Request interception — allow images**: If the theatre's show image is a regular `<img>` tag (not just og:image meta), you MUST pass `{allowImages: true}` to `setupRequestInterception()`, otherwise images will be blocked and `extractImageFromPage` won't find them.

- **Hebrew URL encoding**: Some theatre URLs contain Hebrew characters. Use the percent-encoded form in constants for reliability (e.g. `%D7%A8%D7%A4%D7%A8%D7%98%D7%95%D7%90%D7%A8` instead of `רפרטואר`).

- **Title deduplication is by normalized text**: `normalise()` in db.mjs trims and collapses whitespace. If a theatre has subtle title variations (extra spaces, dashes), they'll be treated as the same show.

- **Slug collisions across theatres**: If two theatres have a show with the same title, the pipeline auto-disambiguates slugs by appending the theatre name. The image file is also copied to the disambiguated slug filename.

- **Non-standard durations**: If a theatre uses textual Hebrew durations (like Lessin's `"כשעה וחצי"`), create a dedicated parser. Put it in `scripts/lib/duration.js` (CommonJS for Jest testability) and add unit tests in `tests/unit/`.

- **Non-show entries**: Theatres often have non-show listings (tours, gift cards, youth programs). Filter them in the listing function by checking against a blocklist of known non-show h3 texts.

## 8. Excluded Shows

When you generate a migration from the interactive review UI, any **unchecked** shows are automatically saved to `scripts/data/excluded-shows.json`. On subsequent scraping runs, these excluded shows are filtered out and won't appear again.

### How it works

1. Scraper finds shows missing from DB
2. Pipeline filters out shows in `excluded-shows.json` (matched by normalised title + theatre name)
3. Interactive UI shows only non-excluded shows
4. On "Generate Migration": checked shows → migration SQL, unchecked shows → exclusion list
5. Console logs `⏭ Skipping N previously excluded show(s)` when exclusions are applied

### File format

`scripts/data/excluded-shows.json` — an array of objects:

```json
[
  {
    "title": "normalised show title",
    "theatre": "תיאטרון הקאמרי",
    "excludedAt": "2026-02-27T10:30:00.000Z"
  }
]
```

### Un-excluding a show

To make an excluded show reappear in future scraping runs, manually remove its entry from `scripts/data/excluded-shows.json`.

## 9. Prompt Template for Adding a New Theatre

Copy-paste this into a new agent chat, replacing `{THEATRE_NAME}` and `{THEATRE_URL}`:

> **Read `docs/theatre-scraping-guide.md` first** — it documents our full scraping pipeline architecture.
>
> Build a scraper for **{THEATRE_NAME}** (`{THEATRE_URL}` — verify the actual URL by fetching it).
>
> **What to create:**
>
> 1. `scripts/lib/{id}.mjs` — theatre-specific scraper module
> 2. `scripts/find-missing/find-missing-{id}-shows.mjs` — thin entry-point script
>
> **Before writing code**, research the theatre website to understand:
>
> - Which page lists all current shows (repertoire/schedule page)
> - The CSS selector pattern for show links
> - How titles appear in the listing
> - Detail page structure: title, duration format, description section, image placement
> - Non-show items that appear in listings
>
> **Follow the exact patterns from existing scrapers** (see the guide for Pattern A vs Pattern B).
> The pipeline (`runPipeline()`) handles everything after scraping — do NOT reimplement AI summaries, migration generation, or the review UI.
>
> **Theatre-specific decisions to make:**
>
> - `theatreId`: lowercase identifier
> - `theatreName` / `theatreConst`: Hebrew display name
> - `titlePreference`: `"listing-first"` or `"detail-first"`
> - Duration format: standard `X דקות` or custom parser needed?
> - Description markers: what signals start/end of description?
> - Title cleanup: any prefixes/suffixes to strip?
> - Non-show filter: what non-show entries to exclude?
