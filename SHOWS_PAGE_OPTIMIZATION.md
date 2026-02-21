# Shows Page Optimization — Decision Process & Implementation

## The Question

For the `/shows` page (a filterable, paginated list of ~129–300 theatre shows), we evaluated two architectures:

1. **Client-side filtering** — Fetch all shows on initial load, filter/sort/paginate in the browser.
2. **Server-side filtering** — Each filter change triggers a server request (current approach).

---

## Option 1: Client-Side Filtering

### How it would work

- On page load, fetch all ~129–300 shows in a single payload (~60–80 KB without reviews).
- Store in React state or context.
- All filtering (search, theatre, genre), sorting (by rating), and pagination happen instantly in the browser.
- URL sync maintained via `window.history.replaceState` or `useSearchParams`.

### Pros

- **Instant UI** — No network round-trip on filter interactions. Feels snappy.
- **Reduced DB load** — One query on page load instead of 4–6 per filter change.
- **Simpler server** — No need for complex Prisma WHERE clauses or raw SQL sort logic.

### Cons

- **SEO loss** — Filtered views (e.g., `/shows?theatre=הבימה`) would NOT be server-rendered. Search engines wouldn't index filtered content. For a Hebrew theatre site, losing URLs like "הצגות תיאטרון הבימה" is significant.
- **Heavier initial load** — Must send ALL shows upfront vs. only 12 per page.
- **Client-side sort complexity** — Rating sort requires `AVG(rating)` computation on the client. Either pre-compute on server or send all reviews (payload bloat).
- **Doesn't scale** — At 500+ shows, the payload becomes problematic. Client-side filtering of large datasets degrades mobile performance.
- **Duplication of logic** — Filter/sort/pagination logic must be reimplemented in JS (already exists in SQL/Prisma).
- **No-JS fallback** — Without JavaScript, the page shows nothing (current SSR works without JS).

---

## Option 2: Server-Side Filtering (Current Approach)

### How it works

- Filters are URL search params (`?theatre=...&genre=...&sort=...&page=...`).
- Each filter change triggers `router.push()` → Next.js server re-render → Prisma queries → HTML response.
- Page is fully server-rendered (SSR).

### Pros

- **SEO-friendly** — Every filter combination is a unique, indexable URL with full server-rendered HTML. Google can crawl `/shows?theatre=הבימה` and index it.
- **Shareable URLs** — Users can share/bookmark filtered views. Works natively.
- **Scales indefinitely** — Pagination is DB-level (`LIMIT`/`OFFSET`). Works with 10K+ shows.
- **Works without JS** — Server-rendered HTML is fully functional.
- **Single source of truth** — Filter/sort logic lives in SQL where it belongs.

### Cons

- **Perceived latency** — Every filter change = 350ms debounce + network round-trip + DB queries + render. Not instant.
- **DB load** — Multiple queries per interaction (count, shows, theatres, genres, available genres).
- **Over-fetching** — The original implementation loaded ALL reviews for every show just to compute `avgRating`, even though the list page never displays individual reviews.

---

## Our Decision: Keep Server-Side, Optimize Performance

### Why

| Factor | Weight | Winner |
|--------|--------|--------|
| SEO (filtered views indexable) | High (explicitly important to user) | Server |
| Dataset size (129–300 shows) | Medium | Either works |
| Scalability to 300+ | Medium | Server |
| Filter responsiveness | Medium | Client |
| Implementation effort | Low | Server (already built) |
| Shareable URLs | High | Server (free) |

**Key insight**: The problem wasn't the architecture — it was the implementation. The SSR approach was slow because of over-fetching and unoptimized queries, not because SSR is inherently slow.

### Hybrid option considered and rejected

We briefly considered a hybrid: SSR for initial render (SEO), then hydrate all shows client-side for instant subsequent filtering. Rejected because:

- Added complexity (two data paths, state sync)
- Marginal UX gain for 129 shows
- SEO already works with pure SSR

---

## What We Optimized (Implementation Details)

### Problem 1: Loading all reviews for list views

**Before:** `showInclude` always loaded every review for every show:

```ts
export const showInclude = {
  genres: { include: { genre: true } },
  reviews: { orderBy: { date: "desc" } },  // ALL reviews loaded
};
```

The list page only needed `avgRating` and `reviewCount`, not individual reviews. With 12 shows per page × N reviews each, the payload and DB load grew unboundedly.

**After:** Created `ShowListItem` type (no `reviews[]` array) and `fetchShowListItems()` that:

- Loads shows with genres only (`showListInclude` — no reviews)
- Computes `avgRating` and `reviewCount` via a single raw SQL aggregation:

```sql
SELECT "showId", AVG(rating)::float, COUNT(*)::int
FROM "Review" WHERE "showId" = ANY($1) GROUP BY "showId"
```

**Impact:** Data transfer reduced from O(shows × reviews) to O(shows + 1 aggregation query).

### Problem 2: Multiple sequential DB queries

**Before:** 4–6 queries ran sequentially per page load:

1. `prisma.show.count({ where })` — pagination total
2. `prisma.show.findMany({ where })` — matching IDs (for rating sort)
3. Raw SQL sort + paginate
4. `fetchShowsByIds()` — hydrate with all reviews
5. `prisma.show.findMany({ distinct: ["theatre"] })` — dropdown
6. `prisma.genre.findMany()` — dropdown

**After:** Restructured into 2 parallel steps:

```
Step 1 (parallel): count + cached theatres + cached genres
Step 2 (parallel): paginated shows + available genres
```

### Problem 3: No caching for stable data

**Before:** Theatre list and genre list were fetched from DB on every single filter interaction, even though they rarely change.

**After:** Wrapped with `unstable_cache` (Next.js cache) with 60-second revalidation:

```ts
const getCachedTheatres = unstable_cache(async () => { ... }, ["theatres"], { revalidate: 60 });
const getCachedGenres = unstable_cache(async () => { ... }, ["genres"], { revalidate: 60 });
```

### Problem 4: `ShowCard` re-derived stats

**Before:** `ShowCard` received `EnrichedShow` (which already had `avgRating`) but was typed as `Show`, so it called `getShowStats(show)` to re-compute stats from `show.reviews` at render time — double computation.

**After:** `ShowCard` accepts `ShowListItem` and reads `show.avgRating` / `show.reviewCount` directly. No computation at render time.

### Problem 5: Redundant `force-dynamic`

**Before:** `export const dynamic = "force-dynamic"` on the shows page.

**After:** Removed. Next.js already treats pages that access `searchParams` as dynamic. The explicit directive was preventing any potential caching optimizations.

### Problem 6: Featured show needed reviews for quote

The homepage `Hero` component displayed a quote from the best review of the featured show. With `ShowListItem` (no reviews), this broke.

**Solution:** Instead of loading ALL reviews for the featured show, we fetch just the single best review via a targeted query:

```ts
const bestReview = await prisma.review.findFirst({
  where: { showId: featuredShow.id },
  orderBy: { rating: "desc" },
  select: { text: true, author: true },  // Only the 2 fields we need
});
```

---

## Type Architecture

```
Show           — Full show with reviews[]. Used by detail page.
EnrichedShow   — Show + computed stats. Used by detail page.
ShowListItem   — Lightweight: no reviews, pre-computed stats. Used by list/card views.
```

This separation ensures:

- **Detail page** (`/shows/[id]`) still loads full reviews (needed to render `ReviewCard` list).
- **List views** (shows page, homepage carousels, watchlist) only carry what they render.

---

## Files Changed

| File | What changed |
|------|-------------|
| `src/types/index.ts` | Added `ShowListItem` interface |
| `src/lib/showHelpers.ts` | Added `showListInclude`, `fetchShowListItems()` |
| `src/lib/data/showsList.ts` | Full rewrite: `ShowListItem`, SQL stats, cached dropdowns, parallel queries |
| `src/components/ShowCard/ShowCard.tsx` | Accepts `ShowListItem`, reads stats directly |
| `src/app/shows/ShowsContent.tsx` | `EnrichedShow[]` → `ShowListItem[]` |
| `src/components/ShowsSection/ShowsSection.tsx` | `EnrichedShow[]` → `ShowListItem[]` |
| `src/lib/data/homepage.ts` | Uses `fetchShowListItems`, targeted featured review query |
| `src/components/Hero/Hero.tsx` | `ShowListItem` + `FeaturedReview` prop |
| `src/app/page.tsx` | Passes `featuredReview` to `Hero` |
| `src/app/me/watchlist/page.tsx` | `fetchShowsByIds` → `fetchShowListItems` |
| `src/app/shows/page.tsx` | Removed `force-dynamic` |

---

## Performance Before vs. After

| Metric | Before | After |
|--------|--------|-------|
| DB queries per filter interaction | 4–6 (sequential) | 2–3 (parallel, 2 cached) |
| Data loaded per show (list) | Show + ALL reviews | Show metadata + 1 SQL aggregation |
| Theatre/genre dropdown queries | Every request | Cached (60s revalidation) |
| ShowCard render computation | `getShowStats()` iterates reviews | Direct property access |
| `force-dynamic` | Blocks all caching | Removed (Next.js auto-detects) |

---

## Interview Discussion Points

1. **Architecture trade-offs are contextual** — Client-side filtering is great for small, static datasets where SEO doesn't matter (e.g., admin dashboards). Server-side is better when URLs/SEO matter and data grows.

2. **Optimize the implementation before changing the architecture** — The SSR approach wasn't inherently slow. The bottleneck was over-fetching (loading reviews nobody displays) and sequential queries that could run in parallel.

3. **Type-driven design** — Creating `ShowListItem` forced us to think about what each view actually needs. The detail page needs `reviews[]`; the list page needs `avgRating`. Different types for different contexts.

4. **Push computation to the database** — Computing `AVG(rating)` in JavaScript after fetching all reviews is wasteful. SQL aggregations are what databases are built for.

5. **Cache what doesn't change** — Theatre and genre lists change when an admin adds content. Caching them for 60 seconds eliminates 2 queries per interaction with negligible staleness.

6. **Structural typing is your friend** — `ShowListItem` is a structural subset of `EnrichedShow`. Components typed as `ShowListItem` can still receive `EnrichedShow` without casting, thanks to TypeScript's structural type system.
