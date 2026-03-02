# Anonymous Reviews — Implementation Plan

**Goal:** Allow visitors to leave reviews without signing in, while keeping the existing authenticated review flow unchanged. Reduce friction → more reviews.

**Decisions made:**

- Optional auth: visitors CAN review without an account; signed-in users keep edit/delete/my-reviews
- IP-based dedup: one anonymous review per IP per show
- Name field: optional, defaults to "אנונימי"
- Spam mitigation: honeypot + IP rate limiting (20/hr) + profanity filter

---

## Pre-existing support in the codebase

- `Review.userId` is already `String?` (nullable) in Prisma schema
- `Review.author` is a denormalized string (not derived from User at read time)
- `addReview()` in `src/lib/reviews.ts` already accepts optional `userId` in `ReviewInput`
- `@@unique([userId, showId])` — PostgreSQL treats NULL as distinct, so this won't block multiple anonymous reviews (IP dedup handles that instead)
- Contact form (`src/app/contact/actions.ts`) already implements the exact anonymous pattern: IP rate limit + honeypot + profanity filter
- The "כתב.י ביקורת" CTA on show pages is already visible to all visitors (auth is only checked on the review page itself)

---

## Steps

### Step 1: Add `ip` column to Review model

**File:** `prisma/schema.prisma`

- Add `ip String?` field to the `Review` model (only populated for anonymous reviews)
- Run `npx prisma migrate dev --name add_ip_to_review`

### Step 2: Extend Zod schemas

**File:** `src/lib/reviewSchemas.ts`

- Add `honeypot` field (string, optional) to `createReviewSchema` (server-side)
- Create `clientAnonymousReviewSchema` extending existing client fields with:
  - `name`: string, max 80 chars, optional (trimmed), profanity-checked via refine
  - `honeypot`: string (empty by default)

### Step 3: Add IP-based rate limit for anonymous reviews

**File:** `src/utils/reviewRateLimit.ts` (extend existing)

- Add `checkAnonymousReviewRateLimit(ip)` — uses the existing `checkRateLimit` utility with key `ip:${ip}`, action `"anonymous-review"`, limit 20, window 1 hour
- Follow the same pattern as `src/utils/contactRateLimit.ts`

### Step 4: Create `createAnonymousReview` server action

**File:** `src/app/reviews/actions.ts`

New exported async function `createAnonymousReview(formData: FormData)`:

1. Get IP from `headers().get("x-forwarded-for")` (fallback to `"unknown"`)
2. **Honeypot check** — if `honeypot` field is non-empty, return fake success `{ success: true, showSlug }` (silent bot rejection, no DB write)
3. **IP rate limit** — `checkAnonymousReviewRateLimit(ip)`, return error if exceeded
4. **Zod validation** — parse with `createReviewSchema` (which now includes honeypot)
5. **Profanity filter** — `checkFieldsForProfanity({ title, text, name })`
6. **IP dedup** — query `prisma.review.findFirst({ where: { ip, showId, userId: null } })`. If found, return error `"כבר כתבת ביקורת להצגה זו"`
7. **Create review** — `addReview(showId, { author: name?.trim() || "אנונימי", title, text, rating, date: new Date(), ip })` — note: no `userId`
8. **Revalidate** — same `revalidatePath` calls as `createReview`
9. **Error handling** — catch `P2003` (invalid show FK), generic errors

### Step 5: Update `addReview` in data layer

**File:** `src/lib/reviews.ts`

- Add `ip?: string` to `ReviewInput` type
- Pass `ip` through to `prisma.review.create({ data: { ..., ip } })`

### Step 6: Remove auth gate from review pages

**File:** `src/app/reviews/new/page.tsx`

- Replace `requireAuth(ROUTES.REVIEWS_NEW)` with `const session = await getServerSession(authOptions)`
- Pass `isAuthenticated={!!session}` to `<ReviewForm>`

**File:** `src/app/shows/[slug]/review/page.tsx`

- Replace `requireAuth(showReviewPath(slug))` with `const session = await getServerSession(authOptions)`
- Pass `isAuthenticated={!!session}` to `<ReviewForm>`

### Step 7: Update ReviewForm component

**File:** `src/components/ReviewForm/ReviewForm.tsx`

- Accept `isAuthenticated` prop (boolean)
- When `!isAuthenticated`:
  - Show a **name input** field (optional, placeholder "אנונימי", max 80 chars)
  - Add a hidden **honeypot** field (CSS-hidden via `position: absolute; left: -9999px`, NOT `display:none` which bots detect)
  - Use `clientAnonymousReviewSchema` for `zodResolver`
  - Call `createAnonymousReview(formData)` on submit instead of `createReview(formData)`
  - Show a subtle prompt: "יש לך חשבון? [התחבר.י](/auth/signin?callbackUrl=...) כדי לערוך ביקורות בעתיד"
- When `isAuthenticated`: unchanged behavior

### Step 8 (optional): Badge on anonymous reviews

**File:** `src/components/ReviewCard/ReviewCard.tsx`

- If `review.userId === null`, show a subtle "(אורח/ת)" label next to the author name
- Requires passing `userId` (or a boolean `isAnonymous` flag) to ReviewCard — check what data the show detail page passes

### Step 9: Update tests

**Unit tests** (new file or extend existing):

- `createAnonymousReview`: honeypot rejection, rate limiting, IP dedup, validation errors, profanity rejection, successful creation
- Verify `createReview` (authenticated) is unchanged

**E2E tests** (`e2e/reviews.spec.ts`, `e2e/review-validation.spec.ts`):

- Anonymous visitor can submit a review (no sign-in)
- Anonymous review appears on show page
- Anonymous visitor cannot submit two reviews for the same show
- Authenticated flow still works as before
- Name field defaults to "אנונימי" when left blank

---

## Verification checklist

- [ ] `npx prisma migrate dev` succeeds
- [ ] All existing tests pass (`npm test`, `npx playwright test`)
- [ ] Logged-out: visit show page → click "כתב.י ביקורת" → form with name field → submit → review appears
- [ ] IP dedup: second anonymous review for same show → error
- [ ] Honeypot: submit with honeypot filled → silent fake success, no review created
- [ ] Rate limit: 4th anonymous review in an hour → rate limit error
- [ ] Logged-in: review flow unchanged (no name field, uses session, can edit/delete)
- [ ] "My Reviews" page unchanged (only shows authenticated user's reviews)

---

## File change summary

| #   | File                                       | Change type                                      |
| --- | ------------------------------------------ | ------------------------------------------------ |
| 1   | `prisma/schema.prisma`                     | Add `ip String?` to Review                       |
| 2   | `src/lib/reviewSchemas.ts`                 | Add anonymous schemas + honeypot                 |
| 3   | `src/utils/reviewRateLimit.ts`             | Add `checkAnonymousReviewRateLimit(ip)`          |
| 4   | `src/app/reviews/actions.ts`               | Add `createAnonymousReview` action               |
| 5   | `src/lib/reviews.ts`                       | Add `ip` to `ReviewInput` + pass through         |
| 6   | `src/app/reviews/new/page.tsx`             | Remove `requireAuth`, pass `isAuthenticated`     |
| 7   | `src/app/shows/[slug]/review/page.tsx`     | Remove `requireAuth`, pass `isAuthenticated`     |
| 8   | `src/components/ReviewForm/ReviewForm.tsx` | Conditional name/honeypot fields, action routing |
| 9   | `src/components/ReviewCard/ReviewCard.tsx` | Optional "(אורח/ת)" badge                        |
| 10  | Tests (unit + E2E)                         | Cover anonymous flow                             |
