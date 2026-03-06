# Review Collection Optimization — Option C: Fix the Leaks + Homepage Nudge

> **Status:** Ready to implement  
> **Priority:** High — each step is independently shippable  
> **Estimated total effort:** 1–2 days

## Problem

The anonymous review infrastructure is fully built and working — the problem is purely **discoverability** and **timing**:

| Leak | Location               | Problem                                                                                  |
| ---- | ---------------------- | ---------------------------------------------------------------------------------------- |
| 1    | `StickyReviewCTA`      | Completely dead — gated behind `isLotteryActive()` which returns `false`                 |
| 2    | Show page layout       | `InlineReviewForm` buried below 4 sections (description, cast, web summary, ALL reviews) |
| 3    | `ScrollToReviewButton` | Plain button, no urgency, no social proof                                                |
| 4    | Homepage               | Zero review CTAs — entire page is consumption-only                                       |

## Solution: 4 Targeted Changes

---

### Step 1: Un-gate `StickyReviewCTA` (~5 minutes) ✅ DONE

**File:** `src/components/StickyReviewCTA/StickyReviewCTA.tsx`

**Current state:** Line 49: `if (!isLotteryActive() || dismissed) return null;` kills the component when lottery is off.

**Changes:**

- Change condition to `if (dismissed) return null;` — remove the `isLotteryActive()` gate
- Add context-aware copy:
  - Lottery active → "🎟️ כתב.י ביקורת ואולי תזכ.י בכרטיסים!" (existing)
  - Lottery inactive → **"ראיתם את ההצגה? ספרו מה חשבתם"**
- Add a `.barDefault` CSS variant with neutral dark gradient (wine-red, matching `CtaStrip`) for non-lottery mode; keep current gold style as `.barLottery` for lottery mode
- Remove unused `isLotteryActive` import if no longer needed

**Impact:** Every show page visitor who hasn't reviewed now sees a persistent nudge. One-line change, instant reach.

---

### Step 2: Move `InlineReviewForm` higher on the show page (~30 minutes)

**File:** `src/app/shows/[slug]/page.tsx`

**Current state:** `InlineReviewForm` is at lines 302–308, at the very bottom of the reviews section — after all other reviews.

**Changes:**

- Move the `InlineReviewForm` block to render **right after the description/about section** (after line 275), before cast, web summary, and reviews
- Keep `id="write-review"` on the form so `ScrollToReviewButton` and `StickyReviewCTA` still scroll to it correctly
- At the bottom of the reviews section (where the form used to be), render the currently unused `ReviewEncouragement` component (`src/components/ReviewEncouragement/ReviewEncouragement.tsx`) linking to `#write-review` via scroll — catches users who read all reviews and want to add theirs
- Both render only when `!userReview` (existing condition)

**Rationale:** Users need to understand the show to feel qualified to review it — the description provides that context. Cast and web summaries are supplementary; most users skim past them. Moving the form up means users encounter it while still engaged.

---

### Step 3: Enhance `ScrollToReviewButton` with social proof (~1 hour)

**File:** `src/components/ScrollToReviewButton/ScrollToReviewButton.tsx`

**Current state:** 24-line component, plain button with static text "כתב.י ביקורת". No props beyond `className`.

**Changes:**

- Add props: `reviewCount: number` and `avgRating: number | null` — passed from the show page where `getShowStats(show)` already provides them
- Dynamic copy based on state:
  - **0 reviews** → "היו הראשונים לדרג! ⭐" (be the first to rate — urgency + exclusivity)
  - **1–5 reviews** → "הצטרפו ל-{n} ביקורות" (join N reviews — social momentum)
  - **6+ reviews** → "כתב.י ביקורת" (standard — show has traction)
- Visual enhancement: add a subtle warm background or gold left-border (matching star color `#f59e0b`) via the show page's module CSS to differentiate from neutral `WatchlistButton` and `ShareDropdown`

---

### Step 4: Add a review CTA banner on the homepage (~2–3 hours)

**New files:** `src/components/ReviewCTABanner/ReviewCTABanner.tsx` + `ReviewCTABanner.module.css`

**Component:**

- Simple server component (no client JS needed)
- Content:
  - Headline: **"ראיתם הצגה לאחרונה?"**
  - Subtitle: **"כתב.י ביקורת קצרה — זה לוקח פחות מדקה, ועוזר לאלפי צופים להחליט"**
  - Single `<Button href={ROUTES.REVIEWS_NEW}>` → **"כתב.י ביקורת"**
- Styling: Follow `ExploreBanner` layout pattern (centered column, `clamp`-based margins, `22px` border-radius) but with **wine-red/maroon palette** from `CtaStrip` (`#4f0f17` → `#942a36` gradient, white text) — visually distinct from the cream `ExploreBanner`, reads as an action surface

**Integration:**

- Add a `reviewBanner?: ReactNode` prop to `ShowsSectionsContent` (`src/components/ShowsSectionsContent/ShowsSectionsContent.tsx`)
- Render it **between the musicals and israeli sections** (near the bottom, after the user has browsed several carousels)
- In `src/app/page.tsx`: pass `<ReviewCTABanner />` as the `reviewBanner` prop — always rendered, no conditions (anonymous reviews fully supported)

---

## Verification Checklist

- [ ] **StickyReviewCTA:** Visit any show page → scroll past hero → sticky bar slides in. Click CTA → smooth-scroll to review form. Click × → dismissed for session. Does NOT show when user already reviewed the show
- [ ] **InlineReviewForm position:** Review form appears after description, above cast. `ScrollToReviewButton` and `StickyReviewCTA` still scroll to it via `#write-review`
- [ ] **ScrollToReviewButton:** 0 reviews → "היו הראשונים לדרג! ⭐". 3 reviews → "הצטרפו ל-3 ביקורות". 10+ reviews → "כתב.י ביקורת"
- [ ] **ReviewCTABanner:** Homepage shows wine-red banner between musicals and israeli carousels. Button links to `/reviews/new`. Visually distinct from cream ExploreBanner
- [ ] **Mobile:** StickyReviewCTA usable on small screens. ReviewCTABanner stacks vertically
- [ ] **Existing e2e tests pass:** `reviews.spec.ts`, `navigation.spec.ts`, `shows-browsing.spec.ts`

## Design Decisions

| Decision                                            | Reasoning                                                                                                             |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Move form after description, not after cast         | Description gives users enough context to feel qualified to review. Cast/web summaries are supplementary              |
| Second banner slot, not replacing `ExploreBanner`   | Explore drives discovery (future reviews). Review CTA targets past viewers. Both serve the funnel at different stages |
| Wine-red banner, not cream                          | Matches `CtaStrip` "take action" color language vs. cream "browse" language. Users instantly read it as different     |
| Simple CTA link to `/reviews/new`, not inline stars | `/reviews/new` already has show picker, validation, anonymous support. Homepage's job is to direct, not host forms    |
| `ReviewEncouragement` at reviews bottom as fallback | Reuses dead code, costs nothing, catches "read all reviews, want to add mine" users                                   |
| Always render ReviewCTABanner (no auth check)       | Anonymous reviews are first-class. Most users are anonymous. No reason to gate                                        |
