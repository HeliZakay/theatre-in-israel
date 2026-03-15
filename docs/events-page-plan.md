# לוח הופעות — Events Page Plan

## Goal

Turn the site into a **discovery tool** ("what should I go see?"). Events page is the top of the funnel — people discover events, click through to show pages, read/write reviews.

**Route:** `/events` | **Nav label:** "לוח הופעות"

---

## Page structure

### Dynamic H1

- Default: **"לוח הופעות תיאטרון"**
- Region only: **"הופעות תיאטרון במרכז"**
- Date only: **"הופעות תיאטרון בסוף השבוע"**
- Both: **"הופעות תיאטרון בסוף השבוע במרכז"**

**Subtitle:** "מצאו הצגות תיאטרון קרובות לפי תאריך ואזור"

---

## Filters

Two rows of single-select chip toggles (same style as genre chips on `/shows`). Show a "נקו סינון" link when any non-default filter is active.

### Date presets

| Chip | Logic |
|---|---|
| 7 ימים קרובים | Next 7 days **(default)** |
| היום | Today only |
| מחר | Tomorrow only |
| סוף השבוע | Thu–Sat (Israeli weekend). Auto-forwards to next weekend if current one has passed |
| השבוע | Mon–Sat of current week |
| השבוע הבא | Mon–Sat of next week |
| הכל | All future events |

### Region chips

| Chip | Cities |
|---|---|
| הכל | No filter **(default)** |
| מרכז | תל אביב, תל אביב-יפו, רמת גן, גבעתיים, חולון, בת ים, פתח תקווה, ראש העין, גני תקווה, איירפורט סיטי |
| שרון | נתניה, כפר סבא, רעננה, הרצליה, רמת השרון, נווה ירק, תל מונד, גלילות, אריאל |
| שפלה | ראשון לציון, רחובות, נס ציונה, יבנה, מזכרת בתיה, גבעת ברנר, קריית שדה התעופה |
| ירושלים | ירושלים, מעלה אדומים, מודיעין |
| צפון | חיפה, עכו, כרמיאל, עפולה, קריית מוצקין, קרית מוצקין, זכרון יעקב, יגור, חוף הכרמל, אור עקיבא, מועצה אזורית עמק יזרעאל |
| דרום | באר שבע, אשדוד, אשקלון |

- Unmapped cities: appear under "הכל" only
- Empty regions: keep chip visible but disabled with count badge, e.g. "דרום (0)"

### Mobile filter UX

Wrap chips into 2 rows instead of horizontal scroll (scroll hides rightmost chips). If still too many, truncate to 4-5 visible + "עוד" overflow.

---

## Event cards

Compact horizontal cards grouped by date with sticky headers. Not poster grid — this is a schedule view.

### Date headers

Format: **"היום · יום חמישי, 20 במרץ · 4 הופעות"** (relative prefix for today/tomorrow only, event count). Sticky with solid background, no stacking — each pushes the previous out.

### Card layout (RTL)

```
┌─────────────────────────────────────────────┐
│  20:00   שיר השירים              [64x64]   │
│          תיאטרון הקאמרי · היכל התרבות · תל אביב │
│          4.2 ★ · 5 ביקורות                  │
└─────────────────────────────────────────────┘
```

- **Time** — bold
- **Show title** — links to show detail page
- **Theatre company + venue name + venue city** — show theatre company (from `Show.theatre`) and venue name (from `Venue.name`) separately, since they differ for touring shows (e.g., "התיאטרון העברי" performing at "היכל התרבות ראשון לציון"). When the venue name already contains the theatre name (e.g. "תיאטרון הקאמרי"), omit the duplicate
- **Rating** — or "ראיתם? כתבו ביקורת →" CTA linking to `/shows/[slug]/review` for unreviewed shows (works for both authenticated and unauthenticated users)
- **Thumbnail** — 64x64, hidden on mobile. On mobile, add subtle right border color to differentiate cards
- **Sort**: time ascending, then venue name
- **Hover**: background tint (not translateY)
- **Spacing**: 24-32px between date groups, 8-12px between cards within a group

---

## Empty states

- **Filtered, no results**: Guide to nearby content — "לא נמצאו הופעות בדרום בסוף השבוע. יש 3 הופעות במרכז →"
- **No events at all**: "אין הופעות קרובות כרגע."

---

## Ticket links

**No ticket links in v1.** Build traffic first, then negotiate affiliate deals. Cards link to show detail pages only.

---

## Homepage section

"הצגות הקרובות" — 5-6 upcoming events after the Hero section, with "לכל ההופעות →" link. Same compact card style as `/events` (not ShowCard style). Select for variety across shows and regions. Ship as fast-follow after `/events` is validated.

---

## SEO

### URL structure — clean paths

`/events/[[...filters]]/page.tsx`. Canonical always points to clean path. Query-string versions redirect or get `noindex`.

**Slug parsing order:** The catch-all `filters` array contains 0-2 segments. Parse each segment by checking against slug maps in this order: `DATE_SLUGS` → `REGION_SLUGS` → `CITY_SLUGS`. First match wins. This means `jerusalem` resolves as a region (not a city), which is correct since it's both a region and a city — the region page already covers all Jerusalem-area events. If no map matches, return 404.

### Indexed pages

| URL | Index? |
|---|---|
| `/events` | Yes |
| `/events/center`, `/events/north`, `/events/south`, `/events/jerusalem`, `/events/sharon`, `/events/shfela` | Yes |
| `/events/weekend`, `/events/week`, `/events/nextweek` | Yes |
| `/events/today`, `/events/tomorrow` | No (stale cache risk) |
| `/events/weekend/center`, `/events/week/center`, `/events/weekend/north` | Yes |
| Other date+region combos | No |

### City-level pages

| URL | Target query |
|---|---|
| `/events/tel-aviv` | "הצגות בתל אביב" |
| `/events/haifa` | "הצגות בחיפה" |
| `/events/beer-sheva` | "הצגות בבאר שבע" |

### Meta

- **Titles**: dynamic per filter combo, e.g. "הצגות תיאטרון במרכז | תיאטרון בישראל"
- **Descriptions**: unique per page, include city names for long-tail
- **Canonical**: self-referencing for indexed pages, `noindex,follow` for non-indexed
- **Sitemap**: add all indexed URLs, `changeFrequency: "daily"`, `lastmod` from `scrapedAt`

### Structured data

- **schema.org/Event** JSON-LD — cap at ~20 events per page
- Required fields: `name`, `startDate`, `eventAttendanceMode`, `eventStatus`, `image`, `location`, `organizer`, `offers`
- `organizer` uses `"@type": "Organization"` (not `TheaterGroup` — that's not a valid schema.org type)
- `image` uses the existing `getShowImagePath(title)` + `toAbsoluteUrl()` utilities from `src/lib/seo.ts` (images are `/{slug}.webp` in `/public`, derived from show title at runtime — no `imageUrl` field in the DB)
- `AggregateRating` goes on show pages, not events (ratings are for shows, not performances)
- **BreadcrumbList**: דף הבית > לוח הופעות > מרכז > סוף השבוע

### FAQ section

Collapsible at bottom of `/events`:
- "איך אני יודע מה שווה לראות?"
- "איפה קונים כרטיסים?"
- "מה זה תיאטרון בישראל?"

### Open Graph

- `og:title` = dynamic H1
- `og:description` = first 2-3 shows with times (no time-sensitive phrasing)
- `og:image` = site logo / branded card
- `og:url` = canonical URL

---

## Accessibility

- Chip filters: `role="radiogroup"` / `role="radio"`, arrow-key navigation
- Date headers: `<h2>`
- Review CTA links: unique `aria-label` per show
- Disabled chips: `aria-disabled="true"`, removed from tab order
- Sticky headers: `scroll-margin-top` on cards
- Live region: `aria-live="polite"` announces result count on filter change
- Skip link: "דלגו לרשימת ההופעות" to jump past filter chips

---

## Performance

- Server-render everything. Page works without JS
- Chip filters are `<a>` tags with hrefs (progressive enhancement: intercept with client-side fetch)
- Target LCP < 1.5s on 4G mobile
- No heavy assets above fold
- Edge cache with daily revalidation

---

## Not in v1

- Text search, genre filter, sort options, map view
- Ticket links on cards
- Geolocation ("הצגות בקרבתי")
- Email digest
- No pagination (naturally bounded, add "load more" if >500 events in future)

## Future enhancements

- Ticket affiliate links (after proving traffic)
- "הצגות בקרבתי" (geolocation)
- "הצגות שנגמרות בקרוב" section
- "Upcoming events" badge on ShowCards in `/shows`
- Email digest / WhatsApp share

---

## Technical plan

### Step 1 — DB: add `region` to Venue

**Migration:** Add `region String?` column to `Venue` in `schema.prisma`.

**City→region mapping** in `sync-events.js` (alongside existing `VENUE_ALIASES`):

```js
const CITY_REGION_MAP = {
  'תל אביב': 'center', 'תל אביב-יפו': 'center', 'רמת גן': 'center', ...
  'חיפה': 'north', 'עכו': 'north', ...
  // full list from Filters section above
};
```

Set `region` during the existing venue upsert in `syncFile()`/`syncTouringFile()` — add it to the `update` and `create` clauses. Cities not in the map get `region: null`.

**Composite index:** Add `@@index([date, showId, venueId])` on `Event` for the date-range query. Remove the existing standalone `@@index([date])` since the composite covers date-range scans. Keep the standalone `@@index([showId])` and `@@index([venueId])` — they're used by FK lookups and the show detail page query.

Run `npx prisma migrate dev`, then `node prisma/sync-events.js` to backfill all venues.

---

### Step 2 — Data layer: `src/lib/data/eventsList.ts`

**Main query function** — `getEvents({ dateFrom, dateTo, region?, city? })`:

Uses Prisma ORM (matching the existing data layer pattern in `src/lib/data/`). `dateFrom`/`dateTo` are `Date` objects — `Event.date` is `DateTime @db.Date` in Prisma (stored as midnight UTC), so use `gte`/`lte` with Date objects, not date strings.

```ts
const events = await prisma.event.findMany({
  where: {
    date: { gte: dateFrom, lte: dateTo },
    ...(region && { venue: { region } }),
    ...(city && { venue: { city } }),
  },
  include: {
    show: { select: { title: true, slug: true, theatre: true, avgRating: true, reviewCount: true } },
    venue: { select: { name: true, city: true, region: true } },
  },
  orderBy: [{ date: 'asc' }, { hour: 'asc' }],
});
```

Note: Show has no `imageUrl` field. Images are derived at render time via `getShowImagePath(show.title)` from `src/utils/getShowImagePath.ts` (convention: `/{slug}.webp` in `/public`).

**Region counts** — for chip badges, query event counts per region for the active date range:

```ts
const regionCounts = await prisma.event.groupBy({
  by: ['venueId'],
  where: { date: { gte: dateFrom, lte: dateTo } },
  _count: true,
});
// join with venue.region to aggregate
```

Or simpler: raw SQL `SELECT v.region, COUNT(*) FROM "Event" e JOIN "Venue" v ... GROUP BY v.region`.

**Caching:** `unstable_cache` with key `["events-list", datePreset, region]`, revalidate 120s (matching the existing homepage pattern), tag `"events-list"`. For `generateStaticParams` pages, use `revalidate: 120` (not 3600 — a shorter window ensures new Vercel builds from nightly scrape commits reflect quickly).

**Date preset resolver** — pure function `resolveDatePreset(preset: string, now: Date): { from: Date, to: Date }`:

- Lives in `src/lib/datePresets.ts`
- All dates computed in `Asia/Jerusalem` timezone
- Weekend auto-forward logic: if today > Saturday, shift to next Thu–Sat
- Server-side only — no hydration mismatch risk

---

### Step 3 — Routing: `src/app/events/[[...filters]]/page.tsx`

**URL parsing:** The catch-all `filters` param is an array of 0-2 segments.

**Parsing algorithm** — for each segment, check maps in order: `DATE_SLUGS` → `REGION_SLUGS` → `CITY_SLUGS`. First match wins. If a segment doesn't match any map, return 404. If two segments match the same category (e.g., two date presets), return 404.

Note: `jerusalem` exists in both `REGION_SLUGS` and `CITY_SLUGS`. Since regions are checked first, `/events/jerusalem` resolves as a region (covering all Jerusalem-area cities). This is the desired behavior.

Valid patterns:
- `/events` → `[]` → defaults (7 days, all regions)
- `/events/weekend` → `['weekend']` → date preset match
- `/events/center` → `['center']` → region match
- `/events/weekend/center` → `['weekend', 'center']` → date + region
- `/events/tel-aviv` → `['tel-aviv']` → city slug match

**Slug constants** in `src/lib/eventsConstants.ts`:

```ts
export const DATE_SLUGS = { '7days': '7 ימים קרובים', today: 'היום', tomorrow: 'מחר', weekend: 'סוף השבוע', week: 'השבוע', nextweek: 'השבוע הבא', all: 'הכל' };
export const REGION_SLUGS = { center: 'מרכז', sharon: 'שרון', shfela: 'שפלה', jerusalem: 'ירושלים', north: 'צפון', south: 'דרום' };
export const CITY_SLUGS = { 'tel-aviv': ['תל אביב', 'תל אביב-יפו'], haifa: ['חיפה'], 'beer-sheva': ['באר שבע'] };
```

**`generateStaticParams()`** — return all indexed combos (from the indexing table above). Non-indexed combos are rendered on-demand with `dynamicParams = true`.

**`generateMetadata()`** — produces H1, meta title, meta description, canonical, robots (noindex for non-indexed combos), OG tags. Use the slug constants to build Hebrew strings.

**Page component:**
1. Parse `filters` param → resolve date preset + region/city
2. Call `getEvents()` with resolved date range + region
3. Call region counts for chip badges
4. Group events by date → pass to `EventsList` component
5. Render filter chips as `<a>` tags pointing to clean paths

---

### Step 4 — Components

**New files:**

| File | Purpose |
|---|---|
| `src/components/Events/EventCard.tsx` | Single event card (time, title, venue, rating/CTA) |
| `src/components/Events/EventsList.tsx` | Date-grouped list with sticky headers |
| `src/components/Events/DateChips.tsx` | Date preset chip row |
| `src/components/Events/RegionChips.tsx` | Region chip row with count badges |
| `src/components/Events/EventsEmptyState.tsx` | Smart empty state with suggestions |

**EventCard** receives: `{ hour, showTitle, showSlug, theatre, venueName, venueCity, avgRating, reviewCount }`. Derives image path at render time via `getShowImagePath(showTitle)` (no `imageUrl` in the DB — images are `/{slug}.webp` by convention). Links to `/shows/{slug}`. Review CTA links to `/shows/{slug}/review`.

**EventsList** receives grouped data: `Array<{ date: string, label: string, events: EventCardProps[] }>`. Renders `<h2>` sticky date headers + cards.

**Chip components** render `role="radiogroup"` with `<a role="radio">` tags. Active chip determined by current URL path.

---

### Step 5 — SEO

**Sitemap** (`src/app/sitemap.ts`): Add indexed events URLs. Priority 0.85 for `/events`, 0.7 for filtered. `lastmod` from max `scrapedAt` across events JSON files (read from `prisma/data/events-*.json` at build time, or pass as env var).

**JSON-LD** — render in page component:

```tsx
<script type="application/ld+json">
  {JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": events.slice(0, 20).map((e, i) => ({
      "@type": "Event",
      "position": i + 1,
      "name": e.show.title,
      "startDate": `${e.date}T${e.hour}:00+03:00`,
      "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
      "eventStatus": "https://schema.org/EventScheduled",
      "image": toAbsoluteUrl(getShowImagePath(e.show.title)),
      "location": { "@type": "PerformingArtsTheater", "name": e.venue.name, "address": { "@type": "PostalAddress", "addressLocality": e.venue.city } },
      "organizer": { "@type": "Organization", "name": e.show.theatre },
      "offers": { "@type": "Offer", "url": `https://theatre-in-israel.com/shows/${e.show.slug}`, "availability": "https://schema.org/InStock" },
      "url": `https://theatre-in-israel.com/shows/${e.show.slug}`
    }))
  })}
</script>
```

**BreadcrumbList** — separate JSON-LD block, same pattern as existing show pages.

**FAQ** — `src/components/Events/EventsFAQ.tsx`, collapsible with `FAQPage` schema.

---

### Step 6 — Nav + homepage

**Nav:** Add `'/events': 'לוח הופעות'` to `ROUTES` in `src/components/Header/DesktopNav.tsx`, positioned between Home and Shows.

**Homepage** (fast-follow): Add `getUpcomingEventsVaried()` in `src/lib/data/homepage.ts`:
1. Fetch next 30 events with show + venue
2. Greedy pick 5-6 with diversity (skip same show, skip if same region as last 2)
3. Render with same `EventCard` component in a new `UpcomingEventsSection`

---

### Step 7 — Progressive enhancement

After v1 ships server-rendered:
- Add client component wrapper that intercepts chip `<a>` clicks
- Fetch filtered HTML/RSC payload via `fetch()` + swap list content
- `history.pushState` for URL updates, back/forward support
- `aria-live` region announces new result count

---

### Files touched (summary)

| Area | Files |
|---|---|
| Schema | `prisma/schema.prisma` |
| Migration | `prisma/migrations/*/migration.sql` (auto) |
| Sync | `prisma/sync-events.js` |
| Constants | `src/lib/eventsConstants.ts` (new) |
| Date logic | `src/lib/datePresets.ts` (new) |
| Data layer | `src/lib/data/eventsList.ts` (new) |
| Types | `src/types/index.ts` (extend `EnrichedEvent`) |
| Route | `src/app/events/[[...filters]]/page.tsx` (new) |
| Components | `src/components/Events/*.tsx` (new, ~5 files) |
| Nav | `src/components/Header/DesktopNav.tsx` |
| Sitemap | `src/app/sitemap.ts` |
| Homepage | `src/lib/data/homepage.ts`, `src/app/page.tsx` (fast-follow) |
