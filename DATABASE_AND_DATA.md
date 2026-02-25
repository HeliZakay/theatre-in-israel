# Database & Data Architecture

> A guide for AI agents and developers on how the database, data, and environments work in this project.

## Stack Overview

| Layer       | Technology                             |
| ----------- | -------------------------------------- |
| Framework   | Next.js 16 (App Router, React 19)      |
| ORM         | Prisma 7 with driver adapters          |
| Database    | PostgreSQL                             |
| Hosting     | Vercel (auto-deploy on push)           |
| Prod DB     | Neon Serverless Postgres (WebSocket)   |
| Local DB    | Standard Postgres (via `DATABASE_URL`) |
| E2E test DB | Dockerized Postgres on port 5433       |

---

## How Schema Changes Reach Production

```
Developer writes migration locally
  → prisma migrate dev          (creates SQL in prisma/migrations/)
  → git push
  → Vercel build runs:  prisma migrate deploy && prisma generate && next build
  → Migration applied to Neon prod DB automatically
```

**Key rule:** `prisma migrate deploy` runs on every Vercel deploy. Any new migration folder under `prisma/migrations/` will be applied to production automatically on the next push.

---

## How Data Gets Into the Database

There are **three distinct data pathways**. Understanding which one to use is critical.

### 1. Data Migrations (production data)

**Location:** `prisma/migrations/20260225000000_seed_shows_data/migration.sql`

All 133 real shows, 14 genres, and 351 ShowGenre records are inserted via a **Prisma data migration** — a regular migration file that contains INSERT statements instead of schema DDL.

- Runs automatically on `prisma migrate deploy` in **every environment** (prod, local, E2E)
- Uses `ON CONFLICT DO NOTHING` for idempotency — safe to re-run
- Resets auto-increment sequences for Show and Genre after inserts

**When to use:** For any data that must exist in production (real shows, genres, essential reference data). Write INSERT statements in a new migration file.

### 2. Seed Script (test/dev data only)

**Location:** `prisma/seed.js`  
**Data source:** `e2e/data/shows.json` (6 fake shows with IDs 10001–10006)

- Has a **hard guard**: exits immediately if `NODE_ENV=production`
- Only runs when explicitly called: `npx prisma db seed`
- Used during E2E test setup (`scripts/setup-e2e.sh`)
- Inserts fake test shows from the E2E fixture — **not real data**

**When to use:** Never for production. Only to populate a test or dev database with fixture data for testing purposes.

### 3. Scraper Script (adding new real shows)

**Location:** `scripts/find-missing-cameri-shows.mjs`

- Scrapes the Cameri Theatre website for shows not yet in the DB
- Uses AI (GitHub Models) to generate Hebrew summaries
- In interactive mode, inserts approved shows **directly into the database**
- Does NOT write to any JSON file — the DB is the sole source of truth
- Requires `DATABASE_URL` and `GITHUB_TOKEN` env vars

**When to use:** To discover and add new Cameri Theatre shows to the database. Run against production DB (via `--env=.env.production.local`) to add shows to prod.

---

## Environment Setup

### Local Development

```bash
# .env.local contains DATABASE_URL pointing to local Postgres
npx prisma migrate deploy   # applies all migrations (schema + data)
npx prisma db seed           # optional: adds 6 fake test shows
npm run dev
```

### E2E Tests

```bash
npm run e2e:setup    # runs scripts/setup-e2e.sh which:
                     #   1. Starts Docker Postgres on port 5433
                     #   2. Runs prisma migrate deploy (schema + 133 real shows)
                     #   3. Runs prisma db seed (6 fake test shows)
                     #   4. Creates test user (test@e2e.com / TestPassword123!)

npm run e2e          # runs Playwright tests
npm run e2e:teardown # stops Docker container
```

The E2E database has **both** real shows (from migration) and fake test shows (from seed). E2E tests use the fake shows (IDs 10001+) to avoid depending on real data.

### Production (Vercel)

```
Build command: prisma migrate deploy && prisma generate && next build
```

- `prisma migrate deploy` applies any pending migrations (including the data migration with 133 shows)
- The seed script **never** runs in production
- New shows are added via the scraper script run manually against the prod DB
- Vercel auto-injects `POSTGRES_URL_NON_POOLING`; `prisma.config.ts` derives the direct URL from the pooler URL

---

## Database Schema (Key Models)

```
Show          ←——→  Genre        (many-to-many via ShowGenre)
  ↓
Review        ←——→  User         (one review per user per show)
  ↓
Watchlist     ←——→  User         (users bookmark shows)

ContactMessage                   (contact form submissions)
RateLimitAttempt                 (rate limiting for forms)
```

See `prisma/schema.prisma` for the full schema. Notable points:

- **Show** has computed fields `avgRating` and `reviewCount` (updated via DB trigger in `20260221210000_add_show_stats_and_indexes`)
- **Show deletion is protected** by a DB trigger (see `20260221200000_protect_show_deletion`)
- **Review** has a unique constraint on `[userId, showId]` — one review per user per show
- **User** supports both credential auth (password) and OAuth (Account model)

---

## Key Files Reference

| File                                    | Purpose                                                     |
| --------------------------------------- | ----------------------------------------------------------- |
| `prisma/schema.prisma`                  | Database schema definition                                  |
| `prisma.config.ts`                      | Prisma config (DB URLs, migration paths, seed command)      |
| `prisma/migrations/`                    | All migrations (schema DDL + data inserts)                  |
| `prisma/seed.js`                        | Test data seeder (reads from `e2e/data/shows.json`)         |
| `e2e/data/shows.json`                   | 6 fake test shows for E2E (IDs 10001–10006)                 |
| `scripts/find-missing-cameri-shows.mjs` | Scraper: finds & inserts new Cameri shows                   |
| `scripts/setup-e2e.sh`                  | E2E environment setup (Docker + migrate + seed + test user) |
| `scripts/teardown-e2e.sh`               | E2E cleanup (stops Docker)                                  |

---

## Common Tasks

### Adding a new show to production

Run the scraper against prod: `node scripts/find-missing-cameri-shows.mjs --env=.env.production.local`

### Adding a new E2E test show

Add it to `e2e/data/shows.json` with an ID >= 10001 to avoid conflicts with real show IDs in the data migration.

### Adding essential reference data to all environments

Create a new Prisma migration with INSERT statements:

```bash
mkdir -p prisma/migrations/YYYYMMDDHHMMSS_description
# Write migration.sql with INSERT ... ON CONFLICT DO NOTHING
```

### Changing the schema

```bash
# Edit prisma/schema.prisma
npx prisma migrate dev --name description_of_change
# This creates a new migration folder and applies it locally
# Push to deploy to production
```

---

## Important Warnings

1. **Never run `prisma db seed` in production** — it has a guard but don't bypass it
2. **The DB is the source of truth for shows** — there is no JSON file that mirrors prod data
3. **Show IDs 1–133 are real shows** from the data migration; **10001+ are test fixtures**
4. **Data migrations are one-way** — once deployed, don't edit them; create new migrations instead
5. **The scraper only inserts to DB** — it does not maintain any local JSON backup
