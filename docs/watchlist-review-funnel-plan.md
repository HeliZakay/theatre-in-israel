# Watchlist-to-Review Funnel — "Seen It" Pipeline

> **⏳ FUTURE PLAN** — Saved for when the user base has meaningful account adoption and watchlist usage. Most users currently browse anonymously and don't create accounts, making watchlist-dependent features premature.

## Goal

Maximize review collection by targeting users at the moment of highest intent — right after attending a show they saved to their watchlist.

## Why This Approach

- Random shows on the homepage have near-zero chance of being relevant to any given user — you can only review a show you've actually seen
- Watchlist users explicitly saved a show, likely attended it, and then... nothing happens — no nudge to review
- This creates a natural funnel: **Save → Attend → "Seen it!" → Review**

## Prerequisites

- Meaningful % of users creating accounts
- Active watchlist usage (users saving shows)
- Lottery feature can amplify this further when re-enabled

---

## Feature Components

### 1. `QuickReviewSheet` — Reusable Review Bottom-Sheet

- Location: `src/components/QuickReviewSheet/`
- Uses `@radix-ui/react-dialog` (already a dependency)
- **Trigger:** Any component can open it by passing `showId`, `showTitle`, and optional `initialRating`
- **Content:** Show title → `StarRating` (pre-filled if `initialRating` provided) → title input + text textarea (reuse `ReviewFormFields` with `hideRating`)
- For anonymous users: add name + honeypot fields (same pattern as `InlineReviewForm`)
- **Submission:** Calls `createReview` or `createAnonymousReview` server actions
- **Auth detection:** `useSession()` from `next-auth/react`
- **On success:** Celebratory animation inside sheet → auto-close after 2s → revalidate show page
- **Mobile:** Renders as bottom sheet (slide up); desktop: centered dialog

### 2. "ראיתי!" (Seen it!) Button on Watchlist Page

- Modify `src/app/me/watchlist/page.tsx`
- Each show card gets a secondary action: **"ראיתי! ✍️"** alongside the existing remove button
- Only for shows user hasn't reviewed — cross-reference with `getReviewsByUser(userId)`
- Clicking opens `QuickReviewSheet` pre-loaded with that show
- After successful review: card shows "✓ דירגת" badge with star count, replacing the button
- Visually prominent (gold/warm accent matching star color `#f59e0b`)

### 3. Homepage Section — "הצגות שרציתם לראות"

- Location: `src/components/WatchlistReviewBanner/`
- Server component fetching logged-in user's unreviewed watchlist shows
- **Only renders for logged-in users with ≥ 1 unreviewed watchlist item** — otherwise `null`
- Distinct visual (warm background with green/teal tint to differentiate from `ExploreBanner`)
- **Headline:** "הצגות שרציתם לראות" / subtitle: "ראיתם כבר אחת מהן? ספרו מה חשבתם"
- Up to 4 cards with **always-visible stars** (not hover-hidden). Click a star → opens `QuickReviewSheet`
- If > 4 items: show "ראו עוד ברשימה" link to `/me/watchlist`
- Placement: between Hero and show carousels in `page.tsx`

### 4. Always-On `StickyReviewCTA` on Show Pages

- Currently gated behind lottery (`renders null` when inactive)
- Remove lottery gate — always show sticky bar when user hasn't reviewed the show
- Non-lottery copy: "ראיתם את ההצגה? ספרו מה חשבתם"
- When lottery IS active: keep existing lottery-specific enhanced copy
- Quick win — just requires removing one condition

### 5. Data Layer — "Unreviewed Watchlist Shows" Query

- New function in `src/lib/watchlist.ts`: `getUnreviewedWatchlistShows(userId, limit?)`
- Queries watchlist items where show has NO review by this user (`NOT EXISTS` subquery)
- Cache with `unstable_cache` (short TTL, tagged for invalidation on review creation)

### 6. Fallback for Anonymous / No-Watchlist Users

- When homepage section renders `null`, fall back to `ExploreBanner` (existing behavior)
- Alternate the `CtaStrip` messaging at bottom of homepage to occasionally show review CTA instead of browse CTA

---

## Implementation Notes

- `QuickReviewSheet` is the keystone — reusable from watchlist page, homepage section, and potentially future surfaces (browse page cards, etc.)
- Existing components to reuse: `StarRating`, `ReviewFormFields`, `createReview`/`createAnonymousReview` server actions, `Card`, `FallbackImage`
- Existing e2e tests: `reviews.spec.ts`, `watchlist.spec.ts`, `shows-browsing.spec.ts` must continue passing
- Step 4 (StickyReviewCTA always-on) can be implemented independently as a quick win even before the rest
