# Refactor Implementation Summary

All 21 improvements from `REFACTOR_PLAN.md` implemented across 8 focus areas.

---

## 1. CSS Design Token System

**Added 20 new tokens** to `src/app/tokens.css`: slate opacity variants, curtain-red alpha variants, border radii (`--radius-sm/md/lg/pill`), card surface tokens, and text muted/faint/placeholder colors.

**Replaced 65 hardcoded values** across 12 CSS modules with token references:

- `Card`, `ShowCard`, `ReviewCard`, `ShowsSection`, `ReviewForm`, `ReviewFormFields`
- `ShowCombobox`, `ShowsFilterBar`, `AppSelect`, `Tag`, `SearchBar`, `FeaturedShow`

---

## 2. Eliminated Duplicated CSS

- **Form field CSS** — Removed 6 duplicated rule blocks (`.field`, `.label`, `.input`, etc.) from `ReviewForm.module.css`. `ReviewFormFields` now owns all field styling; `ReviewForm.tsx` imports `fieldStyles` for the few field-level class references it needs.
- **Spinner keyframes** — Consolidated identical `@keyframes spin` from `ReviewForm` and `ShowsFilterBar` into `globals.css`.
- **ReviewCard → Card composition** — `ReviewCard` now wraps content in `<Card as="article">` instead of duplicating card surface CSS.
- **Cross-module CSS import** — Moved `.slide` class from `ShowCarousel.module.css` to `ShowsSection.module.css`, removing the cross-component CSS coupling.
- **CtaStrip → Button composition** — Replaced `<Link>` with `<Button href={...}>`, removing redundant button styling.

---

## 3. Shared `cx()` Utility

Created `src/utils/cx.ts` — a class name joiner that filters falsy values.

Adopted in 8 components: `AppSelect`, `ShowCombobox`, `MobileMenu`, `ShowsFilterBar`, `Tag`, `Card`, `Button`, `SectionHeader`.

---

## 4. Auth UI Extraction

- **SocialIcons** — Extracted duplicated `GoogleIcon` and `FacebookIcon` SVGs from `SignInButton` and `SignUpForm` into `src/components/SocialIcons/SocialIcons.tsx`. Both icons accept a `className` prop.
- **isValidCallbackUrl** — Extracted from both `signin/page.tsx` and `signup/page.tsx` into `src/utils/auth.ts`.

---

## 5. API Route Consolidation

- **`requireApiAuth`** — Created `src/utils/apiMiddleware.ts` with a shared auth + rate-limit middleware helper. Used in review API routes.
- **`checkFieldsForProfanity`** — Added to `src/utils/profanityFilter.ts`. Replaces sequential per-field profanity checks in both review API routes.
- **Signup route** — Refactored `POST /api/auth/signup` to use `apiError`/`apiSuccess` helpers, added Zod `signupSchema` for server-side validation.
- **`toPositiveInt`** — Created `src/utils/parseId.ts` to replace inline `Number.parseInt` + NaN checks.

---

## 6. Data Layer Refactor

- **`fetchShowsByIds`** — Added to `src/lib/showHelpers.ts`. Consolidates the duplicated fetch-by-sorted-IDs pipeline (findMany → preserve order → normalize → enrich) that was repeated 3 times.
- **Renamed `lib/shows.ts` → `lib/reviews.ts`** — The file contains review CRUD functions, not show queries. Updated 6 import sites.
- **Deleted dead code** — Removed `src/lib/showsData.ts` (no consumers) and `src/utils/normalize.ts` (unused).

---

## 7. Types & Organization

- **Split `Review` type** — Now split into `Review` (strict output type, `date: string`) and `ReviewInput` (creation shape). Removed unsafe `as unknown as Review` cast, replaced with proper `date.toISOString()` mapping.
- **`normalizeShow` fix** — Updated to convert review `date` fields from `Date` to ISO strings.
- **Moved `reviewSchemas.ts`** — From `src/constants/` to `src/lib/` since it contains runtime logic. Updated 5 import sites.

---

## 8. Minor Architecture Improvements

- **ROUTES constants** — Replaced hardcoded `"/reviews/new"` and 4 inline `encodeURIComponent` genre link constructions with `ROUTES` and `buildShowsQueryString()`.
- **JSON-LD builders** — Extracted `buildBreadcrumbJsonLd` and `buildCreativeWorkJsonLd` into `src/lib/seo.ts`, removing ~50 lines of inline JSON-LD.
- **Component barrel** — Added 7 missing exports to `src/components/index.ts`.

---

## New Files

| File                                         | Purpose                               |
| -------------------------------------------- | ------------------------------------- |
| `src/utils/cx.ts`                            | Shared class name joiner              |
| `src/utils/auth.ts`                          | `isValidCallbackUrl` helper           |
| `src/utils/apiMiddleware.ts`                 | `requireApiAuth` API middleware       |
| `src/utils/parseId.ts`                       | `toPositiveInt` parser                |
| `src/components/SocialIcons/SocialIcons.tsx` | Shared Google/Facebook SVG icons      |
| `src/lib/reviews.ts`                         | Review CRUD (renamed from `shows.ts`) |
| `src/lib/reviewSchemas.ts`                   | Zod schemas (moved from `constants/`) |

## Deleted Files

| File                             | Reason                   |
| -------------------------------- | ------------------------ |
| `src/lib/shows.ts`               | Renamed to `reviews.ts`  |
| `src/lib/showsData.ts`           | Dead code — no consumers |
| `src/utils/normalize.ts`         | Dead code — unused       |
| `src/constants/reviewSchemas.ts` | Moved to `src/lib/`      |

## Verification

- `npx tsc --noEmit` — 0 errors
- `npx eslint .` — only pre-existing warnings (unrelated to refactor)
