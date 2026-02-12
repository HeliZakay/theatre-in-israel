# Automated Test Plan

Comprehensive testing strategy for the Theatre in Israel app.

## 1) Recommended technologies

1. `Vitest` for unit and integration tests.
2. `@testing-library/react` + `@testing-library/jest-dom` for component behavior tests.
3. `Playwright` for end-to-end flows.
4. `MSW` for network mocking in component tests when needed.
5. Real PostgreSQL test database for Prisma integration tests (migrations + deterministic seed).
6. `@axe-core/playwright` for accessibility smoke checks.
7. CI on Node 20+.

## 2) Test architecture

1. `tests/unit` for pure functions and hooks.
2. `tests/component` for client components.
3. `tests/integration` for API route and Prisma data tests.
4. `tests/e2e` for browser user journeys.
5. `tests/fixtures` for shared test data.
6. Shared setup files:
   - `tests/setup/vitest.setup.ts`
   - `tests/setup/playwright/*`

## 3) High-priority coverage

1. `src/utils/showsQuery.ts`
   - Query string builder/parser behavior, defaults, page normalization.
2. `src/utils/showStats.ts`
   - Avg rating, latest review date, null/empty edge cases.
3. `src/hooks/useCombobox.ts`
   - Keyboard navigation, blur close, filtering, active index wrap.
4. `src/components/ShowCombobox/ShowCombobox.tsx`
   - Selection, clear behavior, revert invalid typed text on blur.
5. `src/components/ReviewForm/ReviewForm.tsx`
   - Validation, error handling, success state, selected-show poster behavior.
6. `src/app/api/reviews/route.ts`
   - 400 invalid payload, 404 show not found, 303 success redirect, 500 fallback.
7. `src/lib/showsData.ts` and `src/lib/shows.ts` (integration tests)
   - Filtering, sorting, pagination clamping, add review persistence.
8. SEO routes
   - `src/app/sitemap.ts`
   - `src/app/robots.ts`

## 4) Must-have E2E scenarios

1. Homepage loads, search submits, and routes to `/shows` with query.
2. `/shows` filters update URL and results.
3. Pagination works and preserves active filters.
4. Show detail page renders expected content and reviews.
5. Add review from `/shows/[id]/review` succeeds and redirects.
6. Add review from `/reviews/new`, selecting show from dropdown reveals poster and submits correctly.
7. Invalid review form input shows validation errors.
8. Missing show path returns 404 flow.
9. SEO smoke checks: canonical tag exists, noindex on review form pages.

## 5) CI pipeline proposal

1. `quality` job:
   - `npm ci`
   - `npm run lint`
   - `npx tsc --noEmit`
2. `unit_component` job:
   - Run Vitest with coverage.
3. `integration_db` job:
   - Start PostgreSQL service.
   - Run Prisma migrations.
   - Seed test data.
   - Run integration tests.
4. `e2e` job:
   - Build app.
   - Run Playwright.
   - Upload traces/reports as artifacts.
5. Gating:
   - PRs: `quality + unit_component`
   - Main/nightly: full pipeline (including integration + e2e)

## 6) Targets

1. Initial global line coverage: 75%, then raise to 85%.
2. Critical modules target: 90% (`showsQuery`, `showStats`, `api/reviews`).
3. Required checks should have zero flaky tests.
4. CI runtime target for required checks: under 10 minutes.

## 7) Rollout phases

1. Phase 1 (1 day): tooling setup + first unit tests.
2. Phase 2 (1-2 days): API and Prisma integration tests.
3. Phase 3 (1 day): Playwright critical-flow tests.
4. Phase 4 (ongoing): extend coverage per feature and bugfix.

## 8) Suggested npm scripts

1. `test:unit`
2. `test:component`
3. `test:integration`
4. `test:e2e`
5. `test:ci` (runs all in CI order)

## 9) Suggested next implementation step

Start with Phase 1:
1. Install dependencies.
2. Configure Vitest and React Testing Library.
3. Add first tests for:
   - `src/utils/showsQuery.ts`
   - `src/utils/showStats.ts`
   - `src/app/api/reviews/route.ts`
