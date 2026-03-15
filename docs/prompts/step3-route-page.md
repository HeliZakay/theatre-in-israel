## Task: Create the `/events` route, page component, and update nav + sitemap

This is step 3 of building the `/events` page. Steps 1-2 are done: `region` is on Venue, and the data layer (`src/lib/data/eventsList.ts`, `src/lib/datePresets.ts`, `src/lib/eventsConstants.ts`) is ready.

Now create the route with URL parsing, metadata, static params, and a **server-rendered page that works without JS**. Also update navigation and sitemap.

### Product context

This is a **schedule view** for discovering upcoming theatre events. Users filter by date preset and region via **URL segments** (not query strings). The page must be useful for SEO — many URL combos are indexed.

**Dynamic H1 rules:**
- Default: "לוח הופעות תיאטרון"
- Region only: "הופעות תיאטרון ב{region}" (e.g., "הופעות תיאטרון במרכז")
- Date only: "הופעות תיאטרון ב{date}" (e.g., "הופעות תיאטרון בסוף השבוע")
- Both: "הופעות תיאטרון ב{date} ב{region}" (e.g., "הופעות תיאטרון בסוף השבוע במרכז")
- City: "הצגות תיאטרון ב{city}" (e.g., "הצגות תיאטרון בתל אביב")

**Subtitle** (always): "מצאו הצגות תיאטרון קרובות לפי תאריך ואזור"

**Filter chips** are `<a>` tags with hrefs to clean URL paths (progressive enhancement — no JS needed). Chips use `role="radiogroup"` / `role="radio"`. Active chip determined by current URL. The component files for chips will be created in step 4; for now, render simple `<a>` tags with appropriate classes.

**Empty states:**
- Filtered, no results: "לא נמצאו הופעות ב{region} ב{date}. יש {count} הופעות ב{nearest region} →"
- No events at all: "אין הופעות קרובות כרגע."

### URL structure

**Route:** `src/app/events/[[...filters]]/page.tsx`

The catch-all `filters` param is an array of 0-2 segments. Parse each segment by checking maps in this order: `DATE_SLUGS` → `REGION_SLUGS` → `CITY_SLUGS` (from `src/lib/eventsConstants.ts`). First match wins.

Valid URL patterns:
- `/events` → defaults (7days, all regions)
- `/events/weekend` → date preset
- `/events/center` → region
- `/events/weekend/center` → date + region
- `/events/tel-aviv` → city

If a segment doesn't match any map → `notFound()`. If two segments match the same category (e.g., two dates) → `notFound()`.

Note: `jerusalem` exists in both `REGION_SLUGS` and `CITY_SLUGS`. Since regions are checked first, `/events/jerusalem` resolves as a region. This is intentional.

### Indexing rules

These combos get `index: true` in robots:

| URL | Index? |
|---|---|
| `/events` | Yes |
| `/events/center`, `/events/north`, `/events/south`, `/events/jerusalem`, `/events/sharon`, `/events/shfela` | Yes |
| `/events/weekend`, `/events/week`, `/events/nextweek` | Yes |
| `/events/today`, `/events/tomorrow` | No |
| `/events/weekend/center`, `/events/week/center`, `/events/weekend/north` | Yes (date+region combos where BOTH are individually indexed) |
| `/events/tel-aviv`, `/events/haifa`, `/events/beer-sheva` | Yes |
| All other combos | No |

Rule of thumb: a combo is indexed if both its date part (or no date = default) and its location part are individually indexed. `today` and `tomorrow` are never indexed. `7days` and `all` as explicit slugs are not indexed (only the default `/events` is).

### Files to create

**`src/app/events/[[...filters]]/page.tsx`** — Server component (no "use client")

Structure:
1. **`parseFilters(filters: string[])`** — pure function, returns `{ datePreset: string, region?: string, city?: string }` or calls `notFound()`. Uses the parse order described above. Export this for testing.

2. **`shouldIndex(datePreset: string, region?: string, city?: string)`** — returns boolean based on the indexing rules above.

3. **`buildPageTitle(datePreset: string, region?: string, city?: string)`** — returns the dynamic H1 string. Uses `DATE_SLUGS` and `REGION_SLUGS` Hebrew labels.

4. **`generateStaticParams()`** — return all indexed URL combos as `{ filters: string[] }` arrays. Include:
   - `{ filters: [] }` (the default `/events`)
   - Each region: `{ filters: ['center'] }`, etc.
   - Indexed date presets: `{ filters: ['weekend'] }`, `{ filters: ['week'] }`, `{ filters: ['nextweek'] }`
   - Each city: `{ filters: ['tel-aviv'] }`, etc.
   - Indexed date+region combos: `{ filters: ['weekend', 'center'] }`, `{ filters: ['weekend', 'north'] }`, `{ filters: ['week', 'center'] }`, etc.

   Use `dynamicParams = true` so non-indexed combos still render on-demand.

5. **`generateMetadata({ params })`** — returns:
   - `title`: dynamic, e.g., "הצגות תיאטרון במרכז | תיאטרון בישראל"
   - `description`: unique per page, include city/region names
   - `robots`: `{ index: shouldIndex(...), follow: true }`
   - `openGraph`: `{ title, description, url: canonical, siteName: SITE_NAME }`
   - `twitter`: `{ card: "summary" }`
   - `alternates`: `{ canonical }` — canonical is always the clean path (e.g., `/events/weekend/center`)

6. **Page component** `EventsPage({ params })`:
   - Await `params`, parse filters
   - Call `getEvents({ datePreset, region, city })` and `getRegionCounts({ datePreset })` in parallel (`Promise.all`)
   - Group events by date (the `date` field from `EventListItem` is an ISO string — group by the date portion)
   - Render:
     - Breadcrumb JSON-LD (use `buildBreadcrumbJsonLd` from `src/lib/seo.ts`): דף הבית > לוח הופעות > [region/city] > [date preset]
     - Event JSON-LD (schema.org ItemList with Event items, cap at 20): use `toAbsoluteUrl`, `getShowImagePath` from existing utils
     - `<h1>` with dynamic title
     - `<p>` subtitle
     - Date preset chips row — `<nav role="radiogroup" aria-label="סינון לפי תאריך">` with `<a role="radio">` for each `DATE_SLUGS` entry. Active chip gets `aria-checked="true"`. Href pattern: build the clean URL from the combination of date+location.
     - Region chips row — same pattern, `aria-label="סינון לפי אזור"`. Show event count badge from `regionCounts`. If a region has 0 events, add `aria-disabled="true"` and `tabIndex={-1}` (keep visible, just disabled). Active region gets `aria-checked="true"`.
     - "נקו סינון" link when any non-default filter is active (links to `/events`)
     - Event list grouped by date with `<h2>` date headers. Date header format: "היום · יום חמישי, 20 במרץ · 4 הופעות" (relative prefix for today/tomorrow only). Use Hebrew locale for date formatting.
     - Each event: time, show title (link to `/shows/{slug}`), theatre + venue + city line, rating or review CTA
     - Empty state if no events

   For the event list rendering, keep it **simple inline JSX** for now — the component extraction happens in step 4. Don't create separate component files yet. Use basic semantic HTML (`<article>`, `<time>`, `<h2>`, etc.) with CSS module classes.

**`src/app/events/[[...filters]]/page.module.css`** — Basic styles

Keep styles minimal but functional:
- RTL-aware layout (the app is RTL)
- Chip styles: inline-flex row, gap, pill shape with border, active state with filled background
- Date headers: sticky with `position: sticky; top: var(--header-offset, 60px)`, solid background, z-index
- Event items: horizontal layout with time on the right (RTL), title+venue in the middle, rating on the left
- Mobile: stack event items vertically, hide thumbnail placeholder
- Use existing CSS custom properties from the project if visible (check `src/app/globals.css` for variables)

### Files to modify

**`src/constants/routes.ts`** — Add:
```ts
EVENTS: "/events",
```
And add a helper:
```ts
export function eventsPath(filters: string[] = []): string {
  return filters.length > 0 ? `${ROUTES.EVENTS}/${filters.join('/')}` : ROUTES.EVENTS;
}
```

**`src/components/Header/DesktopNav.tsx`** — Add "לוח הופעות" nav item between "עמוד הבית" and "כל ההצגות". Use `ROUTES.EVENTS`. The active check should be `pathname.startsWith(ROUTES.EVENTS)` (not exact match, since sub-paths like `/events/center` should also highlight the nav item).

**`src/app/sitemap.ts`** — Add indexed events URLs. Follow the existing pattern:
- `/events` → priority 0.85, changeFrequency "daily"
- Each indexed region/date/city/combo → priority 0.7, changeFrequency "daily"
- `lastModified: now` (same as other routes)

Use the `ROUTES.EVENTS` constant and `eventsPath()` helper.

### Existing patterns to follow

Reference these files for conventions:
- `src/app/shows/[slug]/page.tsx` — `generateStaticParams`, `generateMetadata`, params as Promise, `revalidate = 120`
- `src/app/shows/page.tsx` — searchParams handling, breadcrumb JSON-LD, ItemList JSON-LD
- `src/lib/seo.ts` — `SITE_NAME`, `toAbsoluteUrl`, `toJsonLd`, `buildBreadcrumbJsonLd`, `getShowImagePath` (via `@/utils/getShowImagePath`)
- `src/constants/routes.ts` — route constants pattern

Key conventions:
- `params` is `Promise<{ filters?: string[] }>` — must be awaited
- `export const revalidate = 120`
- `export const dynamicParams = true`
- Import types as `import type { Metadata } from "next"`
- Use `SITE_NAME` from seo.ts in metadata, not hardcoded strings
- Canonical as `alternates: { canonical: path }` in metadata return

### Important constraints
- Do NOT create separate component files (EventCard, EventsList, etc.) — that's step 4
- Do NOT add client-side interactivity ("use client") — the page must work without JS
- Do NOT add FAQ section — that's step 5
- Keep the inline event rendering simple — it will be extracted to components in step 4
- Do NOT install any npm packages
