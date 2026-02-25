# Habima Theatre Scraper — Implementation Plan

> Staged plan for building a Habima show scraper, mirroring the existing Cameri pipeline.

## Overview

Build a scraper for [Habima Theatre](https://www.habima.co.il) shows that follows the same architecture as the existing Cameri scraper. The pipeline:

```
Habima Website → Puppeteer Scraping → AI Processing → Interactive HTML UI → Prisma Migration SQL → Git Push → Vercel Deploy → Production DB
```

**Theatre name in DB:** `"תיאטרון הבימה"`
**Show listing source:** Repertoire page (`https://www.habima.co.il/רפרטואר/`)
**Guest shows:** Include all (strip `"הצגה אורחת"` prefix from titles)

---

## Stage 1: Extract Shared Browser Helpers

**Goal:** Move `launchBrowser()` and `setupRequestInterception()` out of `scripts/lib/cameri.mjs` into a shared module, so both Cameri and Habima can import them without cross-dependency.

### Tasks

- [x] Create `scripts/lib/browser.mjs` with two functions extracted from `scripts/lib/cameri.mjs` (lines 25–57):
  - `launchBrowser()` — launches headless Puppeteer with `--no-sandbox`
  - `setupRequestInterception(page, { allowImages })` — blocks stylesheets, fonts, media
- [x] Update `scripts/lib/cameri.mjs` — remove the two functions, import + re-export from `browser.mjs` for backward compatibility:
  ```js
  export { launchBrowser, setupRequestInterception } from "./browser.mjs";
  ```
- [x] Verify `find-missing-cameri-shows.mjs` still works unchanged (it imports from `cameri.mjs`)
- [x] Verify `download-missing-images.mjs` still works (if it imports these functions)

### Verification

```bash
node scripts/find-missing-cameri-shows.mjs --json 2>&1 | head -5
# Should start scraping without import errors (will fail gracefully if no DB — that's fine)
```

### Files Changed

| File                      | Action                                                      |
| ------------------------- | ----------------------------------------------------------- |
| `scripts/lib/browser.mjs` | **Create** — `launchBrowser`, `setupRequestInterception`    |
| `scripts/lib/cameri.mjs`  | **Modify** — remove functions, re-export from `browser.mjs` |

---

## Stage 2: Create `habima.mjs` — Habima-Specific Scraping Module

**Goal:** Build the Habima-specific scraping logic: repertoire listing + show detail extraction.

### Tasks

- [x] Create `scripts/lib/habima.mjs` with the following exports:

#### Constants

```js
HABIMA_THEATRE = "תיאטרון הבימה";
HABIMA_BASE = "https://www.habima.co.il";
REPERTOIRE_URL =
  "https://www.habima.co.il/%D7%A8%D7%A4%D7%A8%D7%98%D7%95%D7%90%D7%A8/";
```

#### `fetchRepertoire(browser)` → `Promise<Array<{ title, url }>>`

Equivalent of Cameri's `fetchSchedule`. Scrapes the repertoire page:

1. Navigate to `REPERTOIRE_URL`, wait for `networkidle2`
2. Wait for show cards to load (selector: links containing `/shows/`)
3. In `page.evaluate`:
   - Find all `a[href*="/shows/"]` elements
   - For each, extract the text content and href
   - Build full URL: `HABIMA_BASE + href`
   - Deduplicate by title (use a `Map`)
   - Filter out non-show links: skip elements whose text is generic (e.g. `"לרכישה"`, `"לתאריכים ורכישה"`, `"רוצים לראות עוד?"`, empty text). Only keep links where text content looks like a show title
   - **Important:** The page has `h3` elements with show titles, and nearby `a[href*="/shows/"]` links with text `"לרכישה"`. The actual show title is in the `h3`, not in the link text. Strategy: find all `h3` elements, get their `textContent`, then find the nearest `a[href*="/shows/"]` within the same parent container to get the URL.
   - Alternative strategy: collect all unique `/shows/{slug}/` hrefs, then derive titles from the `h3` elements that are siblings/ancestors of those links
4. Sort alphabetically in Hebrew
5. Close page, return results

**Shows found on the repertoire page (as of Feb 2026):**
להתראות ותודה על הקרמשניט, אוי אלוהים, מחווה לדיוות הגדולות, הלילה השנים-עשר, הנערה מהדואר, פריסילה מלכת המדבר - סיור מאחורי הקסם!, פעולות פשוטות, מלאכים בלבן, משכנתא, מעגל הגיר הקווקזי, הסוחר מוונציה, משהו טוב, הג'יגולו מקונגו, מי את חושבת שאת, פריסילה מלכת המדבר, הערת שוליים, תרקדי איתי, רומי + ג'ולייט, פינוקיו, בית בובות, חתונה מאוחרת, מרציפנים, מעבר לדלת, השכנים מלמעלה, קזבלן, בוסתן ספרדי 2021, סיור "מאחורי הקלעים"

There may also be guest shows listed on the presentations page that don't appear in the repertoire. For example `"מה שנשאר לך בברלין"` and `"זו שכותבת אותי"` appear on the presentations/calendar page but not the repertoire. Consider checking the calendar page too, or the user can run the scraper again later.

#### `scrapeShowDetails(browser, url)` → `Promise<{ title, durationMinutes, description, imageUrl }>`

Equivalent of Cameri's `scrapeShowDetails`. Scrapes a single show page:

1. Navigate to URL, wait for `networkidle2`, wait for `h1`
2. In `page.evaluate`, extract:

   **Title:**
   - From `h1` text content
   - Strip `"הצגה אורחת"` prefix if concatenated (observed: `"הצגה אורחתמה שנשאר לך בברלין"` → `"מה שנשאר לך בברלין"`)
   - Regex: `title.replace(/^הצגה אורחת/, "").trim()`

   **Duration:**
   - Regex on `document.body.innerText`: `משך ההצגה:\s*(\d+)\s*דקות`
   - Same pattern as Cameri — works on both sites

   **Description:**
   - Habima pages have a different structure than Cameri:
     - `h2` subtitle (bold blurb under the title)
     - Multi-paragraph description body after it
   - Strategy: get `body.innerText`, find the h1 title, then capture text from after it until stop markers:
     - `"הצגות קרובות"`
     - `"יוצרים ומשתתפים"` or `"יוצרים ושחקנים"`
     - `"ביקורות"`
     - `"משך ההצגה"`
     - `"מנויים מקבלים"`
   - Clean up:
     - Remove age restriction lines (`גילאי \d+\s*\+`)
     - Remove photo credit lines (`*צילום:...`)
     - Remove asterisked lines
     - Collapse excess newlines
     - Strip book/sponsor credit blocks (e.g. `"הספר... יצא לאור"`, `"הפקה נתמכה"`)
   - **Note:** Cameri uses an `"על ההצגה"` marker to find description start. Habima does NOT have this marker. Instead, the description starts right after the `h1` title (or the `h2` subtitle). Adjust extraction logic accordingly.

   **Image URL:**
   - Same 5-strategy approach as Cameri (inlined in `page.evaluate`):
     1. `og:image` meta tag
     2. `twitter:image` meta tag
     3. Large visible `<img>` elements (skip logos/icons)
     4. Hero/banner background images
   - No need for `prdPics` CDN check (that's Cameri-specific)

3. Fix double-protocol URLs outside evaluate (using `fixDoubleProtocol` from `image.mjs`)
4. Close page, return data

### Verification

```bash
# Quick smoke test — scrape one known show
node -e "
import('./scripts/lib/browser.mjs').then(async ({ launchBrowser }) => {
  const { scrapeShowDetails } = await import('./scripts/lib/habima.mjs');
  const browser = await launchBrowser();
  const data = await scrapeShowDetails(browser, 'https://www.habima.co.il/shows/%d7%94%d7%a0%d7%a2%d7%a8%d7%94-%d7%9e%d7%94%d7%93%d7%95%d7%90%d7%a8/');
  console.log(JSON.stringify(data, null, 2));
  await browser.close();
});
"
```

Expected: title `"הנערה מהדואר"`, duration `105`, non-empty description, image URL.

### Files Changed

| File                     | Action                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------ |
| `scripts/lib/habima.mjs` | **Create** — `HABIMA_THEATRE`, `HABIMA_BASE`, `REPERTOIRE_URL`, `fetchRepertoire`, `scrapeShowDetails` |

---

## Stage 3: Create `find-missing-habima-shows.mjs` — Main Orchestrator

**Goal:** Build the full end-to-end pipeline script, mirroring `find-missing-cameri-shows.mjs` (942 lines).

### Tasks

- [x] Create `scripts/find-missing-habima-shows.mjs` by copying `find-missing-cameri-shows.mjs` and making these targeted changes:

#### Import changes (top of file)

Replace:

```js
import {
  CAMERI_THEATRE,
  launchBrowser,
  fetchSchedule,
  scrapeShowDetails,
} from "./lib/cameri.mjs";
```

With:

```js
import { launchBrowser } from "./lib/browser.mjs";
import {
  HABIMA_THEATRE,
  fetchRepertoire,
  scrapeShowDetails,
} from "./lib/habima.mjs";
```

#### Theatre constant

Replace all references to `CAMERI_THEATRE` with `HABIMA_THEATRE`.

#### Schedule fetching

Replace:

```js
const shows = await fetchSchedule(browser);
```

With:

```js
const shows = await fetchRepertoire(browser);
```

#### DB lookup

Replace:

```js
const existingTitles = await fetchExistingTitles(CAMERI_THEATRE);
```

With:

```js
const existingTitles = await fetchExistingTitles(HABIMA_THEATRE);
```

#### HTML output filename

Replace:

```js
path.join(rootDir, "missing-cameri-shows.html");
```

With:

```js
path.join(rootDir, "missing-habima-shows.html");
```

#### Migration folder name

Replace:

```js
const migrationName = `${ts}_add_cameri_shows`;
```

With:

```js
const migrationName = `${ts}_add_habima_shows`;
```

#### UI text

Update any user-facing strings from "Cameri" / "קאמרי" to "Habima" / "הבימה" — page titles, headings, log messages.

#### Everything else stays the same

- AI processing (`processDescription`, `classifyGenres`) — fully reusable
- `EXISTING_GENRES` list — same 14 genres
- `generateMigrationSQL` — generic, no theatre-specific logic
- `escapeSql`, `sleep`, `esc` — generic helpers
- Interactive server with edit UI — generic
- Image download via `downloadAndConvert` — generic
- `POLITE_DELAY = 1500` — same
- Port `3456` — same

### Verification

```bash
# Test JSON output (no DB needed for basic scraping)
node scripts/find-missing-habima-shows.mjs --json

# Test HTML report
node scripts/find-missing-habima-shows.mjs --html
# Should create missing-habima-shows.html, open and inspect show data

# Test interactive mode (needs DATABASE_URL and GITHUB_TOKEN)
node scripts/find-missing-habima-shows.mjs
# Opens browser at localhost:3456 with editable show list
# Click "Generate Migration" to verify SQL output
```

**Spot checks:**

- `"הנערה מהדואר"` → duration 105, cleaned description, valid image URL
- `"מה שנשאר לך בברלין"` → duration 65, title correctly stripped of `"הצגה אורחת"` prefix (if scraping from show page)
- `"קזבלן"` → should appear with description and image
- All shows should have `theatre: "תיאטרון הבימה"` in the generated SQL

### Files Changed

| File                                    | Action                                                                    |
| --------------------------------------- | ------------------------------------------------------------------------- |
| `scripts/find-missing-habima-shows.mjs` | **Create** — full orchestrator (~940 lines, copied + adapted from Cameri) |

---

## Stage 4: Documentation & Cleanup

**Goal:** Update project documentation.

### Tasks

- [x] Update `DATABASE_AND_DATA.md`:
  - In section "3. Scraper Script (adding new real shows)" — mention Habima alongside Cameri
  - Add `scripts/find-missing-habima-shows.mjs` to the Key Files Reference table
  - Add Habima usage example to "Common Tasks > Adding a new show to production"
- [x] Add `missing-habima-shows.html` to `.gitignore` (check if `missing-cameri-shows.html` is also gitignored; if not, gitignore both)
- [x] Delete this plan file (`HABIMA_SCRAPER.md`) once all stages are complete

### Files Changed

| File                   | Action                               |
| ---------------------- | ------------------------------------ |
| `DATABASE_AND_DATA.md` | **Modify** — add Habima scraper docs |
| `.gitignore`           | **Modify** (if applicable)           |
| `HABIMA_SCRAPER.md`    | **Delete** when done                 |

---

## Appendix A: Habima Page Structure Reference

### Repertoire Page (`/רפרטואר/`)

Lists ~27 shows. Each show appears as a card with:

- `h3` — show title (e.g. `"הנערה מהדואר"`, `"קזבלן"`)
- `a[href*="/shows/"]` — link with text `"לרכישה"`, pointing to the show detail page

### Show Detail Pages (`/shows/{slug}/`)

Structure observed from scraping two example pages:

```
h1 — title (may include "הצגה אורחת" prefix concatenated without space)
h2 — subtitle blurb (1-2 sentences)
[paragraphs] — multi-paragraph description body
"גילאי XX +" — age restriction (not always present)
"משך ההצגה: XX דקות (ללא הפסקה)" — duration
[optional book/sponsor credits]
h2 "הצגות קרובות" — upcoming show dates
h2 "ביקורות" — press reviews (not all shows)
h2 "יוצרים ומשתתפים" or "יוצרים ושחקנים" — cast & crew
[gallery] — photo carousel
h2 "מנויים מקבלים יותר!" — subscription promo
```

### Example: "הנערה מהדואר" detail page

- **Title h1:** `הנערה מהדואר`
- **Subtitle h2:** `עיבוד בימתי מרהיב לאחד הרומאנים האהובים בכל הזמנים...`
- **Description:** Multi-paragraph story about כריסטינה at a Swiss hotel
- **Duration:** `105 דקות (ללא הפסקה)`
- **Cast section header:** `יוצרים ושחקנים`
- **Has reviews section:** No

### Example: "מה שנשאר לך בברלין" detail page (guest show)

- **Title h1:** `הצגה אורחתמה שנשאר לך בברלין` (note: "הצגה אורחת" concatenated!)
- **Subtitle h2:** `שלוש מערכות על כל מה שלא הספקנו לאהוב מעולם.`
- **Description:** Multi-paragraph story about אורן and ג'ייסון
- **Duration:** `65 דקות (ללא הפסקה)`
- **Cast section header:** `יוצרים ומשתתפים`
- **Has reviews section:** Yes (4 reviews)
- **Age restriction:** `גילאי 18 +`

---

## Appendix B: Reused Shared Modules

| Module                    | Exports Used                                               | Notes                                        |
| ------------------------- | ---------------------------------------------------------- | -------------------------------------------- |
| `scripts/lib/slug.mjs`    | `generateSlug(title)`                                      | Hebrew-safe URL slugs. Universal.            |
| `scripts/lib/cli.mjs`     | `green`, `red`, `bold`, `dim`, `cyan`, `bidi`, etc.        | Terminal colors & RTL formatting. Universal. |
| `scripts/lib/db.mjs`      | `fetchExistingTitles(theatre)`, `normalise(title)`         | Already parameterised by theatre name.       |
| `scripts/lib/image.mjs`   | `downloadAndConvert(title, url)`, `fixDoubleProtocol(url)` | Image download & WebP conversion. Universal. |
| `scripts/lib/browser.mjs` | `launchBrowser()`, `setupRequestInterception()`            | Created in Stage 1.                          |
