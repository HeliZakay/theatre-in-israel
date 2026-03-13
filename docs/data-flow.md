# Data Flow: Shows & Events

## Overview

The system has two main data entities with different lifecycles:

- **Shows** (permanent) — title, theatre, genres, cast, summary
- **Events** (ephemeral) — a show at a venue on a date/time

Shows are created via Prisma migrations. Events are scraped nightly and synced during each Vercel build.

---

## 1. How Shows Enter the Database

```
Developer runs find-all-missing-shows.mjs (locally)
        │
        ▼
Scrapes theatre websites for new show titles
        │
        ▼
Enriches with AI summaries, cast, genres (via GitHub Copilot API)
        │
        ▼
Developer reviews in local web UI → clicks "Generate Migration"
        │
        ▼
scripts/lib/pipeline.mjs → generateMigrationSQL()
        │
        ▼
Creates: prisma/migrations/{TIMESTAMP}_add_{theatre}_shows/migration.sql
  - INSERT INTO "Show" (...) ON CONFLICT (slug) DO NOTHING
  - INSERT INTO "Genre" ... ON CONFLICT DO NOTHING
  - INSERT INTO "ShowGenre" ... (resolved via slug subselect)
  - SELECT setval() to reset auto-increment sequence
        │
        ▼
Developer commits + pushes
        │
        ▼
Vercel build runs `prisma migrate deploy` → shows exist in production DB
```

**Key detail**: Show IDs are assigned by PostgreSQL auto-increment (`@default(autoincrement())`).
They are NOT hardcoded in migrations. The `ON CONFLICT (slug) DO NOTHING` clause means
the same migration is idempotent but may assign different IDs on different database instances.

---

## 2. How Events Are Scraped (Nightly)

```
GitHub Actions cron (3 AM UTC) — .github/workflows/refresh-events.yml
        │
        ▼
For each of the 10 theatres:
  node scripts/scrape-all-{theatre}-events.mjs --json prisma/data/events-{theatre}.json
        │
        ├── Connects to PRODUCTION database (${{ secrets.DATABASE_URL }})
        ├── Queries: SELECT id, slug, title FROM Show WHERE theatre = '...'
        ├── Scrapes each show's page for upcoming dates/times/venues
        └── Writes JSON file with events: [{ showId, showSlug, date, hour, ... }]
        │
        ▼
Commits JSON files to git → triggers Vercel build
```

**Database connection**: GitHub Actions scrapers connect to **production** Neon DB.
The `showId` and `showSlug` in the JSON come from production's Show table.

---

## 3. How Events Are Synced to Production

```
Vercel build (package.json "build" script):
  1. node prisma/warmup.js          ← wakes Neon serverless DB
  2. prisma migrate deploy           ← applies any new migrations
  3. prisma generate                 ← generates Prisma client
  4. node prisma/sync-events.js      ← syncs events from JSON to DB
  5. next build                      ← builds the Next.js app

sync-events.js:
  For each events-{theatre}.json:
    1. Reads JSON file
    2. Resolves showSlug → showId (queries Show table by slug)
       Falls back to showId from JSON if no slug present
    3. Upserts venues
    4. Deletes stale events (events in DB but no longer in JSON)
    5. Upserts events (showId + venueId + date + hour = unique key)
```

---

## 4. JSON File Formats

### Fixed-venue format (used by syncFile)

```json
{
  "scrapedAt": "2026-03-12T03:00:00.000Z",
  "venue": { "name": "תיאטרון הקאמרי", "city": "תל אביב" },
  "events": [
    {
      "showId": 42,
      "showSlug": "שם-ההצגה",
      "date": "2026-04-01",
      "hour": "20:00",
      "note": "אולם 1"
    }
  ]
}
```

### Touring format (used by syncTouringFile)

```json
{
  "scrapedAt": "2026-03-12T03:00:00.000Z",
  "touring": true,
  "events": [
    {
      "showId": 42,
      "showSlug": "שם-ההצגה",
      "date": "2026-04-01",
      "hour": "20:00",
      "venueName": "...",
      "venueCity": "..."
    }
  ]
}
```

`showSlug` is the primary identifier for resolving shows. `showId` is kept for backward
compatibility but is not relied upon — sync-events.js always resolves via slug first.

---

## 5. The ID Mismatch Problem (and fix)

### Problem

PostgreSQL auto-increment sequences are non-deterministic across database instances.
The same migration running on local and production DBs can assign different IDs to the
same show. This caused issues when:

1. Developer runs scraper locally → JSON gets local DB's showId
2. JSON is committed → Vercel syncs using that showId against production DB
3. showId doesn't match → events point to wrong show or fail entirely

### Fix

Events JSON now includes `showSlug` (deterministic, derived from show title).
`sync-events.js` resolves slugs to IDs at sync time by querying the target database.
This makes the JSON portable across any database instance.

### Why not just use slugs as the primary key?

The Event table's foreign key (`showId`) is a numeric reference to `Show.id`.
Changing the schema to use slugs as FK would be a large migration with no benefit —
the slug is only needed as a stable lookup key in the JSON intermediary format.

---

## 6. File Map

| Purpose                      | Files                                                            |
| ---------------------------- | ---------------------------------------------------------------- |
| Show creation                | `scripts/find-all-missing-shows.mjs`, `scripts/lib/pipeline.mjs` |
| Migrations                   | `prisma/migrations/*/migration.sql`                              |
| Event scrapers (all shows)   | `scripts/scrape-all-{theatre}-events.mjs` (10 files)             |
| Event scrapers (single show) | `scripts/scrape-{theatre}-events.mjs` (10 files)                 |
| Scraper libraries            | `scripts/lib/{theatre}.mjs`                                      |
| Event JSON data              | `prisma/data/events-{theatre}.json`                              |
| Event sync                   | `prisma/sync-events.js`                                          |
| GitHub Actions               | `.github/workflows/refresh-events.yml`                           |
| DB schema                    | `prisma/schema.prisma`                                           |
| Build pipeline               | `package.json` → `"build"` script                                |
| Neon warmup                  | `prisma/warmup.js`                                               |
| Test seed                    | `prisma/seed.js` + `e2e/data/shows.json`                         |

---

## 7. Adding a New Theatre (Quick Reference)

1. Create scraper lib: `scripts/lib/{theatre}.mjs`
2. Create single-show scraper: `scripts/scrape-{theatre}-events.mjs`
3. Create all-shows scraper: `scripts/scrape-all-{theatre}-events.mjs`
4. Add sync block in `prisma/sync-events.js`
5. Add scrape step + `git add` in `.github/workflows/refresh-events.yml`
6. Create placeholder `prisma/data/events-{theatre}.json`
7. Dry-run → fix → apply → commit + push
