# Plan: Add Beit Lessin Theatre Scraper

**TL;DR** — Create a new Beit Lessin scraper module ([scripts/lib/lessin.mjs](scripts/lib/lessin.mjs)) and a thin entry-point script ([scripts/find-missing-lessin-shows.mjs](scripts/find-missing-lessin-shows.mjs)), mirroring the existing Cameri/Habima pattern. The scraper fetches the show listing from the **main page** (`lessin.co.il`), which has show cards as `h3` titles with `a[href*="/shows/"]` links (same pattern as Habima's repertoire), then scrapes individual show detail pages. The main Lessin-specific challenge is **duration parsing** — Beit Lessin uses textual Hebrew durations ("כשעה וחצי", "כשעה וחמישים") rather than the "X דקות" format used by Cameri and Habima. Everything else plugs directly into the existing `runPipeline()` infrastructure.

**Steps**

1. **Create [scripts/lib/lessin.mjs](scripts/lib/lessin.mjs)** — New scraper module following the exact structure of [scripts/lib/habima.mjs](scripts/lib/habima.mjs):
   - **Constants:** `LESSIN_THEATRE = "תיאטרון בית ליסין"`, `LESSIN_BASE = "https://www.lessin.co.il"`, `SHOWS_URL = "https://www.lessin.co.il/"` (the main page serves as the shows listing)

   - **`fetchShows(browser)`** — Listing scraper:
     - Navigate to the main page (`lessin.co.il`)
     - Wait for `a[href*="/shows/"]` selector
     - Find all `h3` headings, walk up to parent to find the nearest `a[href*="/shows/"]` link (same strategy as Habima's `fetchRepertoire`)
     - Use the `h3` text as the title, the link href as the URL
     - Deduplicate by title, sort alphabetically in Hebrew
     - **Title cleanup:** strip suffixes like `(הצגות אחרונות)`, `(הצגה אורחת)` — regex: `/\s*\((?:הצגות אחרונות|הצגה אורחת)\)\s*$/`
     - Include a fallback path: also scan for any `a[href*="/shows/"]` links not yet collected, similar to Habima's fallback logic

   - **`scrapeShowDetails(browser, url)`** — Detail page scraper:
     - Navigate to show URL, wait for `h1`
     - Allow images in request interception (`allowImages: true`) so `extractImageFromPage` can find og:image / hero image (the hero image is an `img` with src like `wp-content/uploads/...`)
     - **Title:** Extract from `h1`, strip `(הצגות אחרונות)` / `(הצגה אורחת)` suffixes, collapse whitespace
     - **Duration:** Custom parsing function `parseLessinDuration(text)` that handles Hebrew textual durations:
       - First try the standard `משך ההצגה: X דקות` regex (in case some shows use it)
       - Then match `משך ההצגה:` and parse textual forms like:
         - `כשעה וחצי` → 90
         - `כשעה וחמישים` → 110
         - `כשעתיים` → 120
         - `שעה ו-X דקות` → 60 + X
         - `כשעה ורבע` → 75
         - General pattern: recognize שעה/שעתיים as the hour base, then add textual minutes (חצי→30, רבע→15, עשרים→20, חמישים→50, etc.)
       - If no duration can be parsed, return `null` (the interactive review step allows manual editing)
     - **Description:** Use `על ההצגה` as start marker (same as Cameri). Stop markers: `יוצרים ושחקנים`, `משך ההצגה`, `הביקורות משבחות`, `מועמדויות`. Clean up photo credits (`*צילום:...`, `צילום פוסטר:...`), asterisked lines, "לא תותר הכניסה למאחרים", "מוצג בהסדר עם...", "50 הצגות בלבד" promotional lines, and collapse excess newlines.
     - **Image:** Use shared `extractImageFromPage` (handles og:image, twitter:image, CDN images, visible large `img`, hero background). Run `fixDoubleProtocol()` on the result.
     - Return `{ title, durationMinutes, description, imageUrl }`

2. **Create [scripts/find-missing-lessin-shows.mjs](scripts/find-missing-lessin-shows.mjs)** — Thin wrapper script, same structure as [scripts/find-missing-habima-shows.mjs](scripts/find-missing-habima-shows.mjs):
   - Import `runPipeline` from `./lib/pipeline.mjs`
   - Import `launchBrowser` from `./lib/browser.mjs`
   - Import `LESSIN_THEATRE`, `fetchShows`, `scrapeShowDetails` from `./lib/lessin.mjs`
   - Call `runPipeline()` with config:
     - `theatreId: "lessin"`
     - `theatreName: LESSIN_THEATRE` (`"תיאטרון בית ליסין"`)
     - `theatreConst: LESSIN_THEATRE`
     - `fetchListing: fetchShows`
     - `scrapeDetails: scrapeShowDetails`
     - `titlePreference: "listing-first"` (the main page listing titles are cleaner since they're short `h3` texts, while detail page `h1` titles may have extra annotations)
     - `launchBrowser`

3. **No changes needed to [scripts/lib/pipeline.mjs](scripts/lib/pipeline.mjs)** — The pipeline is already fully generic and theatre-agnostic. It accepts the config object and orchestrates everything: DB check, listing scrape, detail scrape, image download, AI description/genre processing, interactive review server, and migration generation.

**Verification**

- Run `node scripts/find-missing-lessin-shows.mjs` — it should:
  1. Connect to the database and fetch existing titles for "תיאטרון בית ליסין"
  2. Scrape the main page, find ~20 shows with `/shows/` URLs
  3. Filter to only missing shows
  4. Scrape each show's detail page (title, duration, description, image)
  5. Download images as `.webp` to `public/`
  6. Process descriptions and classify genres via AI
  7. Open the interactive review server on localhost for final editing + migration generation
- Verify the `--json` and `--html` output modes also work
- Spot-check a few shows: confirm titles don't have "(הצגות אחרונות)" suffix, descriptions are clean, durations are parsed correctly (e.g., אמדאוס should be ~110 min, דתילונים ~90 min)

**Decisions**

- **Theatre name:** `"תיאטרון בית ליסין"` for DB consistency with the existing naming pattern
- **Listing source:** Main page (`lessin.co.il`) — it has all show cards with proper `/shows/` links. The schedule page (`/הצגות/`) only has ticket purchase links, not show detail links
- **Title preference:** `"listing-first"` — listing page `h3` titles are cleaner than `h1` titles which may contain promotional suffixes
- **Duration:** Custom Hebrew textual parser (unique to Lessin); falls back to `null` for unrecognized formats, editable in review
- **Exclusions:** None automatic — items like "סיור מאחורי הקלעים" and "ליסין צעיר" will appear in the interactive review for manual decision
