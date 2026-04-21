# Theatre-in-Israel

Hebrew-language theatre listing and review platform (Next.js App Router).

## Stack

Next.js 15 (App Router), React, TypeScript, Prisma ORM, PostgreSQL (Neon), NextAuth, Playwright (E2E), Jest (unit/component), CSS Modules, deployed on Vercel. Node 24.x. Scrapers use Puppeteer (ESM `.mjs`).

## Structure

```
src/app/          — App Router pages and API routes
src/components/   — React components
src/lib/          — Server utilities (prisma client, auth, etc.)
src/utils/        — Shared helpers
scripts/scrapers/ — Theatre event scrapers (Puppeteer, ESM)
scripts/lib/      — Scraper shared libraries and theatre configs
scripts/data/     — excluded-shows.json, show-images.json
prisma/           — schema, migrations, sync-events.js, seed data
prisma/data/      — Scraped event JSON files (events-{theatre}.json)
tests/            — Jest unit + component tests
e2e/              — Playwright E2E tests
```

## Commands

```sh
npm run dev          # Start dev server
npm run build        # Full production build (migrate + sync events + next build)
npm run lint         # ESLint
npm test             # Jest tests
npm run e2e          # Playwright (must not have dev server running — DB conflict)
npx prisma migrate dev  # Create/apply migration locally
```

## Events Pipeline

GitHub Actions nightly → scrapers write `prisma/data/events-{theatre}.json` → commit → Vercel build runs `prisma/sync-events.js` → upserts to DB. Two JSON formats: `syncFile` (fixed venue) and `syncTouringFile` (touring/per-event venue).

## Conventions

- Shows identified by **slug** everywhere (not numeric ID) — IDs differ between local and prod
- Scraper files: ESM `.mjs`, one per theatre in `scripts/lib/` or `scripts/scrapers/`
- Excluded shows listed in `scripts/data/excluded-shows.json`
- Pages use CSS Modules (`.module.css`), global tokens in `src/app/tokens.css`
- RTL Hebrew UI — all text direction handled via CSS
- Review deletion cascades restricted (`onDelete: Restrict` on Show) — deleting a show with reviews fails intentionally

## Gotchas

- Scraper `waitUntil: "networkidle2"` causes timeouts in batch runs — use `domcontentloaded` + `waitForSelector` instead
- E2E tests fail if dev server is already running (DB/secret mismatch between dev and test)
- Data migrations must use slugs, never IDs
- Show deletions destroy user reviews — verify targets carefully
- Nested JSON-LD: child objects must not back-reference parent (Google rejects circular refs)
