# LCP Fix Plan — Split Data Fetching + Explicit Suspense

## Background

The root `src/app/loading.tsx` was removed to fix a **PageSpeed Insights warning** about `fetchpriority=high` not being applied to the LCP image. When a root `loading.tsx` exists, Next.js wraps the page in a Suspense boundary, sends the loading skeleton first, then replaces it with the real page — but since Next.js generates the initial HTML from the _skeleton_ (not the real page), the `<Image priority fetchPriority="high">` in `FeaturedShow.tsx` never appears in the initial HTML payload. PSI flagged this correctly.

After removing root `loading.tsx`:

- `fetchPriority="high"` was added explicitly to the Image in `FeaturedShow.tsx` (line 56)
- Loading states were moved to sub-routes: `shows/loading.tsx`, `shows/[slug]/loading.tsx`, `reviews/loading.tsx`, `contact/loading.tsx`, `me/loading.tsx`, `me/reviews/[id]/edit/loading.tsx`

**BUT: this caused LCP to regress from ~3.2s to ~6.0s** because removing root `loading.tsx` means the server now blocks on ALL data fetches before sending _any_ HTML to the browser.

---

## Root Cause

In `src/app/page.tsx` (line 40–50):

```tsx
export default async function Home() {
  const {
    suggestions,
    topRated,
    dramas,
    comedies,
    musicals,
    israeli,
    featuredShow,
    featuredReview,
  } = await getHomePageData();
  // ...renders everything
}
```

`getHomePageData()` in `src/lib/data/homepage.ts` (line 173–176) runs **7 Prisma queries** via `Promise.allSettled`:

1. `getSuggestions()` — 2 queries (shows + genres)
2. `getTopRated()` — 1 query
3. `getShowsByGenres("דרמה", ...)` — 1 query
4. `getShowsByGenres("קומדיה", ...)` — 1 query
5. `getShowsByGenres("מוזיקלי", ...)` — 1 query
6. `getShowsByGenres("ישראלי", ...)` — 1 query
7. Plus a follow-up `prisma.review.findFirst` for `featuredReview` (line 200–205)

Without root `loading.tsx`, there's **no implicit Suspense boundary**, so Next.js waits for `getHomePageData()` to fully resolve before sending any HTML. **TTFB spikes, browser sits idle, LCP increases dramatically.**

---

## Solution: Split Data Fetching + Explicit Suspense

The key insight: the Hero (containing the LCP image) only needs **3 lightweight pieces** of data:

1. `suggestions` (for the search bar)
2. `featuredShow` (the single top-rated show)
3. `featuredReview` (best review for that show)

The **5 genre/category sections** (topRated, dramas, comedies, musicals, israeli) are below the fold and can stream in after the initial HTML.

### Architecture

```
page.tsx
├── await getHeroData()          ← fast, blocks initial HTML (3 queries)
├── <Hero />                     ← renders immediately with LCP image
├── <LotteryBanner />            ← static, renders immediately
├── <Suspense fallback={<ShowsSectionsSkeleton />}>
│   └── <ShowsSectionsContent /> ← async server component, streams in
├── <CtaStrip />                 ← static, renders immediately
```

---

## Detailed Changes

### 1. Split `getHomePageData` in `src/lib/data/homepage.ts`

Add two new exported types and two new cached functions. **Keep the existing `getHomePageData` unchanged** for backward compatibility.

#### 1a. New types (add after `HomePageData` interface, after line 24)

```ts
export interface HeroData {
  suggestions: Suggestions;
  featuredShow: ShowListItem | null;
  featuredReview: FeaturedReview | null;
}

export interface SectionsData {
  topRated: ShowListItem[];
  dramas: ShowListItem[];
  comedies: ShowListItem[];
  musicals: ShowListItem[];
  israeli: ShowListItem[];
  featuredShowId: number | null;
}
```

#### 1b. New `fetchHeroData` function (add after `settled()` helper, after line 167)

This function reuses the existing helpers `getSuggestions()` (line 31) and `getTopRated()` (line 73):

```ts
/**
 * Lightweight hero data: suggestions + featured show + featured review.
 * Only 3-4 DB queries — fast enough to block initial HTML without hurting TTFB.
 */
async function fetchHeroData(): Promise<HeroData> {
  const [suggestionsResult, topRatedResult] = await Promise.allSettled([
    getSuggestions(),
    getTopRated(),
  ]);

  const emptySuggestions: Suggestions = { shows: [], theatres: [], genres: [] };
  const suggestions = settled(suggestionsResult, emptySuggestions);
  const topRated = settled(topRatedResult, [] as ShowListItem[]);

  const featuredShow = topRated[0] ?? null;

  let featuredReview: FeaturedReview | null = null;
  if (featuredShow) {
    const bestReview = await prisma.review.findFirst({
      where: { showId: featuredShow.id },
      orderBy: { rating: "desc" },
      select: { text: true, author: true },
    });
    if (bestReview) {
      featuredReview = { text: bestReview.text, author: bestReview.author };
    }
  }

  return { suggestions, featuredShow, featuredReview };
}

export const getHeroData = unstable_cache(fetchHeroData, ["homepage-hero"], {
  revalidate: 120,
  tags: ["homepage"],
});
```

#### 1c. New `fetchSectionsData` function (add after `getHeroData`)

This function reuses `getTopRated()` (line 73), `getShowsByGenres()` (line 93), and `deduplicateSections()` (line 116):

```ts
/**
 * Heavier section data: 5 genre/category queries + deduplication.
 * Designed to be called inside a Suspense boundary so it doesn't block initial HTML.
 */
async function fetchSectionsData(): Promise<SectionsData> {
  const [
    topRatedResult,
    dramasResult,
    comediesResult,
    musicalsResult,
    israeliResult,
  ] = await Promise.allSettled([
    getTopRated(),
    getShowsByGenres(["דרמה", "דרמה קומית", "מרגש"], FETCH_LIMIT),
    getShowsByGenres(["קומדיה", "קומדיה שחורה", "סאטירה"], FETCH_LIMIT),
    getShowsByGenres(["מוזיקלי", "מחזמר"], FETCH_LIMIT),
    getShowsByGenres(["ישראלי"], FETCH_LIMIT),
  ]);

  const topRated = settled(topRatedResult, [] as ShowListItem[]);
  const dramas = settled(dramasResult, [] as ShowListItem[]);
  const comedies = settled(comediesResult, [] as ShowListItem[]);
  const musicals = settled(musicalsResult, [] as ShowListItem[]);
  const israeli = settled(israeliResult, [] as ShowListItem[]);

  const featuredShow = topRated[0] ?? null;
  const featuredShowId = featuredShow?.id ?? null;

  const deduped = deduplicateSections(
    [
      { key: "topRated", shows: topRated },
      { key: "dramas", shows: dramas },
      { key: "comedies", shows: comedies },
      { key: "musicals", shows: musicals },
      { key: "israeli", shows: israeli },
    ],
    DISPLAY_LIMIT,
    featuredShowId ? [featuredShowId] : [],
  );

  return {
    topRated: deduped.topRated,
    dramas: deduped.dramas,
    comedies: deduped.comedies,
    musicals: deduped.musicals,
    israeli: deduped.israeli,
    featuredShowId,
  };
}

export const getSectionsData = unstable_cache(
  fetchSectionsData,
  ["homepage-sections"],
  { revalidate: 120, tags: ["homepage"] },
);
```

#### Summary of helper reuse

| Helper                  | Defined at                       | Used by `fetchHeroData` | Used by `fetchSectionsData`        |
| ----------------------- | -------------------------------- | ----------------------- | ---------------------------------- |
| `getSuggestions()`      | line 31                          | ✅                      | ❌                                 |
| `getTopRated()`         | line 73                          | ✅                      | ✅                                 |
| `getShowsByGenres()`    | line 93                          | ❌                      | ✅                                 |
| `deduplicateSections()` | line 116                         | ❌                      | ✅                                 |
| `mapToShowListItem()`   | line 53                          | (via getTopRated)       | (via getTopRated/getShowsByGenres) |
| `showListInclude`       | `src/lib/showHelpers.ts` line 13 | (via getTopRated)       | (via getTopRated/getShowsByGenres) |
| `settled()`             | line 166                         | ✅                      | ✅                                 |
| `DISPLAY_LIMIT`         | line 6                           | ❌                      | ✅                                 |
| `FETCH_LIMIT`           | line 7                           | ❌                      | ✅                                 |

> **Note**: `getTopRated()` is called by both functions, but because each result is independently cached by `unstable_cache`, and `getTopRated` itself is deterministic, this is fine. The Prisma query-level caching and `unstable_cache` wrapping mean the DB is only hit once per cache window.

---

### 2. Create `ShowsSectionsContent` component

**New file:** `src/components/ShowsSectionsContent/ShowsSectionsContent.tsx`

This is an **async server component** that fetches section data and renders all `ShowsSection` components. It will be wrapped in `<Suspense>` in `page.tsx`.

```tsx
import ShowsSection from "@/components/ShowsSection/ShowsSection";
import { getSectionsData } from "@/lib/data/homepage";
import ROUTES from "@/constants/routes";
import { buildShowsQueryString } from "@/utils/showsQuery";

export default async function ShowsSectionsContent() {
  const { topRated, dramas, comedies, musicals, israeli } =
    await getSectionsData();

  return (
    <>
      <ShowsSection
        kicker="המובילים"
        title="דירוגים גבוהים"
        shows={topRated}
        linkHref={ROUTES.SHOWS}
        linkText="לכל ההצגות"
      />

      <ShowsSection
        kicker="ז'אנר"
        title="דרמות"
        shows={dramas}
        linkHref={`${ROUTES.SHOWS}${buildShowsQueryString({ genres: ["דרמה", "דרמה קומית", "מרגש"] })}`}
        linkText="לכל הדרמות"
      />

      <ShowsSection
        kicker="ז'אנר"
        title="קומדיות"
        shows={comedies}
        linkHref={`${ROUTES.SHOWS}${buildShowsQueryString({ genres: ["קומדיה", "קומדיה שחורה", "סאטירה"] })}`}
        linkText="לכל הקומדיות"
      />

      <ShowsSection
        kicker="ז'אנר"
        title="מוזיקלי"
        shows={musicals}
        linkHref={`${ROUTES.SHOWS}${buildShowsQueryString({ genres: ["מוזיקלי", "מחזמר"] })}`}
        linkText="לכל המוזיקליים"
      />

      <ShowsSection
        kicker="ז'אנר"
        title="הכי ישראלי"
        shows={israeli}
        linkHref={`${ROUTES.SHOWS}${buildShowsQueryString({ genres: ["ישראלי"] })}`}
        linkText="לכל הישראליים"
      />
    </>
  );
}
```

**`ShowsSection` props interface** (from `src/components/ShowsSection/ShowsSection.tsx` line 12–18):

```ts
interface ShowsSectionProps {
  kicker?: string;
  title: string;
  shows: ShowListItem[];
  linkHref?: string;
  linkText?: string;
}
```

---

### 3. Create `ShowsSectionsSkeleton` component

**New file:** `src/components/ShowsSectionsSkeleton/ShowsSectionsSkeleton.tsx`

```tsx
import styles from "./ShowsSectionsSkeleton.module.css";

const SECTION_COUNT = 5;
const CARD_COUNT = 5;

export default function ShowsSectionsSkeleton() {
  return (
    <div className={styles.wrapper} aria-busy="true" aria-label="טוען הצגות…">
      {Array.from({ length: SECTION_COUNT }).map((_, sectionIndex) => (
        <div key={sectionIndex} className={styles.section}>
          <div className={styles.headerRow}>
            <div className={styles.kicker} />
            <div className={styles.title} />
          </div>
          <div className={styles.carousel}>
            {Array.from({ length: CARD_COUNT }).map((_, cardIndex) => (
              <div key={cardIndex} className={styles.card}>
                <div className={styles.thumb} />
                <div className={styles.body}>
                  <div className={styles.line} />
                  <div className={styles.lineShort} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

**New file:** `src/components/ShowsSectionsSkeleton/ShowsSectionsSkeleton.module.css`

```css
.wrapper {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  padding: 1rem 0;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0 1rem;
}

.headerRow {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.kicker {
  width: 4rem;
  height: 0.75rem;
  border-radius: 4px;
  background: var(--color-skeleton, #e0e0e0);
  animation: pulse 1.5s ease-in-out infinite;
}

.title {
  width: 8rem;
  height: 1.25rem;
  border-radius: 4px;
  background: var(--color-skeleton, #e0e0e0);
  animation: pulse 1.5s ease-in-out infinite;
}

.carousel {
  display: flex;
  gap: 1rem;
  overflow: hidden;
}

.card {
  flex-shrink: 0;
  width: 200px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--color-card-bg, #fff);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.thumb {
  width: 100%;
  aspect-ratio: 3 / 4;
  background: var(--color-skeleton, #e0e0e0);
  animation: pulse 1.5s ease-in-out infinite;
}

.body {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.line {
  width: 80%;
  height: 0.875rem;
  border-radius: 4px;
  background: var(--color-skeleton, #e0e0e0);
  animation: pulse 1.5s ease-in-out infinite;
}

.lineShort {
  width: 50%;
  height: 0.75rem;
  border-radius: 4px;
  background: var(--color-skeleton, #e0e0e0);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}
```

---

### 4. Restructure `src/app/page.tsx`

Replace the current content with:

```tsx
import { Suspense } from "react";
import Hero from "@/components/Hero/Hero";
import CtaStrip from "@/components/CtaStrip/CtaStrip";
import ShowsSectionsContent from "@/components/ShowsSectionsContent/ShowsSectionsContent";
import ShowsSectionsSkeleton from "@/components/ShowsSectionsSkeleton/ShowsSectionsSkeleton";
import LotteryBanner from "@/components/LotteryBanner/LotteryBanner";
import { isLotteryActive } from "@/constants/lottery";
import styles from "./page.module.css";
import ROUTES from "@/constants/routes";
import { getHeroData } from "@/lib/data/homepage";
import { SITE_NAME } from "@/lib/seo";

import type { Metadata } from "next";

const homeTitle = "הצגות מומלצות, ביקורות ודירוגים";
const homeDescription =
  "מצאו הצגות תיאטרון בישראל לפי ביקורות קהל, דירוגים וז׳אנרים מובילים.";

export const metadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  alternates: {
    canonical: ROUTES.HOME,
  },
  openGraph: {
    title: `${homeTitle} | ${SITE_NAME}`,
    description: homeDescription,
    url: ROUTES.HOME,
  },
  twitter: {
    card: "summary_large_image",
    title: `${homeTitle} | ${SITE_NAME}`,
    description: homeDescription,
    images: ["/logo-img.png"],
  },
};

export const revalidate = 120;

export default async function Home() {
  const { suggestions, featuredShow, featuredReview } = await getHeroData();

  return (
    <main className={styles.page} id="main-content">
      <Hero
        suggestions={suggestions}
        featuredShow={featuredShow}
        featuredReview={featuredReview}
      />

      <LotteryBanner />

      <Suspense fallback={<ShowsSectionsSkeleton />}>
        <ShowsSectionsContent />
      </Suspense>

      <CtaStrip
        title="כתב.י ביקורת ועזר.י לאחרים לבחור"
        text={
          isLotteryActive()
            ? "כל ביקורת = כרטיס להגרלה על זוג כרטיסים לתיאטרון! 🎟️"
            : "כמה דקות של כתיבה יכולות לחסוך לקהל ערב לא מוצלח."
        }
        buttonText="כתב.י ביקורת"
        href={ROUTES.REVIEWS_NEW}
      />
    </main>
  );
}
```

**Key differences from current `page.tsx`:**

| Line        | Current                                                                                    | New                                              |
| ----------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| Import      | `getHomePageData`                                                                          | `getHeroData`                                    |
| Import      | `ShowsSection`                                                                             | `ShowsSectionsContent` + `ShowsSectionsSkeleton` |
| Import      | `buildShowsQueryString`                                                                    | _(removed — moved to ShowsSectionsContent)_      |
| Import      | _(none)_                                                                                   | `Suspense` from `"react"`                        |
| Await       | `await getHomePageData()` (7+ queries)                                                     | `await getHeroData()` (3 queries)                |
| Destructure | `suggestions, topRated, dramas, comedies, musicals, israeli, featuredShow, featuredReview` | `suggestions, featuredShow, featuredReview`      |
| Sections    | 5 inline `<ShowsSection>` components                                                       | `<Suspense><ShowsSectionsContent /></Suspense>`  |

---

### 5. No changes needed to root `loading.tsx`

- It's already removed — keep it that way.
- Sub-route loading files remain in place:
  - `src/app/shows/loading.tsx`
  - `src/app/shows/[slug]/loading.tsx`
  - `src/app/reviews/loading.tsx`
  - `src/app/contact/loading.tsx`
  - `src/app/me/loading.tsx`
  - `src/app/me/reviews/[id]/edit/loading.tsx`

---

## Files Changed Summary

| File                                                                    | Action                                                                          |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `src/lib/data/homepage.ts`                                              | Add `HeroData`, `SectionsData` types + `getHeroData`, `getSectionsData` exports |
| `src/app/page.tsx`                                                      | Rewrite to use `getHeroData` + Suspense boundary                                |
| `src/components/ShowsSectionsContent/ShowsSectionsContent.tsx`          | **New** — async server component                                                |
| `src/components/ShowsSectionsSkeleton/ShowsSectionsSkeleton.tsx`        | **New** — skeleton fallback                                                     |
| `src/components/ShowsSectionsSkeleton/ShowsSectionsSkeleton.module.css` | **New** — skeleton styles                                                       |

No other files are modified. `Hero.tsx`, `FeaturedShow.tsx`, `ShowsSection.tsx`, and all sub-route loading files remain unchanged.

---

## Expected Outcome

### Before (current state — no root loading.tsx, no Suspense)

1. Browser requests `/`
2. Server runs `getHomePageData()` — **all 7+ queries in parallel**
3. Server waits for ALL queries to resolve (~2–3s)
4. Server sends complete HTML
5. Browser receives HTML, parses, discovers LCP image
6. Browser fetches LCP image
7. **LCP ≈ 6.0s** (TTFB ~3s + image load ~3s)

### After (split fetch + Suspense)

1. Browser requests `/`
2. Server runs `getHeroData()` — **only 3 queries** (suggestions + topRated + 1 review)
3. Server resolves hero data fast (~0.5–1s)
4. Server sends initial HTML with Hero (contains `<img fetchpriority="high">`), LotteryBanner, skeleton placeholder, and CtaStrip
5. **Browser immediately starts fetching LCP image** while server continues processing
6. Server runs `getSectionsData()` in the Suspense boundary
7. Server streams in the show sections HTML, replacing the skeleton
8. **LCP ≈ 2–3s** (TTFB ~1s + image load ~1.5–2s)

### Why this works

- The Hero `<Image priority fetchPriority="high">` appears in the **initial HTML** sent to the browser
- The browser can start fetching the LCP image **immediately** instead of waiting for all section queries
- The show sections stream in via React's Suspense streaming, so users see a skeleton that fills in progressively
- No root `loading.tsx` needed — the `<Suspense>` boundary in `page.tsx` handles the streaming split explicitly

---

## Testing Checklist

- [ ] `npm run dev` — homepage loads, hero appears first, sections stream in
- [ ] Verify with browser DevTools Network tab: HTML arrives before section queries complete
- [ ] Run PageSpeed Insights on deployed URL — confirm LCP image has `fetchpriority="high"` in initial HTML
- [ ] Confirm no PSI warning about fetchpriority
- [ ] Confirm LCP ≤ 3.5s (target: back to ~3.2s or better)
- [ ] Check that `getHomePageData` export still exists (backward compat)
- [ ] Run existing tests: `npm test` and `npx playwright test`
- [ ] Check RTL layout — skeleton should respect existing RTL CSS variables
