# Hebrew Theatre (התיאטרון העברי) Scraper Plan

> Plan for building a scraper for התיאטרון העברי — based on website research conducted on 2026-02-27.

## 1. Website Research Summary

### Theatre Identity

- **Name**: התיאטרון העברי (The Hebrew Theatre)
- **Website**: `https://www.teatron.org.il/`
- **Location**: Haifa (חיפה)
- **Contact**: Phone 04-8814814 / \*5184, email rachel@tnt.org.il

### Shows Listing Page

- **URL**: `https://www.teatron.org.il/shows/`
  - This is a dedicated "הצגות" (Shows) page listing all current productions
  - The homepage (`/`) also features shows in a carousel/slider, but `/shows/` has the full listing
- **~22 shows currently listed** (as of 2026-02-27):
  זוגיות AI, הברונית רוטשילד, גבירתי הנאווה, אהבה בהפתעה, עפרה, בגלל הרוח, הלב שלי בחר, מראה מעל הגשר, פים פם פה, השוטר אזולאי, כנר על הגג – המחזמר, צלילי המוסיקה, התשמע קולי, קנאביס, קברט ז'בוטינסקי, הכל נשאר במשפחה, הפרח בגני, אני פה בגלל אשתי, שיעור באהבה, שוקו וניל, זוג משמיים, רוחל'ה מתחתנת

### Link Pattern

- **Selector**: `a[href*="/shows/"]`
- **URL format**: `https://www.teatron.org.il/shows/{hebrew-slug}/`
- Example: `https://www.teatron.org.il/shows/%d7%96%d7%95%d7%92%d7%99%d7%95%d7%aa-ai/`

### Listing Page Structure

- Show titles appear as **`<h2>` or `<h3>` headings** (the fetch tool normalizes heading levels, so the exact tag is uncertain — the scraper will query both for resilience)
- Each show card has:
  - A heading with the show title, linked to the detail page
  - A short tagline/description below
  - A "פרטים נוספים" (More details) link pointing to the same `/shows/{slug}/` URL
- **No pagination** observed — all shows appear on a single page

### Detail Page Structure

| Element         | Location / Pattern                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| **Title**       | `<h1>` element — clean show title, no prefixes/suffixes observed                                              |
| **Duration**    | **NOT present** on any checked pages — no "משך ההצגה" marker found. Will be `null`                            |
| **Description** | Text block after the h1 title, before the credits section. **No "על ההצגה" start marker** — similar to Habima |
| **Credits**     | Marked by "יוצרים:" (creators) and "משתתפים:" (cast) sections                                                 |
| **Dates**       | `<h2>` section "תאריכי הצגות" with a table of dates/venues/purchase links                                     |
| **Image**       | Show poster images are present on the page (DOM `<img>` elements) — need `allowImages: true`                  |
| **Share**       | "שתפו חברים" section with social sharing buttons                                                              |

### Non-Show Entries to Filter

From the listing page, the following non-show heading texts must be excluded:

- `"הצטרפו לתוכנית המנויים שלנו"` — subscription promotion
- `"הצגות"` — page title heading (the page header itself)
- `"שתפו חברים"` — share section
- `"תאריכי הצגות"` — dates section (if it somehow appears)

Navigation/footer elements that might appear as headings but are not shows.

### Title Cleanup

- **No prefixes or suffixes** to strip — titles observed on both listing and detail pages are clean
- Some titles contain special characters: `כנר על הגג – המחזמר` (em dash), `רוחל'ה מתחתנת` (geresh/apostrophe)
- Whitespace normalization needed (standard `.replace(/\s+/g, " ").trim()`)

## 2. Architecture Decisions

### Pipeline Configuration

| Setting           | Value              | Rationale                                                                                    |
| ----------------- | ------------------ | -------------------------------------------------------------------------------------------- |
| `theatreId`       | `"hebrew-theatre"` | Per user specification                                                                       |
| `theatreName`     | `"התיאטרון העברי"` | Theatre's own name (from website footer: "כל הזכויות שמורות. התיאטרון העברי")                |
| `theatreConst`    | `"התיאטרון העברי"` | Same as `theatreName` — stored in DB `theatre` column                                        |
| `titlePreference` | `"listing-first"`  | Both listing (`<h2>`) and detail (`<h1>`) titles are clean and identical; listing is cheaper |

### Listing Pattern: **Pattern B (h2/h3 + parent walk)**

Use **Pattern B** (heading + parent walk), querying **both `<h2>` and `<h3>`**:

1. Find all `<h2>` and `<h3>` headings on the `/shows/` page (`document.querySelectorAll("h2, h3")`)
2. For each heading, walk up the DOM (up to 5 parents) to find the nearest `<a>` matching `a[href*="/shows/"]`
3. Fallback: scan remaining `/shows/` links not yet captured
4. Filter out non-show heading texts (see blocklist below)
5. Deduplicate by title, sort alphabetically in Hebrew

**Why query both h2 and h3**: The fetch tool normalizes heading levels, so we can't be certain whether the actual HTML uses `<h2>` or `<h3>` for show titles. Querying both adds resilience at no cost — the blocklist and `/shows/` URL check prevent false positives regardless of heading level.

**Why Pattern B over Pattern A**: The show title is in a heading element, and the link may be on a parent container or sibling element. Pattern B reliably pairs titles with URLs even when they're in different DOM elements.

### Duration Parsing: **None needed — always `null`**

- No duration information found on any of the ~4 detail pages checked
- No "משך ההצגה" marker exists on this theatre's pages
- Duration will default to `null` — users can edit it in the interactive review UI
- **No custom parser needed** (unlike Lessin)

### Description Extraction: **Habima-style (no start marker)**

- There is no "על ההצגה" marker on detail pages (unlike Cameri/Lessin)
- Description text starts after the `<h1>` title, similar to Habima's approach
- Use h1 title position in `body.innerText` as the start point

**Stop markers** (text signals that end the description):

| Marker           | What it is                                      |
| ---------------- | ----------------------------------------------- |
| `"יוצרים:"`      | Start of creators/credits section               |
| `"שתפו חברים"`   | Social sharing section                          |
| `"תאריכי הצגות"` | Show dates section                              |
| `"משתתפים:"`     | Cast list (backup, in case "יוצרים" is missing) |

**Cleanup patterns**:

- Remove photo credit lines: `/צילום:.*$/gm`
- Remove asterisked lines: `/^\*[^\n]*$/gm`
- Collapse excess newlines: `/\n{3,}/g` → `"\n\n"`
- Remove promotional one-liners that may be duplicated from the listing tagline

### Image Extraction

- Images are DOM `<img>` elements (not just og:image meta tags)
- **Must pass `{ allowImages: true }` to `setupRequestInterception()`**
- Use `extractImageFromPage` (shared utility) — pass directly to `page.evaluate()` (Habima/Lessin pattern)
- Also call `fixDoubleProtocol()` on the result

### Non-Show Filter (Blocklist)

```js
const NON_SHOW_TITLES = [
  "הצטרפו לתוכנית המנויים שלנו",
  "הצגות",
  "שתפו חברים",
  "תאריכי הצגות",
  "ניווט מהיר",
  "צרו קשר",
  "הצטרפו אלינו",
];
```

Also filter headings with `title.length < 2`.

## 3. Files to Create

### File 1: `scripts/lib/hebrew-theatre.mjs`

Theatre-specific scraper module exporting:

1. **`HEBREW_THEATRE`** — constant: `"התיאטרון העברי"`
2. **`HEBREW_THEATRE_BASE`** — constant: `"https://www.teatron.org.il"`
3. **`SHOWS_URL`** — constant: `"https://www.teatron.org.il/shows/"`
4. **`fetchShows(browser)`** — listing function (Pattern B with `<h2>/<h3>`)
5. **`scrapeShowDetails(browser, url)`** — detail scraper

#### `fetchShows(browser)` — Pseudocode

```
1. Open new page, setup request interception (images blocked for listing)
2. Navigate to SHOWS_URL, wait for networkidle2
3. Wait for selector: a[href*="/shows/"]
4. page.evaluate():
   a. Find all <h2> and <h3> elements (querySelectorAll("h2, h3"))
   b. For each heading:
      - Extract + normalize title text
      - Skip if title is in NON_SHOW_TITLES blocklist or length < 2
      - Walk up DOM (up to 5 parents) to find a[href*="/shows/"]
      - If found, add {title, url} to map (deduplicated by title)
   c. Fallback: scan remaining a[href*="/shows/"] links
      - Walk up to find nearby <h2>/<h3> for title
   d. Return array of {title, url}
5. Close page
6. Sort alphabetically in Hebrew and return
```

#### `scrapeShowDetails(browser, url)` — Pseudocode

```
1. Open new page, setup request interception with { allowImages: true }
2. Navigate to url, wait for networkidle2
3. Wait for selector: h1
4. page.evaluate():
   a. Extract title from <h1>, normalize whitespace
   b. Duration: always null (no duration info on this theatre's pages)
   c. Description:
      - Get body.innerText
      - Find h1 title position
      - Slice text after title
      - Find earliest stop marker ("יוצרים:", "שתפו חברים", "תאריכי הצגות", "משתתפים:")
      - Clean up: remove photo credits, promotional lines, collapse newlines
   d. Return { title, durationMinutes: null, description }
5. Extract image via page.evaluate(extractImageFromPage)
6. Fix double protocol on imageUrl
7. Close page and return { title, durationMinutes, description, imageUrl }
```

### File 2: `scripts/find-missing-hebrew-theatre-shows.mjs`

Thin entry-point script (~15 lines):

```js
#!/usr/bin/env node
import { runPipeline } from "./lib/pipeline.mjs";
import { launchBrowser } from "./lib/browser.mjs";
import {
  HEBREW_THEATRE,
  fetchShows,
  scrapeShowDetails,
} from "./lib/hebrew-theatre.mjs";

await runPipeline({
  theatreId: "hebrew-theatre",
  theatreName: HEBREW_THEATRE,
  theatreConst: HEBREW_THEATRE,
  fetchListing: fetchShows,
  scrapeDetails: scrapeShowDetails,
  titlePreference: "listing-first",
  launchBrowser,
});
```

## 4. Comparison with Existing Scrapers

| Dimension             | Hebrew Theatre (planned)                                    | Habima                        | Lessin                        |
| --------------------- | ----------------------------------------------------------- | ----------------------------- | ----------------------------- |
| **Module**            | `scripts/lib/hebrew-theatre.mjs`                            | `scripts/lib/habima.mjs`      | `scripts/lib/lessin.mjs`      |
| **Theatre name**      | `"התיאטרון העברי"`                                          | `"תיאטרון הבימה"`             | `"תיאטרון בית ליסין"`         |
| **Listing URL**       | `teatron.org.il/shows/`                                     | `habima.co.il/רפרטואר/`       | `lessin.co.il/`               |
| **Link selector**     | `a[href*="/shows/"]`                                        | `a[href*="/shows/"]`          | `a[href*="/shows/"]`          |
| **Listing pattern**   | Pattern B (h2/h3 + parent walk)                             | Pattern B (h3 + parent walk)  | Pattern B (h3 + parent walk)  |
| **Heading element**   | `<h2>` and `<h3>` (both queried)                            | `<h3>`                        | `<h3>`                        |
| **Title cleanup**     | None needed                                                 | Strip `הצגה אורחת` prefix     | Strip suffix patterns         |
| **Duration parsing**  | Always `null` (no duration on pages)                        | Standard regex: `X דקות`      | Custom Hebrew textual parser  |
| **Description start** | No marker — uses h1 position (like Habima)                  | No marker — uses h1 position  | `"על ההצגה"` marker           |
| **Description stops** | `"יוצרים:"`, `"שתפו חברים"`, `"תאריכי הצגות"`, `"משתתפים:"` | 6 stop markers                | 4 stop markers                |
| **Image loading**     | Allowed (`allowImages: true`)                               | Allowed (`allowImages: true`) | Allowed (`allowImages: true`) |
| **Image extraction**  | `extractImageFromPage` passed directly to `page.evaluate()` | Same                          | Same                          |
| **Title preference**  | `"listing-first"`                                           | `"listing-first"`             | `"listing-first"`             |

## 5. Potential Risks & Edge Cases

1. **No duration data**: This theatre doesn't display duration on any detail page checked. The pipeline's review UI allows manual entry, so this is acceptable but all shows will initially have `null` duration.

2. **`<h2>` vs `<h3>` uncertainty**: The fetch tool normalizes heading levels, so we can't confirm the exact HTML tag. The scraper queries both `h2` and `h3` (`document.querySelectorAll("h2, h3")`) to handle either case.

3. **Duplicate show cards**: The listing page appears to render each show card twice in the HTML (possibly for responsive/mobile layout). The `Map`-based deduplication by title handles this.

4. **No "על ההצגה" marker**: Description extraction relies on h1 position, which is less precise than a dedicated marker. The stop markers ("יוצרים:", "שתפו חברים", "תאריכי הצגות") should correctly bound the description.

5. **Credits in description**: The "יוצרים:" section contains creator/cast credits in a compact format (`מאת: ... | בימוי: ... | תפאורה: ...`). The stop marker "יוצרים:" should exclude this from the description.

6. **Touring theatre**: התיאטרון העברי is based in Haifa but tours nationally (shows at multiple venues). This doesn't affect scraping but is worth noting.

7. **Short tagline duplication**: The listing page shows a short tagline that often repeats as the first line of the detail page description. The AI summarization step will handle this naturally.

## 6. Testing Plan

1. **Run the scraper**: `node scripts/find-missing-hebrew-theatre-shows.mjs`
2. **Verify listing**: Confirm ~20+ shows are found, no non-show entries included
3. **Check titles**: All titles clean, no duplicates, proper Hebrew sorting
4. **Check descriptions**: Each show has meaningful description text, no credits/dates leaked in
5. **Check images**: Most shows should have an image URL resolved
6. **Review in interactive UI**: Validate AI summaries and genre classifications
7. **Generate migration**: Confirm valid SQL is produced
8. **Apply migration**: `npx prisma migrate deploy`

## 7. Implementation Checklist

- [ ] Create `scripts/lib/hebrew-theatre.mjs` with constants, `fetchShows()`, and `scrapeShowDetails()`
- [ ] Create `scripts/find-missing-hebrew-theatre-shows.mjs` entry point
- [ ] Run scraper and verify listing count
- [ ] Verify titles are clean (no duplicates, no non-show entries)
- [ ] Verify descriptions extract correctly (bounded by stop markers)
- [ ] Verify images are found for most shows
- [ ] Review and approve shows in interactive UI
- [ ] Generate and apply migration
- [ ] Commit: migration file + scraper module + entry point
