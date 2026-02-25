# Scraper Improvements Plan

> Comprehensive plan for fixing AI resilience, adding validation, and reducing API usage in the theatre scraper scripts. Split into 3 independent implementation tasks.

## Root Cause

When running `node scripts/find-missing-habima-shows.mjs`, the GitHub Models API (gpt-4o-mini at `models.inference.ai.azure.com`) hit a **429 rate limit** (150 requests/day). This caused:

- **Summaries**: `processDescription` was called 12 times (1 per show). When 429 hit, the bare `catch {}` silently returned `{ description: rawDescription, summary: "" }` — raw description preserved but summary lost, with **zero logging**.
- **Genres**: `classifyGenres` (1 batch call) also hit 429 — logged a warning but genres remained `[]`.
- **Descriptions**: Were correctly scraped and shown as raw (uncleaned) text in the UI.

The Cameri and Habima scripts are **~95% identical** in AI/UI/migration code. **All changes must be applied to both files.**

---

## Architecture Overview

```
Scripts:
  scripts/find-missing-habima-shows.mjs  (944 lines)
  scripts/find-missing-cameri-shows.mjs  (942 lines)

Library files (NOT modified by this plan):
  scripts/lib/habima.mjs   — Habima scraping (fetchRepertoire, scrapeShowDetails)
  scripts/lib/cameri.mjs   — Cameri scraping (fetchSchedule, scrapeShowDetails)
  scripts/lib/browser.mjs  — Puppeteer helpers
  scripts/lib/db.mjs       — normalise(), fetchExistingTitles()
  scripts/lib/slug.mjs     — generateSlug()
  scripts/lib/image.mjs    — downloadAndConvert()
  scripts/lib/cli.mjs      — green(), red()

Prisma schema (reference only, NOT modified):
  prisma/schema.prisma
```

### Key functions in each scraper script (both are nearly identical):

| Function                                              | Lines    | Purpose                                                  |
| ----------------------------------------------------- | -------- | -------------------------------------------------------- |
| `createAIClient()`                                    | ~434-438 | Returns OpenAI client or null if no GITHUB_TOKEN         |
| `processDescription(aiClient, title, rawDescription)` | ~440-490 | Per-show AI call: cleans description + generates summary |
| `classifyGenres(aiClient, results)`                   | ~491-555 | Batch AI call: assigns genres to all shows at once       |
| `generateMigrationSQL(shows)`                         | ~562-640 | Generates idempotent SQL INSERT statements               |
| `writeMigrationFile(sql)`                             | ~642-652 | Writes migration file to prisma/migrations/              |
| `generateHtml(results)`                               | ~82-430  | Generates the interactive browser UI HTML                |
| `startServer(results)`                                | ~670-790 | HTTP server serving UI + POST /api/generate-migration    |
| Main flow                                             | ~796-944 | Scrape → AI process → output                             |

### Current flow (N+1 API calls):

```
for each show (N iterations):
  1. scrapeShowDetails(browser, url)     → raw data
  2. processDescription(ai, title, raw)  → 1 API call per show
  3. downloadAndConvert(title, imageUrl)
  4. push to results[]

after loop:
  5. classifyGenres(ai, results)         → 1 API call for all shows
  6. output (server/json/html)
```

Total: N+1 API calls (12 shows = 13 calls).

### Differences between Habima and Cameri scripts:

| Aspect             | Habima                                          | Cameri                                           |
| ------------------ | ----------------------------------------------- | ------------------------------------------------ |
| Import source      | `./lib/habima.mjs`                              | `./lib/cameri.mjs`                               |
| Listing function   | `fetchRepertoire`                               | `fetchSchedule`                                  |
| Theatre constant   | `HABIMA_THEATRE` ("תיאטרון הבימה")              | `CAMERI_THEATRE` ("תיאטרון הקאמרי")              |
| Title preference   | `title \|\| details.title` (prefers repertoire) | `details.title \|\| title` (prefers detail page) |
| HTML title/heading | "תיאטרון הבימה"                                 | "תיאטרון הקאמרי"                                 |
| Migration dir name | `${ts}_add_habima_shows`                        | `${ts}_add_cameri_shows`                         |
| Output file        | `missing-habima-shows.html`                     | `missing-cameri-shows.html`                      |

**All AI, UI, validation, and SQL logic is character-for-character identical.**

---

## Database Constraints (from prisma/schema.prisma)

```prisma
model Show {
  id              Int         @id @default(autoincrement())
  title           String                    // NOT NULL, no default
  slug            String      @unique       // NOT NULL, unique
  theatre         String                    // NOT NULL, no default
  durationMinutes Int                       // NOT NULL, no default
  summary         String                    // NOT NULL, no default
  description     String?                   // nullable — OK to be null
  avgRating       Float?                    // not in form
  reviewCount     Int         @default(0)   // not in form
  genres          ShowGenre[]               // relation
}

model Genre {
  id    Int         @id @default(autoincrement())
  name  String      @unique                 // NOT NULL, unique
  shows ShowGenre[]
}

model ShowGenre {
  showId  Int
  genreId Int
  show    Show  @relation(fields: [showId], references: [id])
  genre   Genre @relation(fields: [genreId], references: [id])
  @@id([showId, genreId])
}
```

### Required fields that MUST be validated:

| Field             | Type    | Constraint        | Current handling when empty                          |
| ----------------- | ------- | ----------------- | ---------------------------------------------------- |
| `title`           | String  | NOT NULL          | `escapeSql("")` → `''` — empty string inserted       |
| `slug`            | String  | NOT NULL + UNIQUE | `escapeSql("")` → `''` — only one empty slug allowed |
| `theatre`         | String  | NOT NULL          | `escapeSql("")` → `''` — empty string inserted       |
| `durationMinutes` | Int     | NOT NULL          | `null ?? 0` → `0` — wrong but valid SQL              |
| `summary`         | String  | NOT NULL          | `escapeSql("")` → `''` — empty string inserted       |
| `description`     | String? | nullable          | Correctly handled: falsy → `NULL`                    |

---

## Three Independent Implementation Tasks

> **Important**: These three tasks touch completely different functions/code sections and can be implemented in any order without conflicts.

### Task 1: Batch AI Processing + Error Logging

**Code locations touched** (in both scripts):

- `processDescription` function (~line 440-490) — **replaced entirely**
- Main loop (~line 850-910) — remove per-show AI call
- Post-loop section (~line 913-920) — add batch description call before classifyGenres

**NOT touched**: `generateHtml`, `generateMigrationSQL`, `startServer` POST handler

### Task 2: Browser UI Client-Side Validation

**Code locations touched** (in both scripts):

- `generateHtml` function (~line 82-430) — add CSS class + JS validation logic in `<script>` block

**NOT touched**: `processDescription`, main loop, `generateMigrationSQL`, `startServer`

### Task 3: Server-Side Migration SQL Safety

**Code locations touched** (in both scripts):

- `generateMigrationSQL` function (~line 562-640) — add field validation before SQL generation
- `startServer` POST handler (~line 730-750) — add per-show validation before calling generateMigrationSQL

**NOT touched**: `processDescription`, main loop, `generateHtml`

---

## Task 1: Batch AI Processing + Error Logging

### Goal

Replace the per-show `processDescription` function (N API calls) with a batched `processDescriptions` function (1-2 API calls), and add error logging so AI failures are visible in terminal output.

### Current `processDescription` function (identical in both scripts, ~line 440-490):

```js
async function processDescription(aiClient, title, rawDescription) {
  const fallback = { description: rawDescription || null, summary: "" };
  if (!aiClient || !rawDescription) return fallback;

  try {
    const response = await aiClient.chat.completions.create({
      model: AI_MODEL,
      temperature: 0.4,
      max_tokens: 700,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "אתה עורך תיאורי הצגות תיאטרון בעברית. עליך לבצע שתי משימות:",
            "",
            "1. ניקוי תיאור: קיבלת טקסט גולמי שנגרד מאתר אינטרנט ועלול להכיל רעשים.",
            "הסר את כל מה שאינו חלק מתיאור העלילה והתוכן האמנותי של ההצגה:",
            "רשימות משתתפים, שחקנים, יוצרים, צוות, קרדיטים, צילום, עיצוב,",
            "מספרי טלפון, כתובות, מידע על הנגשה, הפקה, תמיכה, פרסים,",
            "הפניות לאתרים, הערות שוליים, וכל טקסט טכני או שיווקי.",
            "שמור רק את הפסקאות שמתארות את העלילה, הנושא והחוויה התיאטרונית.",
            "",
            "2. כתיבת תקציר: כתוב משפט אחד עד שניים (20-40 מילים) שמתאר את ההצגה בסגנון עיתונאי-שיווקי:",
            "תמציתי, מרתק, כולל את הז'אנר, העלילה המרכזית ואלמנט מושך.",
            "אל תשתמש במירכאות בתקציר.",
            "",
            'החזר JSON בפורמט: { "description": "התיאור הנקי", "summary": "התקציר" }',
            "ללא הערות או הסברים נוספים.",
          ].join("\n"),
        },
        {
          role: "user",
          content: `שם ההצגה: ${title}\n\nטקסט גולמי:\n${rawDescription}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) return fallback;

    const parsed = JSON.parse(content);
    return {
      description: parsed.description?.trim() || rawDescription,
      summary: parsed.summary?.trim() || "",
    };
  } catch {
    return fallback; // ← BUG: silent failure, no logging
  }
}
```

### Current `classifyGenres` function (the batching MODEL — identical in both scripts, ~line 491-555):

```js
async function classifyGenres(aiClient, results) {
  const validResults = results.filter((r) => !r.error);
  if (!aiClient || validResults.length === 0) return;

  const showList = validResults
    .map(
      (r, i) =>
        `${i + 1}. שם: ${r.title}\n   תקציר: ${r.summary || "(אין)"}\n   תיאור: ${(r.description || "(אין)").slice(0, 300)}`,
    )
    .join("\n\n");

  try {
    const response = await aiClient.chat.completions.create({
      model: AI_MODEL,
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "אתה מסווג ז'אנרים של הצגות תיאטרון בעברית.",
            `הז'אנרים הקיימים במערכת הם: ${EXISTING_GENRES.join(", ")}.`,
            "עבור כל הצגה, בחר 1-3 ז'אנרים מתאימים.",
            "העדף תמיד ז'אנרים מהרשימה הקיימת.",
            "צור ז'אנר חדש רק אם אף ז'אנר קיים לא מתאר את ההצגה בצורה סבירה.",
            "ז'אנר חדש צריך להיות מילה אחת או שתיים בעברית, בסגנון דומה לז'אנרים הקיימים.",
            'החזר JSON בפורמט: { "shows": [ { "title": "שם ההצגה", "genres": ["ז\'אנר1", "ז\'אנר2"] } ] }',
            "אל תוסיף הערות או הסברים — רק את ה-JSON.",
          ].join(" "),
        },
        {
          role: "user",
          content: `סווג את הז'אנרים עבור ההצגות הבאות:\n\n${showList}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) return;

    const parsed = JSON.parse(content);
    const genreMap = new Map();

    if (Array.isArray(parsed.shows)) {
      for (const entry of parsed.shows) {
        if (entry.title && Array.isArray(entry.genres)) {
          genreMap.set(normalise(entry.title), entry.genres);
        }
      }
    }

    for (const r of validResults) {
      const genres = genreMap.get(normalise(r.title));
      if (genres && genres.length > 0) {
        r.genre = genres;
      }
    }
  } catch (err) {
    if (!jsonMode) {
      console.warn(`  ⚠️  Genre classification failed: ${err.message}`);
    }
  }
}
```

### Current main loop (~line 851-919 — showing relevant parts):

```js
// 4. Scrape each missing show's detail page
const results = [];

for (let i = 0; i < missingShows.length; i++) {
  const { title, url } = missingShows[i];

  if (!jsonMode) {
    process.stdout.write(`  [${i + 1}/${missingShows.length}]  ${title} … `);
  }

  try {
    const details = await scrapeShowDetails(browser, url);
    // Habima: const showTitle = title || details.title;
    // Cameri:  const showTitle = details.title || title;
    const { description, summary } = await processDescription(
      // ← REMOVE THIS
      aiClient,
      showTitle,
      details.description,
    );

    let imageUrl = details.imageUrl || null;
    let imageStatus = null;
    if (imageUrl) {
      imageStatus = await downloadAndConvert(showTitle, imageUrl);
    }

    results.push({
      title: showTitle,
      slug: generateSlug(showTitle),
      theatre: HABIMA_THEATRE, // or CAMERI_THEATRE
      durationMinutes: details.durationMinutes,
      description: description || null, // ← CHANGE: use raw
      summary, // ← CHANGE: set to ""
      genre: [],
      url,
      imageUrl,
      imageStatus,
    });
    if (!jsonMode) console.log("✅");
  } catch (err) {
    results.push({
      title,
      slug: generateSlug(title),
      theatre: HABIMA_THEATRE,
      durationMinutes: null,
      description: null,
      summary: "",
      genre: [],
      url,
      imageUrl: null,
      imageStatus: null,
      error: err.message,
    });
    if (!jsonMode) console.log(`⚠️  ${err.message}`);
  }

  if (i < missingShows.length - 1) {
    await sleep(POLITE_DELAY);
  }
}

// 4b. Classify genres                                    ← ADD batch description call BEFORE this
if (aiClient && results.some((r) => !r.error)) {
  if (!jsonMode) {
    process.stdout.write("\n  🏷️  Classifying genres… ");
  }
  await classifyGenres(aiClient, results);
  if (!jsonMode) {
    console.log("✅");
  }
}
```

### Changes required:

**A. Replace `processDescription` with a new batched `processDescriptions`:**

- New signature: `async function processDescriptions(aiClient, results)`
- Filter to `validResults = results.filter(r => !r.error && r.rawDescription)`
- Batch in **groups of 7** (balances token limits vs API savings)
- For each batch:
  - Build numbered list: `1. שם: {title}\n   טקסט גולמי:\n{rawDescription truncated to 1500 chars}`
  - Same system prompt but adapted for multi-show response format:
    `'החזר JSON בפורמט: { "shows": [{ "title": "שם", "description": "תיאור נקי", "summary": "תקציר" }] }'`
  - `max_tokens`: `5000` per batch (7 × 700)
  - `temperature`: `0.4` (same as current)
  - Map results back via `normalise(title)` — same pattern as `classifyGenres`
- Error logging in catch: `console.warn(\` ⚠️ Description processing failed: ${err.message}\`)`
- Shows missing from AI response keep their raw description and empty summary
- The `normalise` function is imported from `./lib/db.mjs` and is already used in classifyGenres

**B. Modify the main loop:**

- Remove: `const { description, summary } = await processDescription(aiClient, showTitle, details.description);`
- Add a `rawDescription` field to the result object: `rawDescription: details.description || null`
- Set `description: details.description || null` (raw for now, will be overwritten by batch)
- Set `summary: ""` (will be overwritten by batch)

**C. Add batch call after the loop, before classifyGenres:**

```js
// 4b. Process descriptions (batch)
if (aiClient && results.some((r) => !r.error)) {
  if (!jsonMode) process.stdout.write("\n  📝  Processing descriptions… ");
  await processDescriptions(aiClient, results);
  if (!jsonMode) console.log("✅");
}
```

**D. Clean up rawDescription before output:**

After batch processing and before output (server/json/html), remove the internal field:

```js
for (const r of results) delete r.rawDescription;
```

### API call reduction:

| Shows | Before (per-show + genres) | After (batched + genres)           |
| ----- | -------------------------- | ---------------------------------- |
| 5     | 6 calls                    | 2 calls (1 desc batch + 1 genre)   |
| 12    | 13 calls                   | 3 calls (2 desc batches + 1 genre) |
| 20    | 21 calls                   | 4 calls (3 desc batches + 1 genre) |

### Verification:

- Run with valid `GITHUB_TOKEN` → confirm "📝 Processing descriptions… ✅" appears as a single step
- Check HTML UI has cleaned descriptions + populated summaries
- Run with `GITHUB_TOKEN` unset → confirm "⚠️ GITHUB_TOKEN not set" warning, raw descriptions shown, summaries empty
- Run when rate-limited → confirm "⚠️ Description processing failed: 429…" warning appears

---

## Task 2: Browser UI Client-Side Validation

### Goal

Prevent generating migration SQL with invalid data. Add comprehensive validation in the HTML `<script>` block that runs when the user clicks "Generate Migration".

### Code location:

`generateHtml()` function in both scripts (~line 82-430). Specifically:

- Add CSS class `.field-invalid` in the `<style>` block
- Add `validateShows()` function in the `<script>` block
- Modify `generateMigration()` to call validation before fetch
- Add `input` event listener to clear invalid styling on edit

### Current `getCardData` function (verbatim, identical in both scripts):

```js
function getCardData(idx) {
  var card = document.querySelector(".card[data-index='" + idx + "']");
  var title = card.querySelector(".title-input").value;
  var slug = card.querySelector(".slug-input").value;
  var theatre = card.querySelector(".theatre-input").value;
  var durVal = card.querySelector(".duration-input").value;
  var duration = durVal ? parseInt(durVal, 10) : null;
  var genresStr = card.querySelector(".genres-input").value;
  var genres = genresStr
    ? genresStr
        .split(",")
        .map(function (g) {
          return g.trim();
        })
        .filter(Boolean)
    : [];
  var summary = card.querySelector(".summary-input").value;
  var descEl = card.querySelector(".description-input");
  var description = descEl ? descEl.value || null : null;
  return {
    title: title,
    slug: slug,
    theatre: theatre,
    durationMinutes: duration,
    genre: genres,
    summary: summary,
    description: description,
    url: SHOWS[idx].url,
    imageUrl: SHOWS[idx].imageUrl,
  };
}
```

### Current `generateMigration` function (verbatim, identical in both scripts):

```js
function generateMigration() {
  var indices = getCheckedIndices();
  if (indices.length === 0) return;

  var bulkBtn = document.getElementById("bulk-btn");
  var bulkStatus = document.getElementById("bulk-status");
  bulkBtn.disabled = true;
  bulkBtn.textContent = "יוצר מיגרציה...";
  bulkStatus.innerHTML = "";

  var shows = indices.map(function(idx) { return getCardData(idx); });

  // ← NO VALIDATION — goes straight to fetch
  fetch("/api/generate-migration", { ... })
  // ...
}
```

### Validation rules:

| Field           | CSS Selector      | Rule                                                           | Error message (Hebrew)                         |
| --------------- | ----------------- | -------------------------------------------------------------- | ---------------------------------------------- |
| `title`         | `.title-input`    | `!value.trim()`                                                | `"שם ההצגה חסר"`                               |
| `slug`          | `.slug-input`     | `!value.trim()`                                                | `"slug חסר"`                                   |
| `slug`          | `.slug-input`     | `/\s/.test(value)`                                             | `"slug מכיל רווחים"`                           |
| `slug`          | `.slug-input`     | duplicate within batch                                         | `"slug כפול בקבוצה"`                           |
| `theatre`       | `.theatre-input`  | `!value.trim()`                                                | `"תיאטרון חסר"`                                |
| `duration`      | `.duration-input` | `!value \|\| parseInt(value) <= 0 \|\| isNaN(parseInt(value))` | `"משך חסר או לא תקין (חייב להיות מספר חיובי)"` |
| `summary`       | `.summary-input`  | `!value.trim()`                                                | `"תקציר חסר"`                                  |
| `genres` (each) | `.genres-input`   | after split on `,`, any item that trims to `""`                | `"ז'אנר ריק ברשימה"`                           |

### Implementation:

**A. Add CSS class in `<style>` block (after `.error-text` rule):**

```css
.field-invalid {
  border-color: #f87171 !important;
  box-shadow: 0 0 0 2px rgba(248, 113, 113, 0.3) !important;
}
.validation-errors {
  background: rgba(248, 113, 113, 0.1);
  border: 1px solid #f87171;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem auto;
  max-width: 850px;
  direction: rtl;
}
.validation-errors h3 {
  color: #f87171;
  margin-bottom: 0.5rem;
  font-size: 1rem;
}
.validation-errors ul {
  list-style: none;
  padding: 0;
}
.validation-errors li {
  color: #fca5a5;
  font-size: 0.85rem;
  padding: 0.15rem 0;
}
```

**B. Add `validateShows(indices)` function in `<script>` block:**

Returns `{ valid: boolean, errors: [{ index: number, cardNumber: number, field: string, message: string }] }`

Logic:

1. Clear all `.field-invalid` classes and remove any previous `.validation-errors` div
2. Iterate checked indices, call `getCardData(idx)` for each
3. Check each rule from the table above
4. For duplicate slugs: collect all slugs in the batch, check for duplicates
5. For each error, add `.field-invalid` to the specific input element
6. Return collected errors

**C. Modify `generateMigration()` — add validation call before fetch:**

```js
function generateMigration() {
  var indices = getCheckedIndices();
  if (indices.length === 0) return;

  var validation = validateShows(indices); // ← ADD
  if (!validation.valid) {
    // ← ADD
    showValidationErrors(validation.errors);
    return;
  }

  // ... existing fetch logic unchanged ...
}
```

**D. Add `showValidationErrors(errors)` function:**

- Groups errors by card number
- Inserts a `.validation-errors` div before the cards container
- Lists each error: "הצגה #{cardNumber}: {message}"
- Scrolls to the first invalid card

**E. Add input event listener to clear invalid styling:**

```js
document.addEventListener("input", function (e) {
  if (e.target.classList.contains("field-invalid")) {
    e.target.classList.remove("field-invalid");
  }
  // ... existing slug auto-update logic ...
});
```

### Verification:

- Empty the duration field on one show, clear summary on another → click "Generate Migration" → validation error shown, fields highlighted red, migration NOT created
- Fill in valid data → click again → migration created successfully
- Check duplicate slugs: change two shows to have the same slug → validation catches it

---

## Task 3: Server-Side Migration SQL Safety

### Goal

Defense-in-depth: validate show data in the POST handler and `generateMigrationSQL` before writing SQL. Even if client-side validation is bypassed or has bugs, bad data never reaches the migration file.

### Code locations:

**A. POST handler in `startServer` (~line 730-750, identical in both scripts):**

Current:

```js
if (req.method === "POST" && req.url === "/api/generate-migration") {
  // ...
  const shows = body.shows;

  if (!Array.isArray(shows) || shows.length === 0) {
    res.writeHead(400);
    res.end(JSON.stringify({ error: "Missing or empty 'shows' array" }));
    return;
  }

  const sql = generateMigrationSQL(shows); // ← no per-show validation
  // ...
}
```

**B. `generateMigrationSQL` function (~line 562-640, identical in both scripts):**

Current problematic handling:

```js
const duration = show.durationMinutes ?? 0; // null → 0  (silent bad data)
const summary = escapeSql(show.summary); // "" → "''" (empty string in NOT NULL column)
const title = escapeSql(show.title); // "" → "''" (empty string)
```

### Changes:

**A. Add `validateShowsForMigration(shows)` function (new, before `generateMigrationSQL`):**

```js
function validateShowsForMigration(shows) {
  const errors = [];
  const slugs = new Set();

  for (let i = 0; i < shows.length; i++) {
    const show = shows[i];
    const num = i + 1;

    if (!show.title || !show.title.trim()) {
      errors.push(`Show #${num}: missing title`);
    }
    if (!show.slug || !show.slug.trim()) {
      errors.push(`Show #${num}: missing slug`);
    } else if (/\s/.test(show.slug)) {
      errors.push(`Show #${num}: slug contains whitespace`);
    } else if (slugs.has(show.slug)) {
      errors.push(`Show #${num}: duplicate slug "${show.slug}"`);
    } else {
      slugs.add(show.slug);
    }
    if (!show.theatre || !show.theatre.trim()) {
      errors.push(`Show #${num}: missing theatre`);
    }
    if (
      show.durationMinutes == null ||
      isNaN(show.durationMinutes) ||
      show.durationMinutes <= 0
    ) {
      errors.push(
        `Show #${num} ("${show.title || "?"}"): invalid duration (${show.durationMinutes})`,
      );
    }
    if (!show.summary || !show.summary.trim()) {
      errors.push(`Show #${num} ("${show.title || "?"}"): missing summary`);
    }
  }

  return errors;
}
```

**B. Call it in the POST handler, before `generateMigrationSQL`:**

```js
const validationErrors = validateShowsForMigration(shows);
if (validationErrors.length > 0) {
  res.writeHead(400);
  res.end(
    JSON.stringify({
      error: "Validation failed:\n" + validationErrors.join("\n"),
    }),
  );
  return;
}
```

**C. Harden `generateMigrationSQL` — remove the `?? 0` silent fallback:**

Change:

```js
const duration = show.durationMinutes ?? 0;
```

To:

```js
const duration = show.durationMinutes;
```

Since validation already ran above, `duration` is guaranteed to be a positive integer at this point. Removing `?? 0` ensures that if validation is somehow bypassed, the SQL will have `null` or `NaN` which would cause an obvious SQL error rather than silently inserting `0`.

### Verification:

- Send a POST to `/api/generate-migration` with a show missing a summary → 400 error with clear message
- Send valid data → migration created successfully
- Check that the error message appears in the HTML UI's status area (the existing `.catch` in `generateMigration()` JS function handles this)

---

## Summary

| Task | What it does           | API calls saved    | Files touched        | Functions touched                                       |
| ---- | ---------------------- | ------------------ | -------------------- | ------------------------------------------------------- |
| 1    | Batch AI + logging     | N-1 to N-2 per run | Both scraper scripts | `processDescription` → `processDescriptions`, main loop |
| 2    | Client-side validation | N/A                | Both scraper scripts | `generateHtml` only (CSS + JS)                          |
| 3    | Server-side safety     | N/A                | Both scraper scripts | `generateMigrationSQL`, `startServer` POST handler      |

All three tasks are **completely independent** — they touch different functions and can be implemented in any order.
