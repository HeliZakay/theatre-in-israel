# Review System Architecture Review

_Date: March 8, 2026_

## 1. ANON_REVIEW_BANNER_FIX.md — Assessment

**The bug:** After an anonymous user submits a review via the inline form on the show page, the green `ReviewSuccessBanner` (review preview, share buttons, milestone count) never appeared — even though it worked fine for authenticated users.

**Root cause (well-identified):** Two issues compounding:

- The show page matched "your review" by `session.user.id === review.userId`. Anonymous reviews have `userId: null`, so `userReview` was always `null`.
- The anonymous flow initially stored success state in React `useState`, which gets destroyed when `revalidatePath` triggers a server re-render.

**The fix:** Extend the show page to identify anonymous visitors by IP (the same identity model already used for dedup). Both flows now converge on `router.replace('/shows/slug?review=success&count=N')` — a URL-based success signal that survives server re-renders. ~10 lines added, ~25 removed, 0 new files.

**Verdict: Solid.** Minimal surface area, reuses existing patterns, brings anon UX to parity with authenticated UX. The bonus behavior (anonymous returning visitor sees their review highlighted, form hidden, CTAs hidden) is a meaningful UX win.

**One concern:** The fix deepens the dependency on IP-based identity. Shared-IP users (offices, VPNs, university Wi-Fi) will see someone else's review as "theirs" — banner shown, form hidden, CTAs removed. Documented as a known tradeoff but worth monitoring in analytics.

---

## 2. Review Flow Architecture

### Entry Points

| Entry Point                | Route                  | Component                       |
| -------------------------- | ---------------------- | ------------------------------- |
| Inline form on show page   | `/shows/[slug]`        | `InlineReviewForm`              |
| Dedicated show review page | `/shows/[slug]/review` | `ReviewForm`                    |
| Generic new review page    | `/reviews/new`         | `ReviewForm` (with show picker) |

### Data Flow

**Submission:** Form → server action (`createReview` or `createAnonymousReview`) → Zod validation → rate limit check → dedup check → `addReview()` → Prisma insert + `refreshShowStats` (denormalized `avgRating`/`reviewCount`) → `revalidatePath` on show page + lists → return `{ showId, reviewCount }`.

**Identity model:**

- Authenticated: `@@unique([userId, showId])` DB constraint
- Anonymous: Application-level IP query (`findFirst({ where: { ip, showId, userId: null } })`)

**Anti-abuse:** Honeypot field (silent fake success), IP rate limiting (20/hr anon, 50/hr auth), profanity filter on title/text/author.

### Key Files

**Pages:**

- `src/app/shows/[slug]/page.tsx` — Show detail page (reviews, inline form, success banner)
- `src/app/shows/[slug]/review/page.tsx` — Dedicated show review page
- `src/app/reviews/new/page.tsx` — Generic new review page with show picker
- `src/app/me/reviews/[id]/edit/EditReviewForm.tsx` — Edit review form

**Server Actions & Data Layer:**

- `src/app/reviews/actions.ts` — `createReview`, `createAnonymousReview`, `updateReview`, `deleteReview`
- `src/lib/reviews.ts` — `addReview`, `getReviewsByUser`, `updateReviewByOwner`, `deleteReviewByOwner`
- `src/lib/reviewSchemas.ts` — Zod schemas for all review operations

**Components:**

- `src/components/InlineReviewForm/InlineReviewForm.tsx`
- `src/components/ReviewForm/ReviewForm.tsx`
- `src/components/ReviewFormFields/ReviewFormFields.tsx`
- `src/components/ReviewSuccessBanner/ReviewSuccessBanner.tsx`
- `src/components/ReviewAuthGateway/ReviewAuthGateway.tsx`
- `src/components/StickyReviewCTA/StickyReviewCTA.tsx`
- `src/components/ScrollToReviewButton/ScrollToReviewButton.tsx`
- `src/components/ReviewCard/ReviewCard.tsx`

**Supporting:**

- `src/utils/reviewRateLimit.ts` — Rate limiting
- `src/types/index.ts` — `Review`, `ReviewInput` interfaces
- `src/constants/featureFlags.ts` — `ENABLE_REVIEW_AUTH_GATEWAY`
- `prisma/schema.prisma` — Review model

---

## 3. Architectural Issues Found

### A. Two Divergent Success Flows (UX inconsistency) — FIXED

- **InlineReviewForm** (show page): submits → `router.replace` with `?review=success&count=N` → server-rendered `ReviewSuccessBanner` with review preview, share buttons, milestone count
- **ReviewForm** (full-page): was showing local `useState` success → inline "redirecting..." message → `setTimeout` (1.8–4s) → `router.push('/shows/slug')` without `?review=success`
- **Fix applied:** `ReviewForm` now redirects immediately with `?review=success&count=N`, matching the inline flow. Lottery inline display removed (entries still recorded server-side).

### B. Feature Flag Asymmetry — FIXED

`ENABLE_REVIEW_AUTH_GATEWAY` is `false`. When enabled, it gates `/reviews/new` and `/shows/[slug]/review` but previously **not** the inline form on the show page.

- **Fix applied:** Show page now checks `ENABLE_REVIEW_AUTH_GATEWAY && !session`. When true, the inline form is replaced with a CTA link to `/shows/[slug]/review` (which shows the gateway). `StickyReviewCTA` and `ScrollToReviewButton` also link there instead of scrolling to `#write-review`. All three entry points are now gated consistently.

### C. Dual Uniqueness Mechanisms

Auth dedup: `@@unique([userId, showId])` DB constraint. Anon dedup: app-level IP check. PostgreSQL treats `NULL` as distinct in unique constraints, so the DB constraint does NOT prevent multiple anonymous reviews. If either mechanism is modified without understanding the other, duplicates can slip through.

### D. Stale Rate Limit Documentation — FIXED

`SYSTEM_DESIGN.md` previously said "Create: 3/hr, Edit: 10/hr (in-memory Map)." Actual code: Auth 50/hr, Anon 20/hr (5/hr unknown IP), Edit/delete 50/hr — all DB-backed.

- **Fix applied:** Updated Mermaid diagram, Component Summary table, and Scaling Improvements section in `SYSTEM_DESIGN.md` to match the actual values and implementation.

### E. No Edit/Delete for Anonymous Reviews

By design — but no moderation/flagging mechanism exists for problematic anonymous content.

### F. Redirect Race in Full-Page Form

`ReviewForm` used `setTimeout` → `router.push` after submission. Fixed as part of Issue A — immediate redirect eliminates the race.
