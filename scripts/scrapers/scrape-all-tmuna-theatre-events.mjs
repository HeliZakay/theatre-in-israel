#!/usr/bin/env node
/**
 * scrape-all-tmuna-theatre-events.mjs
 *
 * Scrape performance dates/times for ALL Tmuna Theatre shows in one run.
 * Fetches the show listing, matches shows to DB records,
 * then scrapes events from each show's detail page.
 *
 * Tmuna Theatre events include per-event venue info (touring format).
 *
 * Dry-run by default — prints scraped dates for review.
 *
 * Usage:
 *   node scripts/scrapers/scrape-all-tmuna-theatre-events.mjs                                                    # dry-run
 *   node scripts/scrapers/scrape-all-tmuna-theatre-events.mjs --apply                                            # write to DB
 *   node scripts/scrapers/scrape-all-tmuna-theatre-events.mjs --json prisma/data/events-tmuna-theatre.json       # JSON file
 *   node scripts/scrapers/scrape-all-tmuna-theatre-events.mjs --debug                                            # dump DOM per show
 */

import { runScraper } from "../lib/scraper-runner.mjs";
import {
  fetchListing,
  scrapeShowEvents,
  TMUNA_THEATRE,
} from "../lib/tmuna.mjs";

runScraper({
  label: "Tmuna Theatre Events Scraper",
  theatre: TMUNA_THEATRE,
  fetchListings: fetchListing,
  scrapeShowEvents,
  touring: true,
});
