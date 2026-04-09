#!/usr/bin/env node
/**
 * scrape-all-malenki-events.mjs
 *
 * Scrape performance dates/times for ALL Malenki Theatre shows.
 * Events are scraped from the homepage schedule (Wix Repeater).
 * fetchListing() caches all events, so scrapeShowEvents() reads
 * from cache — no per-show page navigation needed.
 *
 * Usage:
 *   node scripts/scrapers/scrape-all-malenki-events.mjs                          # dry-run
 *   node scripts/scrapers/scrape-all-malenki-events.mjs --apply                   # write to DB
 *   node scripts/scrapers/scrape-all-malenki-events.mjs --json prisma/data/events-malenki.json  # write JSON file
 *   node scripts/scrapers/scrape-all-malenki-events.mjs --debug                   # dump debug info
 */

import { runScraper } from "../lib/scraper-runner.mjs";
import {
  fetchListing,
  scrapeShowEvents,
  MALENKI_THEATRE,
} from "../lib/malenki.mjs";

runScraper({
  label: "Malenki Theatre Events Scraper",
  theatre: MALENKI_THEATRE,
  fetchListings: fetchListing,
  scrapeShowEvents,
  venue: { name: "תיאטרון מלנקי", city: "תל אביב" },
  politeDelay: 0, // scrapeShowEvents reads from cache, no network needed
});
