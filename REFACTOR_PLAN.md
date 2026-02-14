# Refactor Plan: Architecture, DRY, Readability & Modularity

## Overview

This plan addresses 21 concrete improvements found across the Next.js codebase, organized into 7 focus areas. The highest-impact changes are: extracting a shared data-fetching pipeline, eliminating ~200 lines of duplicated auth/form code, expanding the CSS token system, and restructuring misnamed/dead modules.

---

## 1. Expand the CSS Design Token System

`src/app/tokens.css` has only 7 tokens. Dozens of raw values are copy-pasted across 15+ CSS modules.

### 1.1 Add tokens to `src/app/tokens.css`

```css
:root {
  /* existing */
  --background: #ffffff;
  --color-curtain-red: #9c1b20;
  --color-curtain-red-hover: #b12228;
  --color-text-primary: #1a1a1a;
  --header-offset: 96px;
  --focus-ring-color: rgba(156, 27, 32, 0.35);

  /* NEW: slate shadow/border at common opacities */
  --color-slate-006: rgba(15, 23, 42, 0.06);
  --color-slate-008: rgba(15, 23, 42, 0.08);
  --color-slate-012: rgba(15, 23, 42, 0.12);
  --color-slate-015: rgba(15, 23, 42, 0.15);
  --color-slate-020: rgba(15, 23, 42, 0.2);

  /* NEW: curtain-red alpha variants */
  --color-curtain-red-004: rgba(156, 27, 32, 0.04);
  --color-curtain-red-008: rgba(156, 27, 32, 0.08);
  --color-curtain-red-012: rgba(156, 27, 32, 0.12);
  --color-curtain-red-014: rgba(156, 27, 32, 0.14);
  --color-curtain-red-025: rgba(156, 27, 32, 0.25);
  --color-curtain-red-030: rgba(156, 27, 32, 0.3);
  --color-curtain-red-070: rgba(156, 27, 32, 0.7);

  /* NEW: border radii */
  --radius-sm: 12px;
  --radius-md: 16px;
  --radius-lg: 18px;
  --radius-pill: 999px;

  /* NEW: card surface */
  --card-bg: #ffffff;
  --card-border: 1px solid var(--color-slate-008);
  --card-shadow: 0 10px 20px var(--color-slate-006);

  /* NEW: text muted */
  --color-text-muted: rgba(26, 26, 26, 0.7);
  --color-text-faint: rgba(26, 26, 26, 0.55);
  --color-text-placeholder: rgba(26, 26, 26, 0.5);
}
```

### 1.2 Replace hardcoded values across CSS modules

Files to update (replace raw `rgba(15, 23, 42, *)` / `rgba(156, 27, 32, *)` / `12px` radius / etc. with the new tokens):

- `src/components/Card/Card.module.css`
- `src/components/ShowCard/ShowCard.module.css`
- `src/components/ReviewCard/ReviewCard.module.css`
- `src/components/ShowsSection/ShowsSection.module.css`
- `src/components/ReviewForm/ReviewForm.module.css`
- `src/components/ReviewFormFields/ReviewFormFields.module.css`
- `src/components/ShowCombobox/ShowCombobox.module.css`
- `src/components/ShowsFilterBar/ShowsFilterBar.module.css`
- `src/components/AppSelect/AppSelect.module.css`
- `src/components/Tag/Tag.module.css`
- `src/components/SearchBar/SearchBar.module.css` (if applicable)
- `src/components/FeaturedShow/FeaturedShow.module.css` (if applicable)

**Note:** Breakpoints (`640px`, `900px`, `1024px`) can't use CSS custom properties in media queries, so document them as comments only.

---

## 2. Eliminate Duplicated CSS Rules

### 2.1 Merge form field CSS

`src/components/ReviewFormFields/ReviewFormFields.module.css` is an **exact subset** of `src/components/ReviewForm/ReviewForm.module.css`. The duplicated rules are: `.field`, `.label`, `.input`, `.select`, `.textarea`, `.input::placeholder`, `.textarea::placeholder`, `.textarea` (resize), `.fieldError`, `.charMeta`.

**Action:** Remove these duplicated rules from `ReviewForm.module.css`. `ReviewForm` should import field-level styles from `ReviewFormFields.module.css` where needed, or `ReviewFormFields` owns all field styling and `ReviewForm` only has layout/action/poster/success styles.

### 2.2 Deduplicate spinner keyframes

Two identical spinner `@keyframes`:

- `ReviewForm.module.css`: `@keyframes submitSpin { to { transform: rotate(360deg); } }`
- `ShowsFilterBar.module.css`: `@keyframes spin { to { transform: rotate(360deg); } }`

**Action:** Move the `@keyframes spin` animation to `src/app/globals.css`. Reference it from both component CSS files. Also consolidate the `prefers-reduced-motion` rule.

### 2.3 Make `ReviewCard` use the `Card` component

`ReviewCard.tsx` renders `<article className={styles.card}>` with its own card surface CSS (bg, border, radius, shadow). `ShowCard` already composes the `<Card>` component.

**Action:** Wrap `ReviewCard` content in `<Card as="article">` and remove `.card` base surface styles from `ReviewCard.module.css` (keep padding, gap, height).

### 2.4 Fix cross-module CSS import

`src/components/ShowsSection/ShowsSection.tsx` imports `ShowCarousel.module.css` directly to reference `.slide` class. This couples two components via CSS.

**Action:** Move the `.slide` class to `ShowsSection.module.css` or create a shared module. Remove the cross-import.

### 2.5 Make `CtaStrip` compose the `Button` component

`src/components/CtaStrip/CtaStrip.tsx` has its own button style instead of composing `<Button>`.

**Action:** Use `<Button href={href}>{buttonText}</Button>` inside `CtaStrip`. Remove custom button CSS from `CtaStrip.module.css`.

---

## 3. Create Shared Utilities

### 3.1 Create `cx()` utility

`src/components/AppSelect/AppSelect.tsx` defines its own inline `cx()`:

```ts
function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
```

**Action:** Create `src/utils/cx.ts` exporting this function. Import it in `AppSelect` and anywhere else that conditionally joins class names (template literals / `.filter(Boolean).join(" ")` patterns).

---

## 4. Extract Shared Auth UI Components

### 4.1 Extract `GoogleIcon` and `FacebookIcon`

These ~40-line SVG components are **duplicated verbatim** between:

- `src/app/auth/signin/SignInButton.tsx` (lines 9-48)
- `src/app/auth/signup/SignUpForm.tsx` (lines 11-48)

**Action:** Create `src/components/SocialIcons/SocialIcons.tsx` (or `GoogleIcon.tsx` + `FacebookIcon.tsx`) exporting both components. Import in both auth files. Note: these icons reference `styles.socialIcon` from `page.module.css` — either pass `className` as a prop or move the icon sizing to a local class.

### 4.2 Extract `isValidCallbackUrl`

Duplicated identically in:

- `src/app/auth/signin/page.tsx` (line 10)
- `src/app/auth/signup/page.tsx` (line 11)

**Action:** Move to `src/utils/auth.ts` and import in both pages.

---

## 5. Consolidate API Route Logic

### 5.1 Extract `requireApiAuth` middleware helper

The pattern below is repeated in `POST /api/reviews`, `PATCH /api/reviews/[id]`, `DELETE /api/reviews/[id]`:

```ts
const session = await getServerSession(authOptions);
if (!session?.user?.id) {
  return apiError("...", 401);
}
const rateLimit = checkSomeRateLimit(session.user.id);
if (rateLimit.isLimited) {
  return apiError(`...${rateLimit.remainingTime}...`, 429);
}
```

**Action:** Create `src/utils/apiMiddleware.ts`:

```ts
export async function requireApiAuth(
  rateLimitFn?: (userId: string) => { isLimited: boolean; remainingTime?: number } | Promise<{ isLimited: boolean; remainingTime?: number }>,
  errorMessage = "יש להתחבר",
): Promise<{ session: Session; error?: NextResponse }> { ... }
```

### 5.2 Extract `checkFieldsForProfanity` helper

Sequential profanity checks on `title`, `text`, and optionally `name` are copy-pasted in:

- `src/app/api/reviews/route.ts` (lines 44-52)
- `src/app/api/reviews/[id]/route.ts` (lines 57-62)

**Action:** Add to `src/utils/profanityFilter.ts`:

```ts
export function checkFieldsForProfanity(
  fields: Record<string, string | null | undefined>,
): string | null {
  for (const [fieldName, value] of Object.entries(fields)) {
    if (value && containsProfanity(value)) return fieldName;
  }
  return null;
}
```

Then use a mapping from field names to Hebrew error messages in the API routes.

### 5.3 Fix signup route inconsistencies

`src/app/api/auth/signup/route.ts` is the **only** API route that:

1. Does NOT use `apiError`/`apiSuccess` helpers (uses raw `NextResponse.json`)
2. Has NO Zod schema validation (bare `if (!email || !password)`)
3. Has NO password min-length validation on server (only client-side in `SignUpForm`)
4. Has NO email format validation

**Action:**

- Create a `signupSchema` Zod schema (email: z.string().email(), password: z.string().min(6), name: z.string().optional())
- Refactor to use `apiError`/`apiSuccess`
- Add server-side validation matching client-side checks

### 5.4 Export `toReviewId` for reuse

The review ID parsing pattern (`Number.parseInt` + NaN check) exists in:

- `src/app/api/reviews/[id]/route.ts` (lines 20-23) — as `toReviewId` function
- `src/app/me/reviews/[id]/edit/page.tsx` (lines 33-36) — inline

**Action:** Move `toReviewId` to `src/utils/parseId.ts` (or a more general name like `toPositiveInt`) and import in both locations.

---

## 6. Refactor Data Layer

### 6.1 Extract shared "fetch-by-sorted-IDs" pipeline

The pattern `raw SQL for sorted IDs → prisma.findMany → map-preserve-order → normalizeShow → enrichShow` is duplicated **3 times**:

- `src/lib/data/homepage.ts` — `getTopRated()` (lines 44-63)
- `src/lib/data/homepage.ts` — `getShowsByGenres()` (lines 71-99)
- `src/lib/data/showsList.ts` — rating sort branch (lines 125-139)

**Action:** Add to `src/lib/showHelpers.ts`:

```ts
export async function fetchShowsByIds(ids: number[]): Promise<EnrichedShow[]> {
  if (ids.length === 0) return [];
  const rawShows = await prisma.show.findMany({
    where: { id: { in: ids } },
    include: showInclude,
  });
  const showMap = new Map(rawShows.map((s) => [s.id, s]));
  return ids
    .map((id) => showMap.get(id))
    .filter(Boolean)
    .map((s) => normalizeShow(s!))
    .filter((s): s is Show => s !== null)
    .map(enrichShow);
}
```

Then replace all 3 instances with `fetchShowsByIds(ids)`.

### 6.2 Rename `lib/shows.ts` → `lib/reviews.ts`

`src/lib/shows.ts` contains almost exclusively review CRUD functions: `addReview`, `getReviewsByUser`, `getReviewByOwner`, `updateReviewByOwner`, `deleteReviewByOwner`. Only `getShowOptions` is show-related. The actual show-fetching logic lives in `lib/data/`.

**Action:** Rename to `src/lib/reviews.ts`. Update all imports:

- `src/app/api/reviews/route.ts` — `import { addReview } from "@/lib/shows"`
- `src/app/api/reviews/[id]/route.ts` — `import { deleteReviewByOwner, updateReviewByOwner } from "@/lib/shows"`
- `src/app/api/me/reviews/route.ts` — `import { getReviewsByUser } from "@/lib/shows"` (check this)
- `src/app/me/reviews/[id]/edit/page.tsx` — `import { getReviewByOwner } from "@/lib/shows"` (check this)
- `src/app/reviews/new/page.tsx` — `import { getShowOptions } from "@/lib/shows"` (check this)
- `src/app/shows/[id]/review/page.tsx` — (check this)

### 6.3 Delete dead code

- `src/lib/showsData.ts` — deprecated barrel file with **no consumers**. Delete.
- `src/utils/normalize.ts` — appears **unused** across the codebase. Verify with grep, then delete.

---

## 7. Improve Types & Organization

### 7.1 Split the `Review` type

`src/types/index.ts` defines `Review` as a "god type" with many optional fields (`showId?`, `userId?`, `title?`, `createdAt?`, `updatedAt?`) used for both input and output.

**Action:** Split into:

```ts
/** Review as returned from DB / API — all fields present */
export interface Review {
  id: number;
  showId: number;
  userId: string | null;
  author: string;
  title: string | null;
  text: string;
  rating: number;
  date: string; // standardize to string (ISO)
  createdAt: Date;
  updatedAt: Date;
}

/** Shape used when creating a review */
export interface ReviewInput {
  author: string;
  title?: string | null;
  text: string;
  rating: number;
  date: string;
  userId?: string;
}
```

Also fix:

- `Review.date` is currently `string | Date` — standardize to `string`
- Remove unsafe `as unknown as Review` cast in `src/lib/shows.ts` line 71 — use proper mapper or align Prisma return type with `Review`

### 7.2 Move `reviewSchemas.ts` out of `constants/`

`src/constants/reviewSchemas.ts` contains Zod schemas and `formatZodErrors()` — runtime logic, not constants.

**Action:** Move to `src/lib/reviewSchemas.ts` (or `src/lib/validation.ts`). Keep `src/constants/reviewValidation.ts` (numeric limits) in `constants/`. Update all imports:

- `src/app/api/reviews/route.ts`
- `src/app/api/reviews/[id]/route.ts`
- `src/components/ReviewForm/ReviewForm.tsx`
- `src/app/me/reviews/[id]/edit/EditReviewForm.tsx`

---

## 8. Minor Architecture Improvements

### 8.1 Use `ROUTES` constants consistently

- `src/app/page.tsx` line 89: hardcodes `"/reviews/new"` — use `ROUTES.REVIEWS_NEW`
- `src/app/page.tsx` lines 56-83: genre link `href` values use inline `encodeURIComponent` chains — use `buildShowsQueryString` from `src/utils/showsQuery.ts`

### 8.2 Extract JSON-LD builders

`src/app/shows/[id]/page.tsx` has ~60 lines of inline JSON-LD construction (lines 99-158).

**Action:** Create helpers in `src/lib/seo.ts`:

```ts
export function buildBreadcrumbJsonLd(items: { name: string; path: string }[]) { ... }
export function buildCreativeWorkJsonLd(show: Show, stats: ShowStats, canonicalPath: string) { ... }
```

### 8.3 Complete component barrel

`src/components/index.ts` is missing: `AppSelect`, `BackLink`, `FallbackImage`, `Pagination`, `RadixDirectionProvider`, `SearchInput`, `AuthSessionProvider`.

**Action:** Add all missing exports for consistency, or decide to remove the barrel and use direct imports everywhere (pick one convention).

---

## Suggested Implementation Order

1. **Tokens + CSS dedup** (steps 1, 2) — widest impact, lowest risk
2. **Shared utilities** (step 3 — `cx()`)
3. **Auth UI extraction** (step 4 — social icons, `isValidCallbackUrl`)
4. **API consolidation** (step 5 — middleware, profanity, signup, `toReviewId`)
5. **Data layer** (step 6 — `fetchShowsByIds`, rename, delete dead code)
6. **Types & organization** (step 7 — split Review, move schemas)
7. **Minor improvements** (step 8 — ROUTES, JSON-LD, barrel)

## Verification After Each Step

- `npx tsc --noEmit` — type safety
- `npx next build` — no broken imports
- `npx eslint .` — lint clean
- Grep for remaining hardcoded values to confirm token adoption
- Manual check of shows list, show detail, review creation, and auth flows
