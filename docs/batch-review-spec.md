---
name: Review Batch Flow — Product Spec
description: Product spec for a dedicated multi-review flow that encourages users to review many shows in one session
type: project
---

## Review Batch Flow — Product Spec

### Goal
Increase review volume by creating a dedicated, loop-based flow that encourages users to review multiple shows in a single session.

### Entry Point
- Dedicated page at `/reviews/batch`
- Linked from homepage, navbar, or a CTA like "Rate shows you've seen"

### Flow

**Step 1 — Show Selection ("What have you seen?")**
- Grid of shows, defaulting to **most reviewed** (social proof), with "needs reviews" shows interleaved every 5th position (shows with 0-2 reviews, randomly ordered) to avoid rich-get-richer effect
- **Search**: free text search to find specific shows (substring match, ignoring Hebrew prefix ה)
- **Filter**: select box to filter by theatre
- Multi-select: user taps shows to mark them with a checkmark
- "Next" button appears once at least 1 show is selected
- No limit on how many they can select

**Step 2 — Review Loop (one show at a time)**
- Shows the selected show's poster/title
- **Star rating** (1-5, required) — tap to rate
- **Short text** (required) — free text area with **expression chips** above it (quick-tap phrases like "משחק מעולה", "מרגש", "מצחיק", "ביצוע מוזיקלי מדהים", "במה יפה", "קצת ארוך", etc.) — tapping a chip inserts it into the text field, user can mix chips + free text
- "Submit" sends the review → celebration screen
- "דלג" (Skip) link to skip this show without reviewing → advances to next show
- Progress indicator: "Review 2 of 5" so user sees momentum

**Step 3 — Celebration (after each review)**
- Brief positive feedback: "Your review is published!" with a visual flourish (confetti, checkmark animation — TBD in UX/UI phase)
- **First review only (anonymous users)**: ask for display name
  - "How should your reviews appear?" → text field + "Keep anonymous" button
  - Choice persists for all remaining reviews in the session
  - Logged-in users skip this — their account name is used
- Auto-advances to next show after 2.5 seconds or server confirmation (whichever is later), or user taps "Next"
- If no more shows: goes to Exit screen

**Step 4 — Exit / Summary**
- "You reviewed X shows! Thank you!"
- List of shows they just reviewed with their ratings
- "Review more" button → re-fetches shows from server (fresh `alreadyReviewedIds`) and returns to Step 1 with updated greyed-out shows. Shows a brief loading state during re-fetch.
- Stage 2 (future): show recommendations here

**At any point:**
- "Finish" button visible throughout the review loop (Steps 2-3) to exit early → goes to Exit screen with whatever they've completed so far

### Handling Edge Cases

| Case | Behavior |
|------|----------|
| User already reviewed a show (auth) | Don't show in grid, or show greyed out with "Already reviewed" |
| Anonymous user already reviewed (IP match) | Same — grey out or hide |
| User navigates away mid-flow | No draft saving — selections lost (keep it simple) |
| Review fails validation | Show inline error on review step, don't advance |
| User skips a show in the loop | Advance to next show, skipped show is not counted in exit summary. Progress counter advances position (e.g., "3 of 5"), total stays the same — don't shrink it. |
| User wants to edit a submitted review | Not supported in this flow — edit later from /me/reviews (intentional simplification) |
| Expression chips language | Hebrew (RTL). Curated list, not user-generated |

### Out of Scope (future)
- Recommendation engine on exit screen
- Account creation upsell
- Review editing within this flow (edit later from /me/reviews)
- Notifications or follow-ups

### UX/UI Design

#### Overall Layout Principles
- **Mobile-first, single-column layout.** Max width ~640px for the show selection grid (Step 1) to fit 3 comfortable columns; narrowing to ~480px for the review/celebration/exit steps (Steps 2-4). Centered on desktop. No side panels or split views — the whole flow feels like a focused app experience, not a web page.
- **RTL throughout.** `dir="rtl"` on the flow container. Text fields, chips, progress indicators, and navigation all flow right-to-left. The "Next" / "Submit" button sits on the left (the forward direction in RTL). The "Finish" / back button sits on the right.
- **Sticky bottom bar** for primary actions (Next, Submit, Finish) — always visible above the keyboard on mobile. Enough padding below to avoid overlap with the system navigation bar.
- **No page-level nav.** The flow hides the site header/footer to keep the user focused. A small "✕" close button in the top-left corner exits the flow (with a "you'll lose progress" confirmation if any reviews are unsubmitted).

---

#### Step 1 — Show Selection Grid

**Layout:**
- Sticky top bar: search field + theatre filter dropdown, side by side on one row. Search field takes ~65% width, filter ~35%.
- Below: a responsive grid of show cards. 2 columns on mobile (<480px), 3 columns on tablet/desktop. Cards are poster-shaped (3:4 aspect ratio) with the show image filling the card and the title overlaid at the bottom on a dark gradient.

**Multi-select checkmarks:**
- Tapping a card toggles selection. Selected cards get:
  - A colored border (primary color, 3px).
  - A filled circle checkmark badge in the top-left corner (RTL: top-right) — 28×28px, primary color background, white checkmark icon. Animates in with a quick scale-up (150ms ease-out).
  - Slight dim/overlay on the poster so the checkmark pops.
- Unselected cards have no badge and no border, just a subtle rounded corner and shadow.

**"Next" button:**
- Appears in the sticky bottom bar once ≥1 show is selected. Slides up into view (200ms).
- Label updates dynamically: "המשך (3)" showing the count. Full-width button, 48px height, rounded, primary color.

**Empty states:**
- *No search results:* Centered illustration (a spotlight shining on empty stage), text "לא מצאנו הצגות — נסו חיפוש אחר" (We didn't find shows — try another search). Muted color.
- *No shows for a theatre:* Same illustration, text "אין הצגות פעילות לתיאטרון הזה כרגע" (No active shows for this theatre right now).
- *Loading:* Skeleton cards (grey pulsing rectangles in the grid layout).

---

#### Step 2 — Review Form

**Layout (top to bottom):**
1. **Progress bar** — thin (4px) horizontal bar at the very top of the screen, filled proportionally (e.g., 2/5 = 40%). Smooth width animation on each step. Color: primary. Below it, right-aligned text: "ביקורת 2 מתוך 5".
2. **Show card** — compact: poster thumbnail (80×107px) on the right, show title + theatre name on the left. No tap action — just context.
3. **Star rating**
4. **Expression chips**
5. **Text field**
6. **Sticky bottom bar** with "שליחה" (Submit) button and "דלג" (Skip) text link.

**Note:** The batch flow intentionally omits the review `title` field (which exists in the regular review form) to keep it lightweight. Batch reviews will have `title: null`. This is acceptable — titles are optional in the schema and the UI renders reviews fine without them.

**Star rating interaction:**
- 5 stars in a horizontal row, centered. Each star is a **44×44px touch target** (the star icon itself is ~32px, but the tappable area is larger to meet accessibility minimums).
- **Tap to rate:** tapping the 3rd star sets rating to 3. Tapping the same star again clears the rating (deselect). Stars fill from right to left (RTL).
- **Swipe/drag:** finger can drag across the stars to set a rating fluidly. Provides haptic feedback (light vibration) on each star crossed, if the device supports it.
- **Visual:** empty stars are outlined in a warm grey. Filled stars are solid gold (#F5A623). Filling animates with a quick left-to-right (in RTL: right-to-left) wipe, ~100ms per star sequentially.
- No half stars — integers only.

**Expression chips:**
- Horizontally scrollable row (single line, overflow-x scroll, no wrapping). Sits directly above the text field with 8px gap. Chips are pill-shaped (border-radius: 16px), 44px height (meets WCAG touch target minimum), with Hebrew text in 14px. Background: light grey (#F0F0F0), text: dark grey. Horizontal padding 12px.
- **On tap:** the chip's text is appended to the text field (with a comma + space separator if text already exists). The chip visually toggles to "active" state: primary color background, white text. Tapping an active chip removes its text from the field and returns the chip to inactive state.
- **One-way sync only:** chips track their own active/inactive state independently. If the user manually edits the text field (deleting or rewriting chip text), chips do NOT attempt to re-sync — they stay in whatever state the user last tapped them. This avoids fragile substring matching.
- **Chip list** is curated and static (not personalized). ~10-12 chips. They scroll horizontally so the row stays compact. A subtle fade/gradient on the left edge (RTL: right edge) hints that more chips are available off-screen.

**Text field:**
- Standard textarea, 3 rows visible by default, expands up to 6 rows as user types. Placeholder text: "מה חשבתם על ההצגה?" (What did you think of the show?). When the keyboard opens on mobile, the form scrolls so the text field is visible.
- No hard character cap beyond the existing schema limit (5000 chars). The UI encourages brevity through a small textarea and expression chips, but doesn't enforce a shorter limit. A subtle character counter appears only if the user exceeds 500 chars, as a gentle nudge — not a hard stop.

**Submit button:**
- Full-width in sticky bottom bar, 48px height, rounded, primary color. Disabled (greyed out, no tap) until both star rating is set AND text field is non-empty.
- On submit: button shows a brief spinner (300ms) then transitions to celebration.

---

#### Step 3 — Celebration

**Visual:**
- Full-screen takeover (clean white background). Centered content:
  1. **Animated checkmark** — a circle that draws itself (stroke animation, ~400ms) then a checkmark strokes in (200ms). Circle color: success green.
  2. **"הביקורת שלך פורסמה!"** (Your review is published!) — bold, 20px, appears with a fade-in (200ms delay after checkmark).
  3. **Confetti burst** — lightweight CSS/canvas confetti that fires from the center outward, ~1.5 seconds, then fades. Small colorful pieces (primary, gold, success green). Not overwhelming — celebratory but brief.
- **Duration:** auto-advances to the next show after **2.5 seconds OR server confirmation, whichever is later**. The celebration animation plays immediately (optimistic), but the auto-advance timer only starts once the server confirms success. If the server is slow, the celebration holds with a subtle "שומר..." (Saving...) indicator until confirmed. If the server fails, snaps back to the review form with error. User can also tap "Next" to advance (only enabled after server confirmation). A subtle circular progress indicator around the checkmark shows the countdown once it starts.

**Display name prompt (first review, anonymous users only):**
- Appears **below** the celebration message, fading in ~500ms after the checkmark animation completes — regardless of whether the server has confirmed yet. This lets the user fill in their name while the review saves in the background, reducing perceived wait time. This delay after the animation is intentional — let the celebration land first, then gently introduce the prompt.
- Layout: a single text field with label "איך לחתום על הביקורות?" (How should your reviews be signed?) — placeholder: "שם תצוגה". Below it, two horizontally placed buttons:
  - Left (primary, filled): "שמור" (Save)
  - Right (text-only / ghost): "להישאר אנונימי" (Stay anonymous)
- The auto-advance timer **pauses** when this prompt is shown. The flow only continues when the user makes a choice.
- **This is not a form — it's a soft ask.** No required field indicator, no asterisks, no validation errors. Choosing anonymous is equally prominent to entering a name. The field is pre-focused so the keyboard opens, but tapping "Stay anonymous" dismisses it instantly.
- After the choice, it saves and the flow advances to the next show (or exit if done). A brief toast "שם תצוגה נשמר" (Display name saved) confirms if they entered a name. No toast for anonymous — just continue.

---

#### Step 4 — Exit / Summary

**Layout:**
- Centered content, celebratory but calmer than Step 3:
  1. Large number: "ביקרתם 5 הצגות!" (You reviewed 5 shows!) — bold, 28px. The number can animate counting up from 0 (odometer style, ~800ms).
  2. Below: a compact list of reviewed shows — each row shows: poster thumbnail (40×53px), show title, and the star rating they gave (small gold stars). Vertically stacked, max 4 visible with scroll if more.
  3. Below the list: "לביקורות נוספות" (Review more) — secondary style button (outlined, not filled) → re-fetches fresh data from server and returns to Step 1 with previously-reviewed shows greyed out. Brief loading spinner on the button while fetching.
- No sticky bottom bar here. The "Review more" button is inline. The "✕" close in the top corner exits the flow entirely.

---

#### Transitions Between Steps

- **Step 1 → Step 2:** the grid slides out to the right (RTL: contextually "backward") and the review form slides in from the left. Duration: 250ms ease-in-out.
- **Step 2 → Step 3 (celebration):** crossfade. The form fades out (150ms) and the celebration fades in (200ms). No directional slide — the celebration is a "moment," not a navigation.
- **Step 3 → Step 2 (next show):** the celebration fades out (150ms), then the next review form slides in from the left (250ms). Slightly faster than the first transition to maintain momentum.
- **Any step → Step 4 (exit):** fade transition (200ms).
- **Progress bar** animates its width smoothly (300ms ease) whenever the step changes.

---

#### "Finish" Button Placement

- Visible during Steps 2 and 3 as a **text link** in the top-left corner (RTL: top-right): "סיום" (Finish).
- Styled as subdued text (14px, medium grey) — not a button shape. This makes it discoverable but non-competing with the primary Submit action.
- On the celebration screen (Step 3), it remains in the same position. Since the celebration is brief, it doesn't need to be prominent — the auto-advance handles the happy path, and "Finish" is there for intentional early exit.
- Tapping "Finish" at any point goes to Step 4 with whatever reviews are already submitted.

---

#### Color & Typography Notes
- Primary actions: site's primary color (for buttons, selected states, progress bar).
- Stars: gold (#F5A623).
- Success moments: green (#34C759 or similar).
- Text: dark grey on white. High contrast for accessibility.
- Font sizes: body 16px (prevents iOS zoom on input focus), labels 14px, headings 20-28px.
- All interactive elements: minimum 44×44px touch target per Apple/Google HIG.

### Architecture / Technical Design

#### Route Structure

Single route: `/reviews/batch` → `src/app/reviews/batch/page.tsx`

The page is a thin server component that:
1. Checks auth status (session or anonymous)
2. Fetches the initial show grid data (server-side, for fast first paint)
3. For authenticated users: queries the user's already-reviewed show IDs (`SELECT showId FROM Review WHERE userId = ?`)
4. For anonymous users: queries already-reviewed show IDs by IP (`SELECT showId FROM Review WHERE ip = ? AND userId IS NULL`)
5. Renders a single client component `<BatchReviewFlow>` with the initial data as props

The entire multi-step flow (selection → review loop → celebration → exit) lives inside `<BatchReviewFlow>` as client-side state transitions. No route changes between steps — this keeps the "app-like" feel described in UX and avoids layout flashes. The browser URL stays at `/reviews/batch` throughout (no step params needed — there's no reason to deep-link to step 3 of a transient flow).

Add `REVIEWS_BATCH: "/reviews/batch"` to `src/constants/routes.ts`.

#### Component Tree

```
page.tsx (server)
  └─ BatchReviewFlow (client) — orchestrates steps, holds all state
       ├─ ShowSelectionGrid — step 1
       │    ├─ search input + theatre filter (client-side filtering of pre-loaded data)
       │    └─ SelectableShowCard (per show) — reuses FallbackImage, getShowImagePath
       ├─ ReviewStep — step 2 (one instance, re-keyed per show)
       │    ├─ StarRating (new component — tap/drag interaction)
       │    ├─ ExpressionChips (new component)
       │    └─ textarea (plain, no ReviewFormFields reuse — see below)
       ├─ CelebrationStep — step 3
       │    └─ DisplayNamePrompt (conditional, first review only for anon)
       └─ ExitSummary — step 4
```

#### State Management

All state lives in `BatchReviewFlow` via `useState`/`useReducer`. No context provider or URL params needed — the component tree is shallow and all state is co-located.

```ts
interface BatchFlowState {
  step: "select" | "review" | "celebrate" | "exit";
  selectedShowIds: number[];       // chosen in step 1
  currentIndex: number;            // which show in the loop (0-based)
  completedReviews: {              // submitted reviews (for exit summary)
    showId: number;
    rating: number;
  }[];
  skippedShowIds: number[];        // shows skipped in the loop (not shown in exit summary)
  displayName: string | null;      // null = not yet asked, "" = chose anonymous, "name" = chosen name
  alreadyReviewedIds: Set<number>; // from server, grows as reviews are submitted
  submissionStatus: "idle" | "pending" | "confirmed" | "error"; // tracks server confirmation for celebration timing
}
```

Key: `useReducer` is better than multiple `useState` calls here because step transitions update several fields atomically (e.g., submitting a review increments `currentIndex`, pushes to `completedReviews`, and may change `step`).

#### Data Fetching — Show Grid

**Server-side initial load.** The page server component fetches all shows with a lightweight query (similar to `getShowOptions()` but including `theatre`, `reviewCount`, `avgRating`, and image path data). This is ~300 rows, small enough to serialize as props. Sorted by `reviewCount DESC` (most-reviewed first = social proof default).

New data function in `src/lib/data/batchReview.ts`:

```ts
export interface BatchShowItem {
  id: number;
  slug: string;
  title: string;
  theatre: string;
  reviewCount: number;
  avgRating: number | null;
}

async function fetchBatchShows(): Promise<BatchShowItem[]> {
  const shows = await prisma.show.findMany({
    select: { id: true, slug: true, title: true, theatre: true, reviewCount: true, avgRating: true },
    orderBy: [{ reviewCount: "desc" }, { id: "asc" }],
  });
  // Interleave "needs reviews" shows (0-2 reviews) every 5th position
  // to avoid rich-get-richer effect. See product spec.
  return interleaveNeedsReviews(shows);
}

// Cache for 60s, tagged for revalidation
export const getBatchShows = unstable_cache(fetchBatchShows, ["batch-shows"], {
  revalidate: 60,
  tags: ["shows-list"],
});
```

**Client-side search/filter** operates on the pre-loaded array (no server round-trips). `Array.filter()` on the ~300 items is instant. Search uses case-insensitive substring matching on show title, with Hebrew prefix-aware matching (strip leading ה from both query and title for comparison, so searching "בימה" finds "הבימה"). The theatre filter dropdown values are derived from the same data (`[...new Set(shows.map(s => s.theatre))]`), sorted alphabetically.

**Already-reviewed check:** Server fetches `reviewedShowIds: number[]` and passes as prop. The grid uses this to grey out / hide shows. As the user submits reviews within the flow, the client adds to this set locally (no re-fetch needed).

New server function for fetching reviewed IDs:

```ts
// In src/lib/data/batchReview.ts
export async function getReviewedShowIds(userId: string): Promise<number[]> { ... }
export async function getAnonymousReviewedShowIds(ip: string): Promise<number[]> { ... }
```

#### Reuse Assessment

| Existing | Reuse? | Notes |
|----------|--------|-------|
| `createReview` / `createAnonymousReview` server actions | **Yes, directly** | Called per-show in the loop. FormData construction happens client-side per submission. No changes needed. |
| `createReviewSchema` / `clientReviewSchema` | **Yes** | Validation stays the same. The batch flow just calls it per review. |
| `ReviewFormFields` component | **No** | Too coupled to react-hook-form + dropdown rating. The batch review form is simpler (star tap, chips + textarea, no title field, no show picker). Build a lighter `BatchReviewForm`. |
| `ReviewForm` component | **No** | Includes show combobox, poster sidebar layout, routing logic. Not applicable. |
| `ShowCard` component | **No** | Too feature-rich (watchlist toggle, link, rating display, genres, summary). The selection grid needs a simpler poster-focused card with a checkmark overlay. New `SelectableShowCard`. |
| `FallbackImage` + `getShowImagePath` | **Yes** | Reused inside `SelectableShowCard` and the review step's show thumbnail. |
| `ShowCardSkeleton` | **Partially** | Can adapt the skeleton shape for the selection grid loading state. |
| `actionSuccess` / `actionError` types | **Yes** | Same return type from server actions. |
| `profanityFilter`, `rateLimitCheckers` | **Yes** | Already invoked inside the server actions — no extra work. |

#### Expression Chips

**Hardcoded constant, not DB-driven.** The list is curated, static, and Hebrew-only per the spec. No reason to pay a DB query for ~12 strings that change rarely.

New file: `src/constants/expressionChips.ts`

```ts
export const EXPRESSION_CHIPS = [
  "משחק מעולה",
  "מרגש",
  "מצחיק",
  "ביצוע מוזיקלי מדהים",
  "במה יפה",
  "תפאורה מרשימה",
  "טקסט חזק",
  "בימוי מבריק",
  "קצת ארוך",
  "מפתיע",
  "חובה לראות",
  "מושלם לזוג",
] as const;
```

If the list needs to change, it's a one-line code edit + deploy. Moving to DB adds complexity for no benefit at this scale.

#### Display Name Persistence

**React state, not a cookie.** The display name only needs to persist within the current session (one visit to `/reviews/batch`). It lives in `BatchFlowState.displayName`:
- `null` → hasn't been asked yet (prompt on first celebration)
- `""` → chose "stay anonymous" → pass no `name` field (server defaults to "אנונימי")
- `"שם"` → chosen name → pass as `name` in FormData for all subsequent reviews

No cookie needed because:
1. The flow is single-page — state survives the whole loop.
2. If the user leaves and comes back, the prompt reappears — acceptable per spec ("selections lost" on navigate-away).
3. Cookies would require consent considerations and add complexity.

For authenticated users, `session.user.name` is used automatically (already handled by `createReview` action) — no prompt shown.

#### API Design — New vs Existing

**No new server actions needed.** The existing `createReview` and `createAnonymousReview` handle everything:
- They accept `FormData` with `showId`, `rating`, `text`, `name` (optional), `title` (optional), `honeypot`
- They handle rate limiting, profanity checking, dedup, and revalidation
- The batch flow calls the appropriate action once per review submission

**One new data-fetching function** (`getBatchShows` + `getReviewedShowIds` / `getAnonymousReviewedShowIds`) in `src/lib/data/batchReview.ts`.

**No new API routes.** Server actions are sufficient.

#### Performance

**Show grid:**
- ~300 shows loaded server-side as props (serialized JSON, ~30KB). No pagination needed for the selection grid — it's a finite, scrollable list.
- Show images: only the visible viewport loads (standard `next/image` lazy loading). The grid's 2-3 column layout means ~6-9 images in the initial viewport.
- Client-side search/filter is synchronous `Array.filter()` — no debounce needed at this scale.

**Review submission — optimistic UI with server gating:**
- On submit, immediately transition to celebration (step 3) and start the celebration animation while the server action runs in the background (`submissionStatus: "pending"`).
- If the action succeeds (happy path, typically <1s): set `submissionStatus: "confirmed"`, start the 2.5s auto-advance timer. The "Next" button becomes enabled.
- If the action fails: snap back to the review form with the error message and pre-filled fields (`submissionStatus: "error"`). The review data is held in local state until success is confirmed.
- Key: the auto-advance timer does NOT start until the server confirms. This prevents the race condition where the user moves to the next review while a failed submission is still in flight. If the server is slow, the celebration holds with a subtle "שומר..." indicator.
- Implementation: `useTransition` or a simple `useState` for pending state.

**Celebration transition:**
- Checkmark animation: CSS-only (stroke-dasharray animation). No JS animation library.
- Confetti: lightweight `<canvas>` burst — a small self-contained utility (~2KB). Imported dynamically (`next/dynamic` or lazy import) so it doesn't bloat the initial bundle.
- Auto-advance timer: `setTimeout` with cleanup in `useEffect`. Only starts after server confirmation (`submissionStatus: "confirmed"`). Paused when display name prompt is shown (clear timeout, restart after choice).

**Bundle size:**
- The entire batch flow is a single client component tree under a dynamic route. It code-splits naturally from the rest of the app.
- No new dependencies needed. Star rating, chips, confetti — all implementable with vanilla React + CSS.

#### Error Handling

**Submission failure mid-loop:**

1. **Network error / server 500:** The optimistic celebration snaps back to the review form. Error message shown inline: "משהו השתבש, נסו שוב" (Something went wrong, try again). The form is pre-filled — user just taps Submit again. The `completedReviews` array is not updated, so the progress counter stays accurate.

2. **Validation error** (profanity, too short, etc.): Same snap-back. The specific validation message is shown (returned by the server action's `actionError`).

3. **Duplicate review** (P2002 — user somehow already reviewed this show): Treat as a soft success — skip to celebration, don't add to `completedReviews` display, show a toast "כבר כתבת ביקורת להצגה זו" and auto-advance. The user doesn't need to re-review.

4. **Rate limit hit:** Show the rate limit message on the review form. The "Finish" button remains available so the user can exit with their completed reviews.

5. **Show not found** (P2003 — show deleted between selection and review): Skip the show, advance to the next one. Toast: "ההצגה לא נמצאה, עוברים להצגה הבאה". If it was the last show, go to exit.

**No draft persistence.** Per spec, navigating away loses everything. The close "✕" button shows a confirmation dialog if `completedReviews.length < selectedShowIds.length` (unsubmitted reviews remain).

#### File Structure (new files)

```
src/app/reviews/batch/
  page.tsx                          — server component (data fetch + auth check)
  page.module.css                   — minimal (mostly delegates to components)
src/components/batch-review/
  BatchReviewFlow.tsx               — client orchestrator (state machine)
  ShowSelectionGrid.tsx             — step 1 grid + search/filter
  SelectableShowCard.tsx            — poster card with checkmark toggle
  ReviewStep.tsx                    — step 2 form (stars, chips, textarea)
  StarRating.tsx                    — tap/drag star input
  ExpressionChips.tsx               — horizontal scrollable chip row
  CelebrationStep.tsx               — step 3 (checkmark anim, confetti, name prompt)
  ExitSummary.tsx                   — step 4
  BatchReviewFlow.module.css        — shared styles (transitions, layout)
  [component].module.css            — per-component styles
src/constants/expressionChips.ts    — static chip list
src/lib/data/batchReview.ts         — getBatchShows, getReviewedShowIds
```

### Security Review

#### Existing Protections That Cover the Batch Flow

The batch flow reuses `createReview` / `createAnonymousReview` server actions, so all existing server-side validation applies per-submission:

| Layer | What it does | Batch impact |
|-------|-------------|--------------|
| **Zod schema** (`createReviewSchema`) | Validates `showId` (positive int), `rating` (1-5 int), `text` (2-5000 chars), `name` (≤80 chars), `title` (≤120 chars) | Each submission is validated independently — client-side state manipulation (tampered show IDs, missing rating) is caught server-side. No gap. |
| **Profanity filter** (`checkFieldsForProfanity`) | Checks `title`, `text`, and `authorName` against Hebrew word/phrase list + English leo-profanity | Covers display name prompt — profane names are rejected. |
| **Auth rate limit** (`checkReviewRateLimit`) | 50 reviews/hour per authenticated user (counted from `Review.createdAt`) | Holds. A user selecting 60 shows and submitting them all would hit the limit at review 51. No bypass — the check queries the DB, not client state. |
| **Anonymous rate limit** (`checkAnonymousReviewRateLimit`) | 20 reviews/hour per IP (5 if IP is "unknown") | Holds. Each submission increments the `RateLimitAttempt` counter. A batch of 20+ from one IP is blocked. |
| **IP dedup** (anonymous) | `findFirst({ ip, showId, userId: null })` — one anonymous review per IP per show | Correct for batch: 5 different shows from the same IP = 5 different `(ip, showId)` pairs → all pass. Reviewing the same show twice = blocked on second attempt. No gap. |
| **Unique constraint** (authenticated) | DB unique constraint on `(userId, showId)` → P2002 on duplicate | Same as single flow. Architecture handles P2002 as soft success (skip + toast). |
| **Honeypot** | Hidden `honeypot` field — if filled, returns fake success | Applies per-submission. Bots would need to leave it empty on every review in the batch. |

#### Gaps and Recommendations

**1. Batch flow is a higher-value bot target**

The single-review form requires navigating to a show page, finding the review form, and submitting. The batch flow concentrates all submissions on one route with a predictable loop. A bot could:
- POST to the server action repeatedly with different `showId` values without rendering the UI.
- The honeypot alone won't stop a targeted bot that reads the HTML and leaves the field empty.

**Recommendation:** Add a lightweight **invisible reCAPTCHA or Turnstile challenge** on the `/reviews/batch` page that generates a token verified server-side on each submission. Alternatively, as a simpler first step: **add a server-side timing check** — reject submissions that arrive less than ~2 seconds after the previous one from the same IP/user. Legitimate users can't rate + write text faster than that.

**2. Display name — XSS and impersonation**

- **XSS:** The name is stored via Prisma (parameterized queries, no injection risk) and rendered via React JSX (auto-escaped). No XSS vector — React's default escaping handles this. No gap.
- **Profanity:** Already checked via `checkFieldsForProfanity({ authorName })` in both `createReview` and `createAnonymousReview`. Covered.
- **Impersonation:** A user could enter a name like "מערכת" (System) or another user's real name. The existing flow has the same issue. **Low priority** — consider a reserved-names blocklist if this becomes a problem (e.g., block "מנהל", "מערכת", "admin"). Not blocking for launch.
- **Length:** Capped at 80 chars by `REVIEW_NAME_MAX` in the Zod schema. Covered.

**3. Client-side state manipulation**

- **Tampered `selectedShowIds`:** The client sends `showId` per submission, validated by Zod (`coerce.number().int().positive()`). If a user injects a non-existent ID → P2003 (handled). If they inject an ID not in their selection → they just review a show they didn't select, which is harmless (identical to the single-review flow).
- **Skipping the rating step:** The client could POST without a rating, but the server schema requires `rating` (1-5 int). Submission would fail validation. No gap.
- **Inflating `completedReviews` client-side:** Only affects the exit summary UI. The actual review count comes from the DB. No security impact.

**4. Anonymous rate limit may be too generous for batch**

The current anonymous limit is **20/hour per IP**. With the batch flow, hitting 20 reviews in one session is plausible for a legitimate power user — but it also means a single anonymous attacker can create 20 reviews/hour with zero friction.

**Recommendation:** Consider **lowering the anonymous rate limit to 10/hour** or adding a **CAPTCHA trigger after the 5th anonymous review** in a single batch session. This still allows genuine users to batch-review comfortably while raising the cost for abuse.

**5. Rate limit counter races**

The `checkAnonymousReviewRateLimit` records an attempt *before* the review is actually created. If the review then fails validation (profanity, etc.), the rate limit counter is still incremented. In the batch flow, a user who hits profanity errors repeatedly could exhaust their rate limit without submitting a single review.

**Recommendation:** This is an existing issue, not batch-specific. **Low priority** for launch, but worth noting. A future fix could move the rate-limit recording to after successful review creation.

**6. No CSRF concern**

Server actions in Next.js App Router include built-in CSRF protection (origin checking). No additional CSRF tokens needed.

#### Summary Verdict

The existing server-side security stack covers the batch flow well. The main new risk is **bot abuse at scale** — the batch route is more automatable than the single-review path. The highest-priority addition is a timing check or invisible CAPTCHA. Everything else is low-priority or already covered.

---

### Accessibility (a11y)

#### Keyboard Navigation

**Show Selection Grid (Step 1):**
- Grid cards must be focusable (`tabIndex={0}` or `role="checkbox"`). Arrow keys should move focus between cards (roving tabindex pattern on a 2D grid, using `role="grid"` / `role="row"` / `role="gridcell"`).
- Enter/Space toggles selection on the focused card.
- Search input and theatre filter are standard form controls — keyboard-accessible by default.
- "Next" button in sticky bar: reachable via Tab from the grid.

**Review Form (Step 2):**
- Tab order: star rating → expression chips → text field → submit button.
- All elements must be reachable without a mouse.

**Celebration (Step 3):**
- If display name prompt is shown: focus moves to the name input. "Save" and "Stay anonymous" buttons are Tab-reachable.
- If no prompt: "Next" / tap-anywhere should have a focusable target (a visually hidden "Continue to next review" button) so keyboard users can advance.

**Exit (Step 4):**
- "Review more" button and close "✕" button must be focusable.

---

#### Star Rating — Radio Group Pattern

Implement as a **radio group**, not individual buttons:

```
<div role="radiogroup" aria-label="דירוג">
  <input type="radio" role="radio" aria-label="כוכב 1 מתוך 5" value="1" />
  <input type="radio" role="radio" aria-label="כוכב 2 מתוך 5" value="2" />
  ...
</div>
```

- **Arrow keys** (Left/Right in RTL context) move between stars and select. This is the standard radio group keyboard pattern.
- **Tab** moves focus into/out of the group as a single stop (not 5 tab stops).
- On selection change, announce the new value: `aria-live="polite"` region or rely on the native radio announcement.
- Tap-to-deselect (clearing the rating) needs a mechanism: provide a visually hidden "clear rating" button, or allow pressing Delete/Backspace on the focused star to clear. Announce "דירוג נמחק" via live region.

---

#### Expression Chips — Toggle Buttons

Each chip should be a `<button>` with `aria-pressed="true|false"`:

```html
<button role="button" aria-pressed="false">משחק מעולה</button>
```

- **Enter/Space** toggles the chip (standard button behavior — no extra work needed).
- When toggled on: announce state change via `aria-pressed`. Screen readers will say "pressed" / "not pressed".
- The scrollable chip row needs `role="toolbar"` with `aria-label="ביטויים מוצעים"`. Arrow keys move focus between chips (roving tabindex). Tab exits the toolbar.
- The scroll container must not trap keyboard focus — ensure the overflow-x scroll doesn't interfere with arrow key behavior.

---

#### Screen Reader Announcements

Use `aria-live="polite"` regions for dynamic content changes:

| Event | Announcement |
|-------|-------------|
| Show selected/deselected in grid | "נבחרה: [show title]" / "הוסרה: [show title]". Also update the "Next" button label: "המשך (3 הצגות נבחרו)". |
| Step transition to review form | "ביקורת 2 מתוך 5: [show title]" — announced when the review step mounts. |
| Review submitted (celebration) | "הביקורת שלך פורסמה!" |
| Submission error | Error message announced immediately. |
| Rate limit hit | Rate limit message announced. |
| Auto-advance to next show | "עוברים להצגה הבאה" announced before transition. |
| Flow complete (exit) | "ביקרתם [N] הצגות!" |

The progress indicator ("ביקורת 2 מתוך 5") should be an `aria-live` region or use `role="status"` so updates are announced without requiring focus.

---

#### Focus Management on Step Transitions

| Transition | Focus target |
|-----------|-------------|
| Step 1 → Step 2 | Star rating (first interactive element in review form). Pair with the progress announcement. |
| Step 2 → Step 3 (celebration) | If display name prompt shown: name text input. If no prompt: a visually hidden "continue" button or the "Next" link. |
| Step 3 → Step 2 (next show) | Star rating of the next review form. |
| Any → Step 4 (exit) | The summary heading ("ביקרתם N הצגות!") — make it focusable with `tabIndex={-1}` and move focus there programmatically. |

Use `useEffect` to move focus after each step transition. Wrap in `requestAnimationFrame` to ensure the DOM has updated after the CSS transition.

---

#### Celebration Auto-Advance Timer

The 2.5-second auto-advance is problematic for screen reader users who may still be hearing the celebration announcement.

**Recommendation:** Do **not** attempt screen-reader detection (unreliable and considered an anti-pattern). Instead:
- **Always require manual advance.** Replace the auto-advance timer with a prominent "Next" button that the user must activate. The celebration moment is brief enough that one extra tap/keypress is negligible friction.
- If auto-advance is kept: extend the timer to **5 seconds minimum** and provide a "Pause" control. The `prefers-reduced-motion` media query can also disable auto-advance (users who prefer reduced motion often have accessibility needs).
- The timer already pauses for the display name prompt — no additional work there.

**Recommended approach:** Keep auto-advance as a visual UX nicety (sighted users see the celebration and it moves on), but make the "Next" button the primary interaction. If the timer fires before the user acts, it advances — but keyboard/screen reader users can take their time because focus remains on the "Next" button regardless of the timer.

---

#### Color Contrast

Verify against WCAG 2.1 AA (minimum 4.5:1 for normal text, 3:1 for large text and UI components):

| Element | Foreground | Background | Check |
|---------|-----------|------------|-------|
| Selected card border (primary on white) | Primary color | White | Must meet 3:1 for non-text UI |
| Checkmark badge (white on primary) | White | Primary | Must meet 4.5:1 |
| Active chip (white text on primary) | White | Primary | Must meet 4.5:1 |
| Inactive chip (dark grey on #F0F0F0) | Dark grey | #F0F0F0 | Must meet 4.5:1 |
| Disabled submit (greyed out) | Grey text on grey bg | — | Must meet 3:1 for disabled state (WCAG does not require contrast for disabled controls, but it's good practice to still provide 3:1) |
| Gold stars (#F5A623) on white | #F5A623 | White | **Fails** at 2.1:1. Add a darker stroke/outline to stars, or use a darker gold (#B8860B or similar) that meets 3:1 for UI components. |
| Progress bar (primary on white) | Primary | White | Must meet 3:1 |
| "Finish" text link (medium grey on white) | Medium grey | White | Must meet 4.5:1 — if "medium grey" is #999, it fails. Use #767676 or darker. |

**Action item:** The gold star color (#F5A623) almost certainly fails contrast on white. Choose a darker gold or add a visible outline.

---

#### Motion Sensitivity (`prefers-reduced-motion`)

Wrap all animations in a `prefers-reduced-motion` media query:

```css
@media (prefers-reduced-motion: reduce) {
  /* Disable or replace with instant transitions */
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Specifically:
- **Confetti burst:** Skip entirely when reduced motion is preferred. Show a static checkmark + text instead.
- **Checkmark stroke animation:** Replace with an instant-appear checkmark.
- **Step transitions (slide/fade):** Replace with instant swap (no slide, no fade).
- **Star fill animation:** Instant fill, no sequential wipe.
- **Progress bar width animation:** Instant width change.
- **Odometer counting animation (exit screen):** Show final number immediately.
- **Chip selection scale/color animation:** Instant toggle.

Implementation: use the `usePrefersReducedMotion()` hook (or CSS media query) and conditionally skip JS-driven animations (confetti). CSS animations are handled by the global media query rule above.

---

#### Touch Target Sizes

The UX spec already specifies 44×44px touch targets for stars, which meets **WCAG 2.5.8 (Target Size - Minimum, Level AA)**. Verify the following also meet 44×44px:

| Element | Specified size | Status |
|---------|---------------|--------|
| Star rating targets | 44×44px | Meets WCAG |
| Expression chips | 44px height, 12px horizontal padding | Meets WCAG (updated from 36px in UX spec) |
| Show cards in selection grid | Large (poster-sized) | Meets WCAG |
| Checkmark badge | 28×28px visible, but tap target is the whole card | Meets WCAG (card is the target) |
| "Next" / "Submit" buttons | 48px height, full width | Meets WCAG |
| "Finish" text link | 14px text, no specified hit area | **Likely below 44px.** Add padding or min-height to create a 44×44px touch target. |
| Close "✕" button | Not specified | **Must be at least 44×44px.** |
| Display name prompt buttons | Not specified | **Must be at least 44×44px.** |

**Action items:** Ensure chips, "Finish" link, close button, and display name buttons all have 44×44px minimum touch targets (via padding or min-height, even if the visible element is smaller).

---

#### Summary of a11y Action Items

1. **Star rating:** Implement as radio group with arrow-key navigation. Fix gold color contrast.
2. **Expression chips:** Use `aria-pressed` toggle buttons in a `role="toolbar"`. Touch target already 44px (fixed in UX spec).
3. **Grid selection:** Implement roving tabindex grid pattern. Announce selection changes.
4. **Focus management:** Programmatically move focus on every step transition.
5. **Screen reader announcements:** Add `aria-live` regions for progress, celebrations, and errors.
6. **Celebration timer:** Make manual "Next" button the primary interaction; auto-advance is supplementary.
7. **Reduced motion:** Respect `prefers-reduced-motion` for all animations; skip confetti entirely.
8. **Contrast:** Fix star gold (#F5A623), "Finish" link grey, and disabled submit colors.
9. **Touch targets:** Chips fixed (44px). Still need to fix "Finish" link, close button, and display name buttons.

---

### Analytics / Success Metrics

Track the following to measure whether the feature achieves its goal (more reviews):

**Funnel metrics (instrument per step):**
- Entry: visits to `/reviews/batch`
- Step 1 → Step 2: how many users select shows and proceed (conversion rate)
- Per-review completion: submit rate vs skip rate vs abandon rate within the loop
- Step 4 reached: how many complete the full loop
- "Review more" click rate on exit screen

**Volume metrics:**
- Avg reviews per batch session (target: 3+)
- Total reviews from batch flow vs single-review flow (weekly)
- % of all new reviews coming from batch flow

**Quality metrics:**
- Avg text length in batch reviews vs regular reviews (are they lower quality?)
- Chip usage rate: what % of batch reviews use expression chips
- Which chips are most/least used (informs chip list curation)

**Engagement metrics:**
- Return rate: do users who complete a batch come back to batch-review again?
- Display name adoption: what % of anonymous users choose a name vs stay anonymous?

**Implementation note:** Instrument via lightweight client-side events (e.g., a simple `logEvent(name, data)` utility that POSTs to an analytics endpoint or logs to console in dev). Define the events during implementation; no third-party analytics SDK needed initially.

---

### Implementation Tasks

Break implementation into 5 sequential chats. Each builds on the previous.

**Task 1 — Foundation + Show Selection Grid (Step 1)**
- Route `/reviews/batch`, page server component, data fetching (`src/lib/data/batchReview.ts` with `getBatchShows`, `getReviewedShowIds`, `getAnonymousReviewedShowIds`, `interleaveNeedsReviews`)
- `BatchReviewFlow` client component with `useReducer` state machine (all 4 steps stubbed, only Step 1 functional)
- `ShowSelectionGrid` + `SelectableShowCard` with search (Hebrew ה-prefix aware), theatre filter dropdown, multi-select with checkmarks
- `src/constants/expressionChips.ts` constant file
- `REVIEWS_BATCH` route constant
- Sticky bottom bar with "Next" button (dynamic count label)
- Empty states (no results, loading skeletons)
- Status: [x]

**Task 2 — Review Step (Step 2)**
- `ReviewStep` component with layout (progress bar, show card, stars, chips, textarea, submit)
- `StarRating` component (tap/drag, RTL fill, `role="radiogroup"` a11y)
- `ExpressionChips` component (scrollable row, one-way insert, `aria-pressed` toggles)
- Textarea (auto-expand, character counter at 500+)
- Wire submit to existing `createReview` / `createAnonymousReview` server actions
- Skip ("דלג") link — advances without submitting
- Progress indicator ("ביקורת 2 מתוך 5") — advances on skip, total stays same
- Title field intentionally omitted
- Status: [x]

**Task 3 — Celebration + Display Name (Step 3)**
- `CelebrationStep` component (checkmark stroke animation CSS, confetti canvas burst dynamically imported)
- Server-gated auto-advance: animation plays immediately, timer starts only after server confirms, "שומר..." indicator if slow, snap back on error
- `DisplayNamePrompt` for anonymous users (first review only, appears during server pending, pauses auto-advance until choice made)
- Display name persisted in reducer state for subsequent reviews
- Toast on name save, no toast on anonymous choice
- Error handling: snap back to ReviewStep with pre-filled fields on failure
- Status: [x]

**Task 4 — Exit Summary + Polish (Step 4)**
- `ExitSummary` component (review count, show list with ratings, "Review more" button)
- "Review more" re-fetches from server (fresh `alreadyReviewedIds`), returns to Step 1
- "Finish" text link (top corner, subdued, visible in Steps 2-3)
- Close "✕" button with confirmation dialog if unfinished reviews remain
- Step transitions (slide/fade per UX spec)
- `prefers-reduced-motion`: disable confetti, replace animations with instant swaps
- Hide site header/footer in the flow
- Status: [x]

**Task 5 — Accessibility + Analytics**
- Keyboard navigation: grid roving tabindex (`role="grid"`), star radio group with arrow keys, chip toolbar with roving tabindex
- Focus management on every step transition (per focus target table in a11y section)
- Screen reader announcements (`aria-live="polite"` regions for selection changes, progress, celebrations, errors)
- Color contrast fixes: star gold → darker gold meeting 3:1, "Finish" link → #767676 or darker, ensure all interactive states meet WCAG AA
- Touch targets: verify "Finish" link, close button, display name buttons all ≥44×44px
- Analytics event instrumentation (`logEvent` utility, funnel/volume/quality/engagement events per Analytics section)
- Status: [x]

### Planning Status
- [x] Product spec
- [x] UX/UI design details
- [x] Architecture / technical design
- [x] Security review
- [x] Accessibility (a11y)
- [x] Analytics / success metrics
- [x] Implementation (5/5 tasks)
