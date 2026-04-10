#!/usr/bin/env node
/**
 * scrape-all-niko-nitai-events.mjs
 *
 * Scrape performance dates/times for ALL Niko Nitai Theatre shows.
 * Events are scraped from the homepage schedule (SmarTicket platform).
 * fetchListing() caches all events, so scrapeShowEvents() reads from
 * cache — no per-show page navigation needed for events.
 *
 * Usage:
 *   node scripts/scrapers/scrape-all-niko-nitai-events.mjs                # dry-run
 *   node scripts/scrapers/scrape-all-niko-nitai-events.mjs --apply        # write to DB
 *   node scripts/scrapers/scrape-all-niko-nitai-events.mjs --json prisma/data/events-niko-nitai.json
 *   node scripts/scrapers/scrape-all-niko-nitai-events.mjs --debug        # dump debug info
 */

import { runScraper } from "../lib/scraper-runner.mjs";
import {
  fetchListing,
  scrapeShowEvents,
  NIKO_NITAI_THEATRE,
} from "../lib/niko-nitai.mjs";

runScraper({
  label: "Niko Nitai Theatre Events Scraper",
  theatre: NIKO_NITAI_THEATRE,
  fetchListings: fetchListing,
  scrapeShowEvents,
  venue: { name: "תיאטרון ניקו ניתאי", city: "תל אביב" },
  stealth: true,
  politeDelay: 0, // scrapeShowEvents reads from cache, no network needed
});
