## Task: Create data layer and date logic for the events page

This is step 2 of building the `/events` page. Step 1 (adding `region` to Venue) is done. Now create the constants, date preset resolver, and data-fetching functions that the page will use.

### Context: product requirements driving this code

The events page is a **schedule view** — users filter by **date preset** and **region** to find upcoming theatre events. Key behaviors:

- **Date presets**: "7 ימים קרובים" (default), "היום", "מחר", "סוף השבוע" (Thu–Sat, Israeli weekend), "השבוע", "השבוע הבא", "הכל"
- **Weekend auto-forward**: if today is after Saturday, "סוף השבוע" should show next Thu–Sat
- **Regions**: center, sharon, shfela, jerusalem, north, south (mapped in `prisma/sync-events.js` CITY_REGION_MAP)
- **City-level filtering**: tel-aviv, haifa, beer-sheva can be filtered individually
- **All dates computed in `Asia/Jerusalem` timezone** — this is critical for correct day boundaries
- **Region chip badges**: the UI needs event counts per region for the active date range, so disabled/empty regions can show "(0)"
- **Sort order**: date ascending, then hour ascending, then venue name

### Existing patterns to follow

The project uses this caching convention (see `src/lib/data/homepage.ts` for reference):
- Private `fetch*` function with the actual Prisma query
- Public `get*` export wrapped in `unstable_cache` with key array, revalidate, and tags
- Imports: `unstable_cache` from `"next/cache"`, `prisma` from `"../prisma"` (relative), types from `"@/types"` (absolute)
- Interfaces exported alongside the functions that return them

The Prisma `Event` model has: `date` (DateTime @db.Date — stored as midnight UTC), `hour` (String like "20:00"), `showId`, `venueId`. The `Venue` model has: `name`, `city`, `region`.

### Files to create

**1. `src/lib/eventsConstants.ts`** — slug maps for URL parsing (used by both data layer and routing)

```ts
export const DATE_SLUGS: Record<string, string> = {
  '7days': '7 ימים קרובים',
  today: 'היום',
  tomorrow: 'מחר',
  weekend: 'סוף השבוע',
  week: 'השבוע',
  nextweek: 'השבוע הבא',
  all: 'הכל',
};

export const REGION_SLUGS: Record<string, string> = {
  center: 'מרכז',
  sharon: 'שרון',
  shfela: 'שפלה',
  jerusalem: 'ירושלים',
  north: 'צפון',
  south: 'דרום',
};

export const CITY_SLUGS: Record<string, string[]> = {
  'tel-aviv': ['תל אביב', 'תל אביב-יפו'],
  haifa: ['חיפה'],
  'beer-sheva': ['באר שבע'],
};

export const DEFAULT_DATE_PRESET = '7days';
```

**2. `src/lib/datePresets.ts`** — pure function to resolve a date preset slug into a `{ from, to }` date range

Function signature: `resolveDatePreset(preset: string, now?: Date): { from: Date; to: Date }`

Requirements:
- `now` defaults to current time, provided for testability
- All day-boundary calculations must use `Asia/Jerusalem` timezone (use `Intl.DateTimeFormat` or manual UTC offset — do NOT add a dependency like `date-fns-tz`)
- `7days`: from today 00:00 to today+6 23:59:59 (Israel time)
- `today`: from today 00:00 to today 23:59:59
- `tomorrow`: from tomorrow 00:00 to tomorrow 23:59:59
- `weekend`: Thu 00:00 to Sat 23:59:59 of this week — BUT if today is after Saturday (i.e., Sunday–Wednesday and the current week's Saturday has passed), auto-forward to next Thu–Sat
- `week`: Monday 00:00 to Saturday 23:59:59 of the current week
- `nextweek`: Monday 00:00 to Saturday 23:59:59 of next week
- `all`: from today 00:00 to a far future date (e.g., 2030-12-31)

Since `Event.date` is `@db.Date` (stored as midnight UTC), the `from` and `to` dates will be used in Prisma `gte`/`lte` comparisons against Date objects. Make sure the returned dates work correctly for this — `from` should be midnight UTC of the start day, `to` should be midnight UTC of the end day (since @db.Date stores only the date part).

**3. `src/lib/data/eventsList.ts`** — data fetching with caching

Export these functions:

**`getEvents({ datePreset?, region?, city? })`** — main query
- Resolve the date preset to a range using `resolveDatePreset`
- Query `prisma.event.findMany` with:
  - `date: { gte: from, lte: to }`
  - Optional `venue: { region }` filter
  - Optional `venue: { city: { in: cities } }` filter (for city slugs like tel-aviv which map to multiple city names)
  - Include: `show` (select: title, slug, theatre, avgRating, reviewCount), `venue` (select: name, city, region)
  - Order by: `[{ date: 'asc' }, { hour: 'asc' }]`
- Wrap in `unstable_cache` with key `["events-list", datePreset, region || city || "all"]`, revalidate 120, tags `["events-list"]`
- Return type should be an array of objects with: `id, date (string), hour, showTitle, showSlug, showTheatre, showAvgRating, showReviewCount, venueName, venueCity`
  - Flatten the nested Prisma result into this flat shape before returning (the component shouldn't need to know about Prisma's nesting)

**`getRegionCounts({ datePreset? })`** — for chip badges
- Resolve date preset to range
- Query event counts grouped by venue region for that date range
- Return `Record<string, number>` mapping region slug to count (e.g., `{ center: 45, north: 12, ... }`)
- Wrap in `unstable_cache` with key `["events-region-counts", datePreset]`, revalidate 120, tags `["events-list"]`

### Files to modify

**`src/types/index.ts`** — add the `Venue` type's `region` field:

The existing `Venue` interface (line 103-108) is missing the `region` field that was added to the schema in step 1. Add `region: string | null;` to it.

Also update the `ShowEvent` interface (line 26-31) — its `venue` object should include `region`:
```ts
venue: { name: string; city: string; address: string | null; region: string | null };
```

### Important constraints
- Do NOT create any components or page files
- Do NOT modify `prisma/schema.prisma` or `prisma/sync-events.js`
- Do NOT add any npm dependencies
- Follow the existing code style (see `src/lib/data/homepage.ts` for reference)
- Keep the date logic timezone-safe using `Asia/Jerusalem` — this is the most important correctness requirement
