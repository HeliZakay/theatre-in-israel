#!/usr/bin/env node
/**
 * scrape-all-meshulash-events.mjs
 *
 * Scrape performance dates/times for ALL Meshulash Theatre shows.
 * Events are scraped from each show's own page (Wix Events widget
 * pre-filtered to that show).
 *
 * Usage:
 *   node scripts/scrapers/scrape-all-meshulash-events.mjs                          # dry-run
 *   node scripts/scrapers/scrape-all-meshulash-events.mjs --apply                   # write to DB
 *   node scripts/scrapers/scrape-all-meshulash-events.mjs --json prisma/data/events-meshulash.json  # write JSON file
 *   node scripts/scrapers/scrape-all-meshulash-events.mjs --debug                   # dump debug info
 */

import { runScraper } from "../lib/scraper-runner.mjs";
import {
  fetchListing,
  scrapeShowEvents,
  MESHULASH_THEATRE,
} from "../lib/meshulash.mjs";

runScraper({
  label: "Meshulash Theatre Events Scraper",
  theatre: MESHULASH_THEATRE,
  fetchListings: fetchListing,
  scrapeShowEvents,
  venue: { name: "תיאטרון המשולש", city: "תל אביב" },
});
