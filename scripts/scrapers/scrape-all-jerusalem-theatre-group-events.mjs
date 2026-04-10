#!/usr/bin/env node
/**
 * scrape-all-jerusalem-theatre-group-events.mjs
 *
 * Scrape performance dates/times for ALL Jerusalem Theatre Group shows.
 * Events are scraped from the homepage schedule (SmarTicket platform).
 * fetchListing() caches all events, so scrapeShowEvents() reads from
 * cache — no per-show page navigation needed for events.
 *
 * Usage:
 *   node scripts/scrapers/scrape-all-jerusalem-theatre-group-events.mjs                # dry-run
 *   node scripts/scrapers/scrape-all-jerusalem-theatre-group-events.mjs --apply        # write to DB
 *   node scripts/scrapers/scrape-all-jerusalem-theatre-group-events.mjs --json prisma/data/events-jerusalem-theatre-group.json
 *   node scripts/scrapers/scrape-all-jerusalem-theatre-group-events.mjs --debug        # dump debug info
 */

import { runScraper } from "../lib/scraper-runner.mjs";
import {
  fetchListing,
  scrapeShowEvents,
  JERUSALEM_THEATRE_GROUP,
} from "../lib/jerusalem-theatre-group.mjs";

runScraper({
  label: "Jerusalem Theatre Group Events Scraper",
  theatre: JERUSALEM_THEATRE_GROUP,
  fetchListings: fetchListing,
  scrapeShowEvents,
  venue: { name: "בית מזיא לתיאטרון", city: "ירושלים" },
  stealth: true,
  politeDelay: 0, // scrapeShowEvents reads from cache, no network needed
});
