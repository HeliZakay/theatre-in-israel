# Cameri Scraper Fix Plan

## Summary

Two bugs in `scripts/lib/cameri.mjs` cause the `find-all-missing-shows` / `find-missing-cameri-shows` scrapers to:

1. **Show false-positive "missing shows"** — navigation/listing pages are incorrectly detected as shows (e.g. "עברית", "רפרטואר ההצגות", "English (אנגלית)", "Your browser does not support the video tag.")
2. **Fail to extract any details** for real shows (like אשכבה) — duration, description, cast, and image are all empty because the `page.evaluate()` call crashes with `extractImage is not a function`

Both issues were observed on http://localhost:3456/ after running `npm run shows:find-all`.

---

## Bug 1: `extractImage is not a function` — All Show Details Missing

### Root Cause

In `scrapeShowDetails()` at **cameri.mjs lines 146–220**, `extractImageFromPage` is passed as a **serialized argument** to `page.evaluate()`:

```javascript
// cameri.mjs lines 146–220 (BUGGY)
const data = await page.evaluate((extractImage) => {
  // ... title, duration, description, cast extraction ...
  const imageUrl = extractImage(); // ← CRASHES HERE
  return { title, durationRaw, description, imageUrl, cast };
}, extractImageFromPage); // ← passed as serialized arg
```

**The problem**: Puppeteer's `page.evaluate()` serializes arguments using `JSON.stringify`. Functions **cannot be serialized** — they become `undefined` in the browser context. So `extractImage` is `undefined`, and calling `extractImage()` throws `"extractImage is not a function"`.

Because this error happens **inside** the single `page.evaluate()` call, the entire call fails — **not just the image**, but also title, duration, description, and cast are all lost. The error is caught by the pipeline's try/catch, and the show is stored with all fields as `null` plus the error message.

### How Other Scrapers Do It (Correctly)

Every other theatre scraper (Habima, Beer Sheva, Gesher, Tmuna, Tzavta, Khan, etc.) uses **two separate** `page.evaluate()` calls:

```javascript
// habima.mjs lines 291–304 (CORRECT pattern)
const data = await page.evaluate(() => {
  // extract title, duration, description, cast — NO image
  return { title, durationMinutes, description, cast };
});

// extractImageFromPage must be passed as the pageFunction (not as a
// serialised argument) because Puppeteer cannot serialise functions.
const imageUrl = await page.evaluate(extractImageFromPage);

if (imageUrl) {
  data.imageUrl = fixDoubleProtocol(imageUrl);
} else {
  data.imageUrl = null;
}
```

The comment in habima.mjs and beer-sheva.mjs explicitly explains why:

> _"extractImageFromPage must be passed as the pageFunction (not as a serialised argument) because Puppeteer cannot serialise functions."_

When a function is the first argument to `page.evaluate(fn)`, Puppeteer calls `fn.toString()` and sends the source code to the browser — this works. When it's a subsequent argument (`page.evaluate(fn, extractImageFromPage)`), it tries to JSON-serialize it — this fails silently (becomes `undefined`).

### Fix

Split `scrapeShowDetails()` into two `page.evaluate()` calls, matching the Habima/Beer Sheva pattern:

**Replace lines 146–220** of `cameri.mjs`:

```javascript
// ── FIRST evaluate: title, duration, description, cast ──
const data = await page.evaluate(() => {
  // ── Title ──
  const h1 = document.querySelector("h1");
  let title = h1 ? h1.textContent.trim() : "";
  title = title.replace(/^חדש\s+/, "");

  // ── Duration ──
  let durationRaw = null;
  const meshech = document.querySelector("p.meshech b");
  if (meshech) {
    durationRaw = meshech.textContent.trim();
  }
  if (!durationRaw) {
    const body = document.body.innerText;
    const m = body.match(/משך ההצגה:\s*(.+)/);
    if (m) durationRaw = m[1].split("\n")[0].trim();
  }

  // ── Description ──
  let description = "";
  const aboutContent = document.querySelector("#about .show-content");
  if (aboutContent) {
    description = aboutContent.innerText.trim();
  }
  if (!description) {
    const body = document.body.innerText;
    const aboutMarker = "על ההצגה";
    const stopMarkers = [
      "צוות אמנותי",
      "בהשתתפות",
      "חשבנו שתאהבו גם",
      "תאריכים ורכישת כרטיסים",
      "משך ההצגה",
    ];
    const aboutIdx = body.indexOf(aboutMarker);
    if (aboutIdx !== -1) {
      let rest = body.slice(aboutIdx + aboutMarker.length).trim();
      let endIdx = rest.length;
      for (const marker of stopMarkers) {
        const idx = rest.indexOf(marker);
        if (idx !== -1 && idx < endIdx) endIdx = idx;
      }
      description = rest.slice(0, endIdx).trim();
    }
  }
  description = description
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\*צילום:.*$/gm, "")
    .replace(/\*פוסטר.*$/gm, "")
    .replace(/^\*[^\n]*$/gm, "")
    .replace(/צפייה בתוכנייה/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // ── Cast ──
  let cast = null;
  const actorNames = [];
  document.querySelectorAll("#actors p.actor-name").forEach((el) => {
    const name = el.textContent.trim();
    if (name) actorNames.push(name);
  });
  document
    .querySelectorAll("section.actors.company p.actor-name")
    .forEach((el) => {
      const name = el.textContent.trim();
      if (name) actorNames.push(name);
    });
  const doublesEl = document.querySelector("#actors p.doubles");
  let doublesText = "";
  if (doublesEl) doublesText = doublesEl.textContent.trim();
  if (actorNames.length > 0) {
    cast = [...new Set(actorNames)].join(", ");
    if (doublesText) cast += ` (${doublesText})`;
  }

  return { title, durationRaw, description, cast };
});

// ── SECOND evaluate: image (separate call — Puppeteer can't serialise functions as args) ──
const imageUrl = await page.evaluate(extractImageFromPage);

if (imageUrl) {
  data.imageUrl = fixDoubleProtocol(imageUrl);
} else {
  data.imageUrl = null;
}
```

Then fix the return to use `data.imageUrl`:

```javascript
// Parse duration outside browser context
let durationMinutes = parseLessinDuration(data.durationRaw);
if (durationMinutes == null && data.durationRaw) {
  const numMatch = data.durationRaw.match(/(\d+)\s*דקות/);
  if (numMatch) durationMinutes = parseInt(numMatch[1], 10);
}

await page.close();
return {
  title: data.title,
  durationMinutes,
  description: data.description,
  imageUrl: data.imageUrl,
  cast: data.cast,
};
```

---

## Bug 2: False-Positive Shows in `fetchSchedule()`

### Root Cause

The URL filtering logic at **cameri.mjs lines 91–93** has multiple blind spots:

```javascript
// CURRENT (buggy) filter
const isShow =
  (href.includes(repPath) || href.includes(repPathEnc)) &&
  href.replace(repPath, "").replace(repPathEnc, "").replace(/\//g, "").length >
    0;
```

**Problem 1: Absolute URLs leak through.** When `href` is an absolute URL like `https://www.cameri.co.il/הצגות_הקאמרי/`, after stripping the repertoire path and slashes, you're left with `https:www.cameri.co.il` — which has length > 0, so it passes the filter. This means the **repertoire listing page itself** gets through as a "show".

**Problem 2: English locale URLs.** The Cameri site has `/en/הצגות_הקאמרי/` links that contain the repertoire path but point to the English listing page, not a show.

**Problem 3: No content-based filtering.** Links inside `<video>` fallback text (e.g. "Your browser does not support the video tag.") are picked up if they happen to contain a matching href.

### What Gets Through (False Positives Observed)

| Title                                        | URL                        | Why it's wrong                                                   |
| -------------------------------------------- | -------------------------- | ---------------------------------------------------------------- |
| אשכבה                                        | `.../הצגות_הקאמרי/אשכבה/`  | This one IS a real show (but its details fail due to Bug 1)      |
| עברית                                        | `.../הצגות_הקאמרי/`        | The Hebrew listing page itself — absolute URL defeats the filter |
| רפרטואר ההצגות                               | `.../הצגות_הקאמרי/`        | Footer navigation link to the repertoire page                    |
| English (אנגלית)                             | `.../en/הצגות_הקאמרי/`     | English locale listing page                                      |
| Your browser does not support the video tag. | `.../הצגות_הקאמרי/השותפה/` | Text from a `<video>` fallback element that wraps a show link    |

### Fix

Replace the URL filtering logic inside `page.evaluate()` (lines 89–94) with a pathname-based approach:

```javascript
for (const a of allLinks) {
  const href = a.getAttribute("href") || "";

  // Must contain the repertoire path segment.
  if (!href.includes(repPath) && !href.includes(repPathEnc)) continue;

  // Extract only the pathname (handles both absolute and relative URLs).
  let pathname;
  try {
    pathname = new URL(href, base).pathname;
  } catch {
    continue;
  }

  // Skip English-locale pages.
  if (pathname.startsWith("/en/")) continue;

  // Must be a sub-page of the repertoire (not the listing page itself).
  // Strip the repertoire path prefix and check a sub-slug remains.
  const subSlug = pathname
    .replace(repPath, "")
    .replace(repPathEnc, "")
    .replace(/\//g, "");
  if (!subSlug) continue;

  // Skip links inside <video> fallback text.
  if (a.closest("video")) continue;

  // Build absolute URL.
  const url = href.startsWith("http") ? href : `${base}${href}`;

  // Extract title from the first line of the card's text.
  const rawText = a.textContent.trim();
  if (!rawText) continue;

  // Skip video fallback text patterns.
  if (rawText.includes("browser") && rawText.includes("support")) continue;

  let title = rawText.split("\n")[0].trim();
  // ... rest of title cleaning stays the same ...
}
```

### Key Changes

1. **`new URL(href, base).pathname`** — normalizes both absolute and relative URLs to just the path, so `https://www.cameri.co.il/הצגות_הקאמרי/` correctly gives `/הצגות_הקאמרי/` with an empty sub-slug
2. **`pathname.startsWith("/en/")`** — filters out English-locale pages
3. **`a.closest("video")`** — skips links nested inside `<video>` elements
4. **Text pattern skip** — catches "Your browser does not support the video tag." even when not inside a `<video>` element

---

## Selector Verification (from Live Cameri Site)

Checked the [אשכבה detail page](https://www.cameri.co.il/הצגות_הקאמרי/אשכבה/) on March 11, 2026:

| Field            | Expected Selector           | Found on Page?        | Notes                                                                                                                                                       |
| ---------------- | --------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Title            | `h1`                        | ✅                    | "אשכבה"                                                                                                                                                     |
| Duration         | `p.meshech b`               | ⚠️ Needs verification | Text "משך ההצגה: שעה וחצי" is present — the fallback regex `body.match(/משך ההצגה:\s*(.+)/)` will catch it if `p.meshech b` doesn't match the new WP layout |
| Description      | `#about .show-content`      | ⚠️ Needs verification | "על ההצגה" section with full synopsis is present — fallback text-marker approach will catch it                                                              |
| Cast             | `#actors p.actor-name`      | ⚠️ Needs verification | Cast section shows actors as links with images (אסתי קוסוביצקי, רמי ברוך, etc.) — selector might need updating if the new layout uses different markup      |
| Image            | `meta[property="og:image"]` | ✅                    | og:image should be set (standard WordPress); also has a large hero image                                                                                    |
| Alternating cast | `#actors p.doubles`         | ✅                    | "בהצגה זו השחקנים.ות ... משתתפים.ות לסירוגין."                                                                                                              |

**Note**: If `p.meshech b` or `#about .show-content` or `#actors p.actor-name` don't match the current DOM structure, the scraper has text-marker fallbacks that should work. After fixing Bug 1, run the scraper and check if fields are populated. If specific selectors need updating, inspect the page with DevTools.

---

## Files to Modify

Only one file needs changes: **`scripts/lib/cameri.mjs`**

### Change 1: `scrapeShowDetails()` — Split `page.evaluate()` (lines 146–242)

- Remove `extractImageFromPage` as an argument to `page.evaluate()`
- Remove `const imageUrl = extractImage()` from inside the callback
- Remove `imageUrl` from the return object inside the callback
- Add a second `page.evaluate(extractImageFromPage)` call after the first
- Apply `fixDoubleProtocol()` to the result
- Adjust the duration parsing and final return to use `data.imageUrl`

### Change 2: `fetchSchedule()` — Fix URL filtering (lines 89–112)

- Use `new URL(href, base).pathname` to normalize URLs before checking
- Add `/en/` path prefix exclusion
- Add `a.closest("video")` check
- Add "browser"/"support" text pattern exclusion

---

## Testing

After applying fixes, run:

```bash
npm run shows:find-all -- --theatres cameri
```

### Expected Results

1. **No false positives**: Should not see "עברית", "רפרטואר ההצגות", "English (אנגלית)", or "Your browser does not support the video tag." in the output
2. **אשכבה has full details**: title, duration (90 / שעה וחצי), description (the synopsis about מוות, two elders, etc.), cast (אסתי קוסוביצקי, רמי ברוך, etc.), image URL
3. **No `extractImage is not a function` errors** for any show
4. **Show count**: The Cameri repertoire page has ~30 shows. Filter against DB should leave only genuinely missing ones.

### Quick Smoke Test

You can also test just the scraper output without the full pipeline:

```bash
node -e "
import { launchBrowser, fetchSchedule } from './scripts/lib/cameri.mjs';
const b = await launchBrowser();
const shows = await fetchSchedule(b);
console.log(JSON.stringify(shows, null, 2));
await b.close();
"
```

Check that the returned array only contains real show titles and URLs, no listing pages.

---

## Reference: Correct Pattern Used by Other Scrapers

These files all use the correct two-call pattern and can serve as reference:

- `scripts/lib/habima.mjs` — lines 291–307
- `scripts/lib/beer-sheva.mjs` — lines 226–241
- `scripts/lib/gesher.mjs` — look for `page.evaluate(extractImageFromPage)`
- `scripts/lib/tmuna.mjs` — look for `page.evaluate(extractImageFromPage)`
- `scripts/lib/tzavta.mjs` — look for `page.evaluate(extractImageFromPage)`
- `scripts/lib/hakahn.mjs` — look for `page.evaluate(extractImageFromPage)`

All have the same comment: _"extractImageFromPage must be passed as the pageFunction (not as a serialised argument) because Puppeteer cannot serialise functions."_
