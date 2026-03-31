# Data Flow: Shows & Events

## Overview

The system has two main data entities with different lifecycles:

- **Shows** (permanent) — title, theatre, genres, cast, summary
- **Events** (ephemeral) — a show at a venue on a date/time

Shows are created via Prisma migrations. Events are scraped nightly and synced during each Vercel build.

---

## 1. How Shows Enter the Database

```
Developer runs find-missing scripts (locally)
        │
        ▼
Scrapes theatre websites for new show titles
        │
        ▼
Enriches with AI summaries, cast, genres (via GitHub Models API)
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
GitHub Actions cron (3 AM + 9 AM UTC) — .github/workflows/refresh-events.yml
        │
        ▼
node scripts/scrape-all-events.mjs
  (runs all scrapers from scripts/lib/theatres-config.mjs)
        │
        ├── For each of the 11 theatre scrapers + 16 venue scrapers:
        │     node scripts/scrapers/scrape-all-{name}-events.mjs --json prisma/data/events-{name}.json
        │
        ├── Connects to PRODUCTION database (${{ secrets.DATABASE_URL }})
        ├── Queries: SELECT id, slug, title FROM Show WHERE theatre = '...'
        ├── Scrapes each show's page for upcoming dates/times/venues
        └── Writes JSON file with events
        │
        ▼
Commits JSON files to git → triggers Vercel build
```

**Database connection**: GitHub Actions scrapers connect to **production** Neon DB.
The `showSlug` in the JSON comes from production's Show table.

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
  EVENT_FILES generated dynamically from theatres-config.mjs
  For each events-*.json:
    1. Reads JSON file
    2. Auto-detects format (fixed-venue, touring, or venueSource)
    3. Resolves showSlug → showId (queries Show table by slug)
    4. Upserts venues (with region assignment from CITY_REGION_MAP)
    5. Deletes stale events (theatre-scoped or venue-scoped depending on format)
    6. Upserts events (showId + venueId + date + hour = unique key)
```

---

## 4. JSON File Formats

### Theatre format (touring)

Used when a theatre performs at multiple venues:

```json
{
  "scrapedAt": "2026-03-31T03:00:00.000Z",
  "touring": true,
  "events": [
    {
      "showId": 42,
      "showSlug": "show-name",
      "date": "2026-04-01",
      "hour": "20:00",
      "venueName": "היכל התרבות ראשון לציון",
      "venueCity": "ראשון לציון"
    }
  ]
}
```

### Theatre format (fixed venue)

Used when a theatre has a single home venue:

```json
{
  "scrapedAt": "2026-03-31T03:00:00.000Z",
  "venue": { "name": "תיאטרון הקאמרי", "city": "תל אביב" },
  "events": [
    {
      "showId": 42,
      "showSlug": "show-name",
      "date": "2026-04-01",
      "hour": "20:00"
    }
  ]
}
```

### Venue format (venue-scoped deletion)

Used by venue scrapers. The `venueSource: true` flag triggers venue-scoped deletion in sync (only deletes stale events at this specific venue, not across all venues for matched shows):

```json
{
  "scrapedAt": "2026-03-31T03:00:00.000Z",
  "venueSource": true,
  "venue": { "name": "היכל התרבות נס ציונה", "city": "נס ציונה" },
  "events": [
    {
      "showId": 42,
      "showSlug": "show-name",
      "date": "2026-04-01",
      "hour": "20:00"
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

---

## 6. File Map

| Purpose                      | Files                                                                   |
| ---------------------------- | ----------------------------------------------------------------------- |
| Scraper config (source of truth) | `scripts/lib/theatres-config.mjs`                                   |
| Show creation                | `scripts/find-missing/find-missing-{id}-shows.mjs`, `scripts/lib/pipeline.mjs` |
| Migrations                   | `prisma/migrations/*/migration.sql`                                     |
| Event scrapers (all)         | `scripts/scrape-all-events.mjs` (entry point)                          |
| Event scrapers (per-theatre) | `scripts/scrapers/scrape-all-{name}-events.mjs`                        |
| Event scrapers (single show) | `scripts/scrapers/scrape-{name}-events.mjs`                            |
| Theatre scraper libraries    | `scripts/lib/{theatre}.mjs`                                            |
| Venue scraper libraries      | `scripts/lib/venues/{venue}.mjs`                                       |
| Shared scraper harness       | `scripts/lib/scraper-runner.mjs`                                       |
| Event JSON data              | `prisma/data/events-*.json`                                            |
| Event sync                   | `prisma/sync-events.js`                                                |
| GitHub Actions               | `.github/workflows/refresh-events.yml`                                 |
| DB schema                    | `prisma/schema.prisma`                                                 |
| Build pipeline               | `package.json` → `"build"` script                                      |
| Neon warmup                  | `prisma/warmup.js`                                                     |
| Test seed                    | `prisma/seed.js` + `e2e/data/shows.json`                               |

---

## 7. Adding a New Theatre (Quick Reference)

1. Create scraper lib: `scripts/lib/{theatre}.mjs`
2. Create single-show scraper: `scripts/scrapers/scrape-{theatre}-events.mjs`
3. Create all-shows scraper: `scripts/scrapers/scrape-all-{theatre}-events.mjs`
4. Register in `scripts/lib/theatres-config.mjs`
5. Create placeholder `prisma/data/events-{theatre}.json`
6. Dry-run → fix → apply → commit + push

For venue scrapers, follow the same pattern but place the lib file in `scripts/lib/venues/`.
