#!/usr/bin/env node
/**
 * scrape-all-beer-sheva-theatre-events.mjs
 *
 * Scrape performance dates/times for ALL Beer Sheva Theatre shows in one run.
 * Fetches the show listing, matches shows to DB records,
 * then scrapes events from each show's detail page.
 *
 * Beer Sheva Theatre events include per-event venue info (touring format).
 *
 * Dry-run by default — prints scraped dates for review.
 *
 * Usage:
 *   node scripts/scrape-all-beer-sheva-theatre-events.mjs                                                        # dry-run
 *   node scripts/scrape-all-beer-sheva-theatre-events.mjs --apply                                                # write to DB
 *   node scripts/scrape-all-beer-sheva-theatre-events.mjs --json prisma/data/events-beer-sheva-theatre.json      # JSON file
 *   node scripts/scrape-all-beer-sheva-theatre-events.mjs --debug                                                # dump DOM per show
 */

import { runScraper } from "./lib/scraper-runner.mjs";
import {
  fetchShows,
  scrapeShowEvents,
  BEER_SHEVA_THEATRE,
} from "./lib/beer-sheva.mjs";

runScraper({
  label: "Beer Sheva Theatre Events Scraper",
  theatre: BEER_SHEVA_THEATRE,
  fetchListings: fetchShows,
  scrapeShowEvents,
  touring: true,
});
