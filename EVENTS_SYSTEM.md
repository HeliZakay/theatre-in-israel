# Events System — הופעות קרובות (Upcoming Shows)

The "הופעות קרובות" section on show detail pages displays upcoming performance dates scraped from theatre websites. Currently only **Cameri Theatre (תיאטרון הקאמרי)** is supported.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [How Dates Get to Production](#how-dates-get-to-production)
4. [Manual Operations](#manual-operations)
5. [Automated Pipeline (GitHub Actions)](#automated-pipeline-github-actions)
6. [Adding Support for New Theatres](#adding-support-for-new-theatres)
7. [Troubleshooting](#troubleshooting)
8. [Design Decisions](#design-decisions)

---

## Overview

The events system scrapes upcoming performance dates from theatre websites, stores them as a committed JSON file in the repo, and syncs them to the database at build time. This allows show detail pages to display a sidebar listing when and where a show is performing next — without requiring a runtime API or a background worker in production.

### Database Tables

| Table   | Columns                                         | Unique Constraint              |
| ------- | ----------------------------------------------- | ------------------------------ |
| `Venue` | id, name, city, address                         | name + city                    |
| `Event` | id, showId, venueId, date (Date), hour (String) | showId + venueId + date + hour |

Created by migration `20260311200000_add_event_and_venue_tables`.

### Key Files

| File                                                         | Purpose                                                                                                        |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `scripts/scrape-all-cameri-events.mjs`                       | Scrapes all Cameri shows. Modes: dry-run (default), `--apply` (write to DB), `--json <path>` (write JSON file) |
| `scripts/scrape-cameri-events.mjs`                           | Scrapes a single Cameri show URL                                                                               |
| `scripts/lib/cameri.mjs`                                     | Core scraping logic: `fetchSchedule()`, `scrapeShowEvents()`                                                   |
| `scripts/lib/browser.mjs`                                    | Puppeteer launch & request interception helpers                                                                |
| `prisma/data/events.json`                                    | Committed JSON data file with scraped events                                                                   |
| `prisma/sync-events.js`                                      | Build-time script that upserts events.json into the database                                                   |
| `.github/workflows/refresh-events.yml`                       | Daily cron workflow for automated scraping                                                                     |
| `src/lib/showHelpers.ts`                                     | `normalizeShow()` filters events to future dates only                                                          |
| `src/components/PerformancesSidebar/PerformancesSidebar.tsx` | UI component rendering the upcoming shows sidebar                                                              |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        GitHub Actions (daily 3 AM UTC)              │
│                                                                     │
│  1. checkout repo                                                   │
│  2. npm ci + prisma generate                                        │
│  3. node scripts/scrape-all-cameri-events.mjs --json events.json    │
│  4. if changed → git commit + push to main                          │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ push triggers
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Vercel Build Pipeline                        │
│                                                                     │
│  node prisma/warmup.js                                              │
│  → prisma migrate deploy                                            │
│  → prisma generate                                                  │
│  → node prisma/sync-events.js   ◄── reads prisma/data/events.json  │
│  → next build                        upserts Venue + Event rows     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Next.js Runtime                              │
│                                                                     │
│  showHelpers.ts normalizeShow()                                     │
│    → filters events to date >= today                                │
│                                                                     │
│  PerformancesSidebar.tsx                                            │
│    → renders "הופעות קרובות" section if events array is non-empty   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## How Dates Get to Production

The full pipeline from a theatre website to a user's screen:

### 1. Scrape

The scraper (`scripts/scrape-all-cameri-events.mjs`) launches Puppeteer, visits each Cameri show page, scrolls to trigger lazy-loaded date widgets, and extracts performance dates/times from `ul.events-of-this-show > li` elements.

### 2. Store as JSON

Scraped data is written to `prisma/data/events.json` — a committed file in the repo:

```json
{
  "scrapedAt": "2026-03-11T03:00:00.000Z",
  "venue": { "name": "תיאטרון הקאמרי", "city": "תל אביב" },
  "events": [
    { "showId": 123, "date": "2026-03-15", "hour": "20:00", "note": null },
    { "showId": 456, "date": "2026-03-16", "hour": "21:00", "note": null }
  ]
}
```

### 3. Commit & Push

GitHub Actions (or a developer manually) commits the updated `events.json` and pushes to `main`.

### 4. Build-time Sync

The push triggers a Vercel deploy. The build command runs:

```
node prisma/warmup.js && prisma migrate deploy && prisma generate && node prisma/sync-events.js && next build
```

`sync-events.js` reads `events.json` and upserts `Venue` and `Event` rows into the production database.

### 5. Runtime Filtering

`normalizeShow()` in `src/lib/showHelpers.ts` filters events to only include dates ≥ today. Past events are hidden automatically without any DB cleanup.

### 6. UI Rendering

`PerformancesSidebar.tsx` renders the "הופעות קרובות" section only when the filtered events array is non-empty.

---

## Manual Operations

### Refresh events manually (scrape + commit)

```bash
# 1. Run the scraper locally (outputs to JSON, needs DB access for show IDs)
node scripts/scrape-all-cameri-events.mjs --json prisma/data/events.json

# 2. Review the changes
git diff prisma/data/events.json

# 3. Sync to your local database
node prisma/sync-events.js

# 4. Verify locally — restart dev server and visit a Cameri show page
#    The "הופעות קרובות" section should appear with upcoming dates

# 5. Commit and push — Vercel deploy will sync to production DB automatically
git add prisma/data/events.json
git commit -m "chore: refresh Cameri events [$(date +%Y-%m-%d)]"
git push
```

### Scrape a single show's events (for debugging)

```bash
node scripts/scrape-cameri-events.mjs <cameri-show-url>           # dry-run
node scripts/scrape-cameri-events.mjs <cameri-show-url> --debug   # dump DOM
```

### Check event data in local DB

```bash
# Count events
psql -d theatre_in_israel_dev -c 'SELECT count(*) FROM "Event"'

# See upcoming events for a specific show
psql -d theatre_in_israel_dev -c '
  SELECT s.title, e.date, e.hour, v.name as venue
  FROM "Event" e
  JOIN "Show" s ON s.id = e."showId"
  JOIN "Venue" v ON v.id = e."venueId"
  WHERE e.date >= CURRENT_DATE
  ORDER BY e.date, e.hour
  LIMIT 20
'

# Count events per show
psql -d theatre_in_israel_dev -c '
  SELECT s.title, count(*) as events
  FROM "Event" e
  JOIN "Show" s ON s.id = e."showId"
  WHERE e.date >= CURRENT_DATE
  GROUP BY s.title
  ORDER BY events DESC
'
```

### Sync local DB from events.json (after git pull)

```bash
node prisma/sync-events.js
```

---

## Automated Pipeline (GitHub Actions)

The workflow at `.github/workflows/refresh-events.yml` runs on a daily cron schedule.

### Schedule

Runs every day at **3:00 AM UTC**. This is sufficient because theatre schedules don't change minute-by-minute.

### What it does

1. Checks out the repo
2. Installs dependencies and generates Prisma client
3. Runs the scraper: `node scripts/scrape-all-cameri-events.mjs --json prisma/data/events.json`
4. If `events.json` changed, commits and pushes to `main`
5. The push triggers a Vercel deploy, which runs `sync-events.js` during the build step

### Requirements

- **`DATABASE_URL` secret** — the scraper needs database access to query show IDs when building the event list. This must be configured as a repository secret in GitHub.

### Manual trigger

The workflow supports `workflow_dispatch`, so you can trigger it manually from the **Actions** tab in GitHub without waiting for the daily cron.

### Failure behavior

If the scrape fails (e.g., Cameri site is down, DOM structure changed), the workflow exits without committing. The existing `events.json` in the repo remains unchanged, so:

- The site continues to work with the last successful scrape
- Events gradually become stale (past dates are filtered out at runtime)
- **The site never breaks** — worst case, the "הופעות קרובות" section stops appearing once all stored dates are in the past

---

## Adding Support for New Theatres

Currently only **Cameri** has event scraping. Each theatre already has its own scraper module in `scripts/lib/` (e.g., `habima.mjs`, `gesher.mjs`, `haifa.mjs`) for show data, but none have event scraping yet.

### Steps to add a new theatre

1. **Create a `scrapeShowEvents()` function** in the theatre's existing module (e.g., `scripts/lib/habima.mjs`). This function should visit show pages, find performance date elements, and return an array of `{ showId, date, hour, note }` objects.

2. **Create a `scrape-all-<theatre>-events.mjs` script** in `scripts/` following the pattern of `scrape-all-cameri-events.mjs`. Support the same modes: dry-run (default), `--apply`, and `--json <path>`.

3. **Decide on JSON storage strategy**:
   - Option A: Add the venue's events into the existing `events.json` (requires restructuring the format to support multiple venues)
   - Option B: Create a separate JSON file per theatre (e.g., `prisma/data/events-habima.json`)

4. **Update `prisma/sync-events.js`** to read and upsert events from the new source file(s).

5. **Update the GitHub Actions workflow** to run the new scraper alongside the existing one.

---

## Troubleshooting

### "הופעות קרובות" section not showing

1. **Check `prisma/data/events.json`** — does it contain events for the show in question?
2. **Check if sync ran** — run `node prisma/sync-events.js` locally, then check the DB.
3. **Check if dates are in the future** — `normalizeShow()` filters out past dates. If all events for a show are in the past, the section won't appear.

### Scraper finds no events

Cameri may have changed their DOM structure.

1. Run with the `--debug` flag to dump the DOM: `node scripts/scrape-cameri-events.mjs <url> --debug`
2. Check if the `ul.events-of-this-show` selector still exists on the page.
3. If the selector changed, update `scripts/lib/cameri.mjs` accordingly.

### Sync script fails

- **Locally**: Check that `DATABASE_URL` is set in `.env.local`.
- **In production (Vercel)**: Check that the `DATABASE_URL` environment variable is configured in the Vercel project settings.

### GitHub Action fails

1. Go to the **Actions** tab in the GitHub repo and check the failed run's logs.
2. Most likely causes:
   - **Cameri site was down** — wait and retry, or trigger manually later.
   - **`DATABASE_URL` secret is missing or expired** — update the repository secret in GitHub Settings → Secrets.
   - **Puppeteer install issues** — the workflow installs Chromium; check if the runner has enough disk space.

---

## Design Decisions

### Events as committed JSON, not migrations

Events are ephemeral — they expire daily as performance dates pass. Storing them as committed JSON rather than in migration files keeps the migration history clean and reserved for semi-permanent schema and seed data changes. The JSON file acts as a cache that's refreshed daily.

### Puppeteer for scraping

Cameri's performance dates load dynamically via JavaScript (confirmed during implementation — see `SCRAPE_CAMERI_EVENTS_PLAN.md`). A simple HTTP fetch returns a page without the date widgets populated. Puppeteer is required to render the JavaScript, scroll the page, and wait for the lazy-loaded `ul.events-of-this-show` elements to appear.

### GitHub Actions for scraping (not Vercel)

Puppeteer requires a full Chromium browser (~300MB). This cannot run inside Vercel's serverless functions, which have strict size and execution time limits. GitHub Actions provides a full VM with enough resources to run headless Chrome.

### Daily cron at 3 AM UTC

Theatre schedules are updated infrequently — typically days or weeks in advance. A once-daily scrape at 3 AM UTC (early morning in Israel) is more than sufficient to keep event data fresh.

### Build-time sync via git

By committing `events.json` to the repo and syncing during the build step, both local development (after `git pull`) and production deployments stay in lockstep. There's no need for a separate data pipeline or runtime API to fetch events — `git pull && node prisma/sync-events.js` is all a developer needs.
