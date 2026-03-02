# Review Auth Gateway — Implementation Plan

**Goal:** When an unauthenticated visitor clicks "כתב.י ביקורת" (write a review), show them a choice screen before the review form: sign up, log in, or continue as a guest. Authenticated users skip straight to the form as before.

**Applies to:** Both entry points — `/shows/{slug}/review` and `/reviews/new`.

---

## Design decisions

- **Centered card UI** — matches the existing sign-in/sign-up page pattern (white card, shadow, max 520px, centered on page).
- **Query param `?guest=1`** — used to bypass the gateway and go straight to the anonymous form. This keeps the gateway as a pure server component (no client JS), and makes the "continue as guest" choice linkable.
- **Server component** — no client-side state needed; the gateway is just links.
- **Both entry points** get the gateway for a consistent experience.

---

## Steps

### Step 1: Create ReviewAuthGateway component

**New file:** `src/components/ReviewAuthGateway/ReviewAuthGateway.tsx`

Server component. Props:

- `callbackUrl: string` — the current review page URL (so auth pages redirect back here after login)

Renders a centered card with:

1. **Title:** "כתיבת ביקורת"
2. **Subtitle:** "איך תרצה להמשיך?" (How would you like to continue?)
3. **Sign-up button** (primary, red) — links to `/auth/signup?callbackUrl={callbackUrl}`
4. **Sign-in button** (secondary, outlined) — links to `/auth/signin?callbackUrl={callbackUrl}`
5. **Benefit note** — small muted text: "עם חשבון תוכל.י לערוך ולמחוק ביקורות" (with an account you can edit and delete reviews)
6. **Divider** — horizontal line with "או" (or) in the center
7. **Continue as guest link** (ghost/text style) — links to the same page with `?guest=1` appended
8. **Back link** — navigates back to the previous page (show page or home)

### Step 2: Create ReviewAuthGateway CSS module

**New file:** `src/components/ReviewAuthGateway/ReviewAuthGateway.module.css`

Reuse the auth card design system from `src/app/auth/signin/page.module.css`:

- `.page` — `min-height: calc(100dvh - var(--header-h)); display: grid; place-items: center;` with clamped padding
- `.card` — `width: min(100%, 520px); background: #fff; border-radius: 16px; box-shadow; border; padding: clamped; display: grid; gap: 14px;`
- `.title` — `font-size: clamp(1.5rem, 4vw, 2rem); font-weight: 700; text-align: center;`
- `.subtitle` — `color: rgba(26,26,26,0.72); text-align: center;`
- `.primaryBtn` — `background: var(--color-curtain-red); color: #fff; border-radius: 10px; padding: 12px; font-weight: 600; text-align: center; display: block; text-decoration: none;`
- `.secondaryBtn` — `background: #fff; color: var(--color-text-primary); border: 1px solid rgba(26,26,26,0.2); border-radius: 10px; padding: 12px; font-weight: 600; text-align: center; display: block; text-decoration: none;`
- `.divider` — horizontal rule with centered "או" text (using `::before`/`::after` pseudo-elements, matching the sign-in page divider)
- `.guestLink` — `text-align: center; color: var(--color-curtain-red); font-weight: 600; text-decoration: underline; cursor: pointer;`
- `.benefitNote` — `font-size: 0.85rem; color: rgba(26,26,26,0.55); text-align: center;`
- `.backLink` — `text-align: center; font-weight: 600; color: var(--color-text-primary); text-decoration: none;`
- Hover/focus states on all interactive elements with transitions

### Step 3: Wire up show-specific review page

**File:** `src/app/shows/[slug]/review/page.tsx`

The page already calls `getServerSession(authOptions)` and computes `isAuthenticated`.

Changes:

- Accept `searchParams` in the page props (standard Next.js page component pattern)
- Add conditional rendering logic:
  - If `isAuthenticated` → render `<ReviewForm>` directly (unchanged)
  - If `!isAuthenticated && searchParams.guest !== "1"` → render `<ReviewAuthGateway callbackUrl={showReviewPath(slug)} />`
  - If `!isAuthenticated && searchParams.guest === "1"` → render `<ReviewForm isAuthenticated={false}>` (current anonymous flow)

### Step 4: Wire up generic review page

**File:** `src/app/reviews/new/page.tsx`

Same pattern:

- Accept `searchParams` in the page props
- Add conditional rendering logic:
  - If `isAuthenticated` → render `<ReviewForm>` directly (unchanged)
  - If `!isAuthenticated && searchParams.guest !== "1"` → render `<ReviewAuthGateway callbackUrl={ROUTES.REVIEWS_NEW} />`
  - If `!isAuthenticated && searchParams.guest === "1"` → render `<ReviewForm isAuthenticated={false}>`

### Step 5: Update E2E tests

**Files:** `e2e/anonymous-reviews.spec.ts`, `e2e/reviews.spec.ts`, `e2e/review-validation.spec.ts`

- **Anonymous review tests:** After navigating to a review URL, click "המשך בלי חשבון" (continue without account) before filling the form.
- **New gateway test:** Unauthenticated user visits review page → sees gateway card with three options → verify:
  - Sign-up link has correct `callbackUrl`
  - Sign-in link has correct `callbackUrl`
  - Clicking "המשך בלי חשבון" shows the anonymous review form
- **Authenticated tests:** Should be completely unchanged (gateway never appears for logged-in users).
- **Direct `?guest=1` URL:** Navigating directly to `/shows/{slug}/review?guest=1` skips the gateway and shows the anonymous form.

### Step 6: Keep ReviewForm sign-in hint (no change needed)

**File:** `src/components/ReviewForm/ReviewForm.tsx`

The form currently shows "יש לך חשבון? התחבר.י כדי לערוך ביקורות בעתיד" at the bottom for anonymous users. **Keep this as-is** — it serves as a lighter secondary reminder for users who chose to continue as guests.

---

## File change summary

| #   | File                                                            | Change type                                           |
| --- | --------------------------------------------------------------- | ----------------------------------------------------- |
| 1   | `src/components/ReviewAuthGateway/ReviewAuthGateway.tsx`        | **New** — gateway component                           |
| 2   | `src/components/ReviewAuthGateway/ReviewAuthGateway.module.css` | **New** — gateway styles                              |
| 3   | `src/app/shows/[slug]/review/page.tsx`                          | **Modify** — add gateway for unauthenticated users    |
| 4   | `src/app/reviews/new/page.tsx`                                  | **Modify** — add gateway for unauthenticated users    |
| 5   | `e2e/anonymous-reviews.spec.ts`                                 | **Modify** — click through gateway in anonymous tests |
| 6   | `e2e/reviews.spec.ts`                                           | **Modify** — add gateway navigation test              |
| 7   | `e2e/review-validation.spec.ts`                                 | **Modify** — click through gateway if needed          |

---

## Verification checklist

- [ ] Logged-out: click "כתב.י ביקורת" on show page → gateway card appears with sign-up / sign-in / continue as guest
- [ ] Gateway: click "הרשמה" → navigates to `/auth/signup?callbackUrl=/shows/{slug}/review`
- [ ] Gateway: click "התחברות" → navigates to `/auth/signin?callbackUrl=/shows/{slug}/review`
- [ ] Gateway: click "המשך בלי חשבון" → anonymous review form appears (URL now has `?guest=1`)
- [ ] After sign-up/sign-in from gateway → redirected back to review page, form is authenticated (no name field, no honeypot)
- [ ] Logged-in: click "כתב.י ביקורת" → form appears immediately, no gateway
- [ ] `/reviews/new` (generic path): same gateway behavior for unauthenticated users
- [ ] Direct URL `/shows/{slug}/review?guest=1` → skips gateway, shows anonymous form
- [ ] All existing tests pass after E2E updates
- [ ] Mobile: gateway card looks good on small screens (responsive padding, full-width buttons)

---

## Visual mockup (text)

```
┌─────────────────────────────────────┐
│                                     │
│          כתיבת ביקורת               │
│       ?איך תרצה להמשיך              │
│                                     │
│  ┌─────────────────────────────┐    │
│  │         הרשמה               │    │  ← primary red button
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │        התחברות              │    │  ← outlined secondary button
│  └─────────────────────────────┘    │
│                                     │
│  עם חשבון תוכל.י לערוך ולמחוק      │  ← small muted benefit note
│           ביקורות                    │
│                                     │
│  ──────────── או ────────────────   │  ← divider
│                                     │
│        המשך בלי חשבון               │  ← underlined link
│                                     │
│           → חזרה                    │  ← back link
│                                     │
└─────────────────────────────────────┘
```
