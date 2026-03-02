# Lottery Campaign Plan — הגרלה

**Goal:** Incentivize users to sign up and write reviews by offering a chance to win a pair of theatre tickets. Every authenticated review = 1 lottery entry. More reviews = higher chance to win.

---

## Product Strategy

### Core Mechanic

- **1 authenticated review = 1 lottery entry** (simple, easy to communicate)
- Anonymous reviews do **NOT** count → nudges users to create accounts
- No fixed end date — you decide when to draw based on review volume
- Winner selected manually via admin script when you're ready
- Prize: זוג כרטיסים לתיאטרון (generic, bought by you)

### Why This Works

- Zero friction — users don't need to "opt in"; every review automatically counts
- Natural push away from anonymous reviews → more sign-ups
- Visible entry count on profile creates a "score" → motivates repeat reviewing
- WhatsApp share buttons are critical for Israeli audience reach

### Risks & Mitigations

| Risk                     | Mitigation                                                                      |
| ------------------------ | ------------------------------------------------------------------------------- |
| Spam/low-quality reviews | Already enforced: min text length (zod), profanity filter, rate limit (3/hr)    |
| Multi-accounting         | Low risk at current scale. Revisit if needed (phone verification, etc.)         |
| Legal                    | Banner says "ללא תאריך סיום קבוע". Keep prize description vague for flexibility |

---

## Technical Approach

### No New DB Tables

Lottery entries are **derived** from authenticated review count since campaign start date:

```sql
SELECT COUNT(*) FROM "Review"
WHERE "userId" = {userId}
AND "createdAt" >= {startDate}
```

Benefits: simpler, no data sync issues, entries automatically adjust if reviews are deleted.

### Campaign Toggle

All lottery UI checks `LOTTERY_CONFIG.enabled` — flip to `false` and all messaging disappears instantly across the app.

---

## Implementation Steps

### Step 1 — Lottery Config Constant

**File:** `src/constants/lottery.ts`

Create a `LOTTERY_CONFIG` object:

```ts
export const LOTTERY_CONFIG = {
  enabled: true,
  startDate: new Date("2026-03-03"),
  prize: "זוג כרטיסים לתיאטרון",
} as const;

export function isLotteryActive(): boolean {
  return LOTTERY_CONFIG.enabled && new Date() >= LOTTERY_CONFIG.startDate;
}
```

### Step 2 — Design Tokens

**File:** `src/app/tokens.css`

Add lottery-specific tokens — warm gold/amber accent that differentiates from curtain-red:

```css
--color-lottery-gold: #d4a017;
--color-lottery-gold-light: #fff8e7;
--color-lottery-gold-hover: #b8860b;
```

### Step 3 — Data Layer

**File:** `src/lib/lottery.ts`

Create helper functions:

- `getLotteryEntriesCount(userId)` — returns review count since lottery start
- `getLotteryLeaderboard()` — returns all participants with entry counts (for admin draw)

### Step 4 — `LotteryBanner` Component

**Path:** `src/components/LotteryBanner/`

Full-width, gold-background strip for the homepage:

- 🎟️ emoji + headline: "כתב.י ביקורת וזכ.י בזוג כרטיסים לתיאטרון!"
- CTA Button linking to write-a-review page
- Renders `null` when `isLotteryActive()` returns `false`
- CSS Module: card-like with `--radius-md`, `--color-lottery-gold-light` background

### Step 5 — `LotteryBadge` Component

**Path:** `src/components/LotteryBadge/`

Compact pill-shaped inline badge: "🎟️ הגרלה"

- Gold background, used next to CTAs on show pages and auth gateway
- Renders `null` when lottery is disabled

### Step 6 — `ShareButtons` Component

**Path:** `src/components/ShareButtons/`

Accepts `text` and `url` props. Renders:

- **WhatsApp** button (primary — most used in Israel)
- **Copy link** button with "הועתק!" confirmation
- **Twitter/X** button (secondary)
- Uses `navigator.share` Web Share API on mobile as progressive enhancement

### Step 7 — Homepage Integration

**File:** `src/app/page.tsx`

- Insert `<LotteryBanner />` between `<Hero>` and first `<ShowsSection>`
- Update `<CtaStrip>` subtitle to mention lottery when enabled

### Step 8 — Show Detail Page

**File:** `src/app/shows/[slug]/page.tsx`

Add `<LotteryBadge />` below the `heroActions` div with text: "🎟️ כתיבת ביקורת = כרטיס להגרלה"

### Step 9 — Review Auth Gateway

**File:** `src/components/ReviewAuthGateway/ReviewAuthGateway.tsx`

Three additions:

1. Gold-highlighted lottery callout above action buttons: "🎟️ כל ביקורת = כרטיס להגרלה לזוג כרטיסים!"
2. Enhance `benefitNote`: add "ולהשתתף בהגרלה"
3. Note below guest link: "(ביקורות אנונימיות לא משתתפות בהגרלה)"

### Step 10 — Auth Pages

**Files:** `src/app/auth/signup/page.tsx`, `src/app/auth/signin/page.tsx`

Add lottery incentive line below existing subtitle:
"🎟️ הרשמ.י וכתב.י ביקורות כדי להשתתף בהגרלה לזוג כרטיסים לתיאטרון!"

### Step 11 — Review Success State (The Big Moment)

This is the most important step. Two files need to change together:

**Backend — `src/app/reviews/actions.ts`:**

- In `createReview` (the authenticated flow only, NOT `createAnonymousReview`):
  - After the review is saved successfully, call `getLotteryEntriesCount(session.user.id)` from `src/lib/lottery.ts`
  - Change the return from `actionSuccess({ showId })` to `actionSuccess({ showId, lotteryEntries })` (only when `isLotteryActive()` is true; otherwise keep returning just `{ showId }`)
  - Import `getLotteryEntriesCount` and `isLotteryActive`
  - The `ActionResult` type is generic so no changes needed to `src/types/actionResult.ts`

**Frontend — `src/components/ReviewForm/ReviewForm.tsx`:**

- This is a client component using react-hook-form. It has an `isAnonymous` prop that tells you if the form is for an anonymous or authenticated review.
- The current success state shows a green banner: "הביקורת נשלחה בהצלחה" + "מעבירים אותך לעמוד ההצגה..." and auto-redirects after 1800ms.
- Changes for authenticated reviews only (when `!isAnonymous`):
  1. Store `lotteryEntries` from the action result in component state
  2. Add lottery confirmation below existing success text: "🎟️ קיבלת כרטיס להגרלה!"
  3. Show total entries: "יש לך X כרטיסים להגרלה" (using the count from state)
  4. Add `<ShareButtons>` below with text: "כתבתי ביקורת באתר תיאטרון בישראל והשתתפתי בהגרלה לזוג כרטיסים! כתבו גם אתם 🎭" and url: `window.location.origin`
  5. Extend redirect timeout from 1800ms → 4000ms to give time to see the lottery info and share
  6. Wrap all lottery UI in `isLotteryActive()` check so it disappears when campaign ends
  7. Add lottery-specific styles to `ReviewForm.module.css` — gold-accented section within the success banner
- For anonymous reviews: no changes, keep current behavior exactly as-is

### Step 12 — User Profile

**Files:** `src/app/me/page.tsx` + `src/app/me/page.module.css`

The profile page currently has a `statsRow` with 3 items: review count, watchlist count, join date. Data comes from `getUserProfile()`.

Changes:

- Call `getLotteryEntriesCount(session.user.id)` from `src/lib/lottery.ts` (only when `isLotteryActive()`)
- Add a 4th stat item in `statsRow`: lottery entries count with 🎟️ emoji, styled in gold (`--color-lottery-gold`)
- Below the `statsRow` (before the display name edit section), add a small lottery CTA section:
  - Text: "כתב.י עוד ביקורות כדי להגדיל את הסיכוי לזכות! 🎟️"
  - `Button` linking to `ROUTES.REVIEWS_NEW`
  - `<ShareButtons>` with text: "אני משתתף.ת בהגרלה לזוג כרטיסים לתיאטרון! כתבו ביקורות גם אתם 🎭" and url: `window.location.origin`
  - Note: ShareButtons is a client component — you may need a small client wrapper or use it inside a client island
- Wrap everything in `isLotteryActive()` check — when lottery is off, profile stays exactly as it is now
- Add matching CSS: gold-accented stat value, lottery section with subtle gold background

### Step 13 — Footer

**Files:** `src/components/Footer/Footer.tsx` + `src/components/Footer/Footer.module.css`

Add a conditional lottery mention in the navigation column's link list (where Home, Shows, Write Review links are):

- Add "🎟️ הגרלה" as a text item or link to `ROUTES.REVIEWS_NEW` (since there's no dedicated lottery page)
- Wrap in `isLotteryActive()` check
- Keep it subtle — just one more nav item

### Step 14 — Admin Draw Script

**File:** `scripts/lottery-draw.mjs`

Simple Node CLI script you'll run manually with `node scripts/lottery-draw.mjs`:

1. Import Prisma client and lottery config
2. Call `getLotteryLeaderboard()` from `src/lib/lottery.ts` — or duplicate the query inline since this is a standalone script and may not resolve `@/` aliases easily
3. Build a weighted array: each user appears N times where N = their review count
4. Pick a random index → that's the winner
5. Print: winner's name, email, review count (entries), total participants, total entries
6. Optionally accept a `--dry-run` flag to just show the leaderboard without picking

---

## UI/UX Touchpoints Summary

| Location              | Element                                                     | Visibility                    |
| --------------------- | ----------------------------------------------------------- | ----------------------------- |
| Homepage (top)        | `LotteryBanner` — gold strip with CTA                       | High — first thing after hero |
| Homepage (bottom)     | `CtaStrip` — updated subtitle                               | Medium                        |
| Show detail page      | `LotteryBadge` — pill next to "write review"                | Subtle, contextual            |
| Review Auth Gateway   | Gold callout + enhanced benefit note + guest exclusion note | High — decision moment        |
| Sign-up page          | Lottery incentive text                                      | Medium                        |
| Sign-in page          | Lottery incentive text                                      | Medium                        |
| Review success banner | 🎟️ confirmation + entry count + share buttons               | **Highest** — emotional peak  |
| User profile `/me`    | Entry count stat + CTA section                              | Medium — personal motivation  |
| Footer                | Lottery mention in nav                                      | Low                           |

---

## UX Flow Diagram

```
User lands on homepage
    │
    ├─ Sees LotteryBanner → "Write a review, win tickets!"
    │
    ▼
User browses to show page
    │
    ├─ Sees LotteryBadge next to "Write Review" button
    │
    ▼
User clicks "Write Review"
    │
    ├─ IF not logged in → ReviewAuthGateway
    │   ├─ Sees lottery callout: "Every review = 1 lottery entry!"
    │   ├─ Sees: "anonymous reviews don't count"
    │   ├─ Nudged to sign up/sign in
    │   │
    │   ├─ Goes to /auth/signup → sees lottery incentive text
    │   └─ Signs up → redirected back to review form
    │
    ├─ IF logged in → ReviewForm directly
    │
    ▼
User writes and submits review
    │
    ▼
Success banner appears:
    ├─ ✓ "הביקורת נשלחה בהצלחה"
    ├─ 🎟️ "קיבלת כרטיס להגרלה!"
    ├─ "יש לך 3 כרטיסים להגרלה"
    ├─ [Share on WhatsApp] [Copy Link] [Share on X]
    │
    ▼ (after 4 seconds)
Redirect to show page
    │
    ▼
User visits /me profile
    ├─ Sees: "3 כרטיסי הגרלה 🎟️" in stats
    ├─ Sees: "Write more reviews to increase your chances!"
    └─ Share buttons to invite friends
```

---

## Verification Checklist

- [ ] All touchpoints render correctly (homepage, show page, auth gateway, auth pages, success state, profile, footer)
- [ ] Set `enabled: false` → ALL lottery UI disappears across every page
- [ ] Anonymous review flow → no lottery messaging in success state
- [ ] Authenticated review flow → lottery confirmation + entry count + share buttons
- [ ] Share buttons: WhatsApp works on mobile, copy link works on desktop, share text is correct Hebrew
- [ ] Responsive: banner and share buttons tested on mobile viewport
- [ ] Existing tests pass: `jest` + `playwright` — no regressions in review flow, auth flow, homepage
- [ ] Admin draw script works correctly with test data

---

## Design Decisions

| Decision                     | Rationale                                                              |
| ---------------------------- | ---------------------------------------------------------------------- |
| No new DB table              | Entries derived from review count — simpler, auto-adjusts on delete    |
| Gold accent color            | Differentiates lottery CTAs from regular app actions, draws the eye    |
| WhatsApp-first sharing       | Matches Israeli user behavior                                          |
| Longer success redirect (4s) | Gives time to see lottery message + share                              |
| No dedicated /lottery page   | Keeps it lightweight; components are reusable if needed later          |
| Guest exclusion note         | Clear but not aggressive; nudges sign-up without blocking anon reviews |
| Config toggle                | Instant campaign on/off without code changes                           |
