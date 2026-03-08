# Anonymous Review Success Banner Fix

## The Problem

When a logged-in user submits a review on a show page, they see a green success banner (ReviewSuccessBanner) with a preview of their review, share buttons, and a review count milestone. However, when a logged-out (anonymous) user submits a review, this banner does not appear.

## Root Cause

The show page (`src/app/shows/[slug]/page.tsx`) identifies "your review" by matching `session.user.id` against reviews in the database. Anonymous reviews have `userId: null`, so they never match — meaning `userReview` is always `null` for anonymous visitors.

Two different success flows existed:

**Authenticated flow:**

- Server action `createReview` writes review → calls `revalidatePath` (invalidates ISR cache) → returns
- InlineReviewForm calls `router.replace('/shows/slug?review=success&count=N')`
- Page re-renders fresh, finds `userReview` by userId, renders ReviewSuccessBanner server-side
- Works because: success state is in the URL (survives revalidation) AND `userReview` is found by userId

**Anonymous flow (broken):**

- Server action `createAnonymousReview` writes review → calls `revalidatePath` → returns
- InlineReviewForm stores success in React `useState` (ephemeral client state)
- `revalidatePath` triggers a server re-render which can unmount/remount the component, destroying the state
- Even if state survived, the show page never populated `userReview` for anonymous visitors, so the server-rendered banner path was unreachable
- Result: banner lost on re-render

## Solutions Considered

### 1. Pseudo Users (IP-based users in DB) — Rating: 3/10

Create User rows keyed by IP address to make anonymous reviewers look like registered users.

- Doesn't actually solve the problem without also creating sessions for anonymous visitors
- Pollutes the User table with ephemeral IP-based records
- Shared IPs (offices, VPNs) conflate different people
- Privacy concerns with storing IP as persistent user identity
- Schema friction — `User.email` has a `@unique` constraint
- Significant effort for what is a UI display bug

### 2. Local Cache (localStorage/sessionStorage) — Rating: 6/10

Store review data in localStorage after submission, read it on component mount.

- Survives revalidation (unlike useState)
- Creates rendering inconsistency: auth users get server-rendered banner, anon users get client-rendered
- Potential hydration mismatch (server doesn't know about localStorage)
- Banner would flash in after hydration rather than being present on first paint

### 3. Cookie-based Flash Message — Rating: 7/10 (v1) then refined

Server action sets a short-lived cookie with review data; show page reads it and renders banner.

- Unifies both flows, server-rendered, established web pattern (Rails flash, Django messages)
- Problem: review text can be up to 5000 chars, cookies have ~4KB limit
- Refined to store only `{ showId, reviewCount }` in cookie + DB lookup for review text
- Still introduces a new pattern/file for something the architecture almost handles

### 4. Extend `userReview` to anonymous visitors (CHOSEN) — Rating: 9/10

The codebase already treats IP as the anonymous reviewer's identity for dedup (`@@index([ip, showId])`). The show page should do the same for display.

## The Solution

**Core insight:** The page already knows how to identify anonymous reviewers by IP (the dedup logic in `createAnonymousReview` does `findFirst({ where: { ip, showId, userId: null } })`). The show page just wasn't using that same logic to find "your review."

### Changes Made

**1. `src/app/shows/[slug]/page.tsx`** — Added an `else` branch to the session check:

- When there's no session, get the visitor's IP from `headers()`
- Query `prisma.review.findFirst({ where: { ip, showId, userId: null } })`
- If found, assign it to `userReview` and filter from `otherReviews`
- This uses the existing `@@index([ip, showId])` index — negligible cost
- ~10 lines added

**2. `src/components/InlineReviewForm/InlineReviewForm.tsx`** — Unified both flows:

- Removed the anonymous-specific success branch (useState for success/submittedReview/reviewCount)
- Both auth and anon now use the same `router.replace('/shows/${slug}?review=success&count=N')` pattern
- Removed client-side ReviewSuccessBanner import and rendering
- Removed `SubmittedReview` interface
- ~25 lines removed, 0 new files

### Why This Solution Is Best

| Aspect                | Detail                                   |
| --------------------- | ---------------------------------------- |
| New files             | 0                                        |
| New patterns          | None — extends existing IP dedup pattern |
| Lines added           | ~10                                      |
| Lines removed         | ~25                                      |
| Server action changes | None                                     |
| Consistency           | Auth and anon flows are now identical    |

**Bonus UX improvements beyond the banner:**

- Anonymous visitors who already reviewed see their review highlighted at the top
- The review form is hidden for anonymous visitors who already reviewed (consistent with auth behavior)
- The "scroll to write review" button is hidden (consistent with auth behavior)
- The sticky CTA is hidden (consistent with auth behavior)

### Edge Cases

- **Shared IPs (office/VPN):** Multiple anonymous reviewers behind the same IP see each other's review. This is identical to the existing dedup constraint (which already blocks the second person from reviewing). The display is now consistent with the enforcement.
- **Stale data:** Not a concern. `revalidatePath` runs synchronously inside the server action before it returns. By the time `router.replace` triggers the next render, the ISR cache is already invalidated and the page fetches fresh data.
- **Dynamic rendering:** The page already uses `getServerSession` (reads cookies), so it's already per-request dynamic. Adding `headers()` for IP doesn't change this.

### Verification

- Log out → submit review on show page → green banner with full review preview appears ✅
- Log in → submit review on show page → same green banner appears ✅
- Refresh page → banner gone (URL params cleaned by ReviewSuccessBanner on mount) ✅
- Anonymous visitor who already reviewed → sees their review at top, no form shown ✅
- Unit tests: 0 new failures (14 pre-existing failures unchanged) ✅
