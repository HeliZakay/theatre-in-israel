# Events System — הופעות קרובות (Upcoming Shows)

The events system scrapes upcoming performance dates from theatre and venue websites, stores them as committed JSON files in the repo, and syncs them to the database at build time. Show detail pages display upcoming dates, and the `/events` page provides a filterable schedule view.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [How Dates Get to Production](#how-dates-get-to-production)
4. [Manual Operations](#manual-operations)
5. [Automated Pipeline (GitHub Actions)](#automated-pipeline-github-actions)
6. [Adding Support for New Theatres / Venues](#adding-support-for-new-theatres--venues)
7. [Troubleshooting](#troubleshooting)
8. [Design Decisions](#design-decisions)

---

## Overview

### Scrapers

The system runs **11 theatre scrapers** and **16+ venue scrapers** nightly. Theatre scrapers start from a theatre company's website (e.g., Cameri, Habima). Venue scrapers start from an independent venue website (e.g., היכל התרבות נס ציונה) to capture touring shows that theatre scrapers miss.

All scrapers are registered in `scripts/lib/theatres-config.mjs`, which is the single source of truth for scraper configuration.

### Database Tables

| Table   | Columns                                              | Unique Constraint              |
| ------- | ---------------------------------------------------- | ------------------------------ |
| `Venue` | id, name, city, address, regions (String[])          | name + city                    |
| `Event` | id, showId, venueId, date (Date), hour (String)      | showId + venueId + date + hour |

### Key Files

| File                                       | Purpose                                                          |
| ------------------------------------------ | ---------------------------------------------------------------- |
| `scripts/lib/theatres-config.mjs`          | Central registry of all scrapers (theatre + venue)               |
| `scripts/scrape-all-events.mjs`            | Single entry point — runs all scrapers from config               |
| `scripts/scrapers/scrape-all-*-events.mjs` | Per-theatre/venue scraper scripts                                |
| `scripts/lib/*.mjs`                        | Per-theatre scraping logic (fetchShows, scrapeShowEvents)        |
| `scripts/lib/venues/*.mjs`                 | Per-venue scraping logic (fetchListing, scrapeEventDetail)       |
| `scripts/lib/browser.mjs`                  | Puppeteer launch & request interception helpers                  |
| `scripts/lib/scraper-runner.mjs`           | Shared harness for event scrapers (CLI, browser, DB, output)     |
| `prisma/data/events-*.json`                | Committed JSON data files with scraped events                    |
| `prisma/sync-events.js`                    | Build-time script that upserts events JSON into the database     |
| `.github/workflows/refresh-events.yml`     | Daily cron workflow for automated scraping                       |
| `src/lib/showHelpers.ts`                   | `normalizeShow()` filters events to future dates only            |
| `src/components/shows/PerformancesSidebar` | UI component rendering upcoming shows on show detail pages       |
| `src/app/events/[[...filters]]/page.tsx`   | Events schedule page with date/region filters                    |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                  GitHub Actions (daily 3 AM + 9 AM UTC)             │
│                                                                     │
│  1. checkout repo                                                   │
│  2. npm ci + prisma generate                                        │
│  3. node scripts/scrape-all-events.mjs                              │
│     (runs all 27 scrapers from theatres-config.mjs)                 │
│  4. if changed → git commit + push to main                          │
│  5. check scraper freshness + send email report                     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ push triggers
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Vercel Build Pipeline                        │
│                                                                     │
│  node prisma/warmup.js                                              │
│  → prisma migrate deploy                                            │
│  → prisma generate                                                  │
│  → node prisma/sync-events.js   ◄── reads prisma/data/events-*.json│
│  → next build                        unified syncEvents() function  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Next.js Runtime                              │
│                                                                     │
│  showHelpers.ts normalizeShow()                                     │
│    → filters events to date >= today                                │
│                                                                     │
│  PerformancesSidebar — upcoming dates on show detail pages          │
│  /events page — filterable schedule view (date + region)            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## How Dates Get to Production

### 1. Scrape

`scripts/scrape-all-events.mjs` runs all scrapers registered in `theatres-config.mjs`. Each scraper launches Puppeteer, visits show/venue pages, and extracts dates/times. All scrapers use `waitUntil: "domcontentloaded"` + `waitForSelector()`.

### 2. Store as JSON

Each scraper writes to its own JSON file in `prisma/data/`. Two formats exist:

**Theatre format** (touring or fixed-venue):
```json
{
  "scrapedAt": "2026-03-31T03:00:00.000Z",
  "touring": true,
  "events": [
    { "showId": 42, "showSlug": "show-name", "date": "2026-04-01", "hour": "20:00", "venueName": "...", "venueCity": "..." }
  ]
}
```

**Venue format** (venue-scoped deletion):
```json
{
  "scrapedAt": "2026-03-31T03:00:00.000Z",
  "venueSource": true,
  "venue": { "name": "היכל התרבות נס ציונה", "city": "נס ציונה" },
  "events": [
    { "showId": 42, "showSlug": "show-name", "date": "2026-04-01", "hour": "20:00" }
  ]
}
```

### 3. Commit & Push

GitHub Actions commits updated JSON files and pushes to `main`.

### 4. Build-time Sync

`prisma/sync-events.js` reads all JSON files (dynamically from `theatres-config.mjs`) and uses the unified `syncEvents()` function to upsert venues and events. `showSlug` is the primary identifier for resolving shows — portable across DB instances.

### 5. Runtime Filtering

`normalizeShow()` filters events to only include dates >= today. Past events are hidden automatically.

---

## Manual Operations

### Refresh events manually

```bash
# Dry-run a specific scraper
node scripts/scrapers/scrape-all-cameri-events.mjs

# Write JSON for a specific scraper
node scripts/scrapers/scrape-all-cameri-events.mjs --json prisma/data/events.json

# Run ALL scrapers
node scripts/scrape-all-events.mjs

# Sync to local database
node prisma/sync-events.js
```

### Scrape a single show's events (for debugging)

```bash
node scripts/scrapers/scrape-cameri-events.mjs <show-url>
node scripts/scrapers/scrape-cameri-events.mjs <show-url> --debug
```

### Check event data in local DB

```bash
psql -d theatre_in_israel_dev -c '
  SELECT s.title, e.date, e.hour, v.name as venue
  FROM "Event" e
  JOIN "Show" s ON s.id = e."showId"
  JOIN "Venue" v ON v.id = e."venueId"
  WHERE e.date >= CURRENT_DATE
  ORDER BY e.date, e.hour
  LIMIT 20
'
```

---

## Automated Pipeline (GitHub Actions)

The workflow at `.github/workflows/refresh-events.yml` runs daily at **3:00 AM and 9:00 AM UTC**.

### What it does

1. Checks out the repo
2. Installs dependencies and generates Prisma client
3. Runs `node scripts/scrape-all-events.mjs` (all scrapers)
4. If JSON files changed, commits and pushes to `main`
5. Checks scraper freshness and sends an email report
6. The push triggers a Vercel deploy, which runs `sync-events.js` during build

### Requirements

- **`DATABASE_URL` secret** — scrapers need DB access to query show IDs

### Failure behavior

If a scraper fails, the workflow continues with remaining scrapers. Existing JSON files remain unchanged, so the site continues to work with the last successful scrape. Events gradually become stale as past dates are filtered out at runtime.

---

## Adding Support for New Theatres / Venues

All scrapers are registered in `scripts/lib/theatres-config.mjs`. See that file for the full list and config format.

### Adding a theatre scraper

1. Create scraping logic in `scripts/lib/{theatre}.mjs`
2. Create `scripts/scrapers/scrape-{theatre}-events.mjs` (single show) and `scripts/scrapers/scrape-all-{theatre}-events.mjs` (all shows)
3. Register in `theatres-config.mjs`
4. Create placeholder `prisma/data/events-{theatre}.json`
5. Dry-run → fix → apply

### Adding a venue scraper

1. Create scraping logic in `scripts/lib/venues/{venue}.mjs`
2. Create `scripts/scrapers/scrape-all-{venue}-events.mjs`
3. Register in `theatres-config.mjs`
4. Create placeholder `prisma/data/events-{venue}.json`
5. Dry-run → fix → apply

---

## Troubleshooting

### "הופעות קרובות" section not showing

1. Check `prisma/data/events-*.json` — does it contain events for the show?
2. Run `node prisma/sync-events.js` locally, then check the DB
3. Check if dates are in the future — `normalizeShow()` filters past dates

### Scraper finds no events

The theatre may have changed their DOM structure.

1. Run with `--debug` flag: `node scripts/scrapers/scrape-{theatre}-events.mjs <url> --debug`
2. Check the relevant selectors in `scripts/lib/{theatre}.mjs`

### Sync script fails

- **Locally**: Check that `DATABASE_URL` is set in `.env.local`
- **In production (Vercel)**: Check the `DATABASE_URL` environment variable

---

## Design Decisions

### Events as committed JSON, not migrations

Events are ephemeral — they expire daily. Storing them as committed JSON keeps migration history clean. The JSON files act as a cache refreshed by nightly scrapes.

### Puppeteer for scraping

Theatre dates load dynamically via JavaScript. Puppeteer renders the page and waits for content. All scrapers use `domcontentloaded` + `waitForSelector` (not `networkidle2`) to avoid timeout issues in batch sessions.

### GitHub Actions for scraping (not Vercel)

Puppeteer requires Chromium (~300MB), which can't run in Vercel's serverless functions.

### Unified sync function

`prisma/sync-events.js` uses a single `syncEvents()` function that auto-detects the JSON format (fixed-venue, touring, or venue-source) and handles all cases. The `EVENT_FILES` array is generated dynamically from `theatres-config.mjs`.
