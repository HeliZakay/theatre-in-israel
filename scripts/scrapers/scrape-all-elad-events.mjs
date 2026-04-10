#!/usr/bin/env node
/**
 * scrape-all-elad-events.mjs
 *
 * Scrape performance dates/times for ALL Elad Theatre shows.
 * Show listing from Wix nav, events from SmartTicket detail pages.
 *
 * Usage:
 *   node scripts/scrapers/scrape-all-elad-events.mjs                          # dry-run
 *   node scripts/scrapers/scrape-all-elad-events.mjs --apply                   # write to DB
 *   node scripts/scrapers/scrape-all-elad-events.mjs --json prisma/data/events-elad.json  # write JSON file
 *   node scripts/scrapers/scrape-all-elad-events.mjs --debug                   # dump debug info
 */

import { runScraper } from "../lib/scraper-runner.mjs";
import {
  fetchListing,
  scrapeShowEvents,
  ELAD_THEATRE,
} from "../lib/elad.mjs";

runScraper({
  label: "Elad Theatre Events Scraper",
  theatre: ELAD_THEATRE,
  fetchListings: fetchListing,
  scrapeShowEvents,
  touring: true,
  stealth: true, // required for SmartTicket Cloudflare
});
