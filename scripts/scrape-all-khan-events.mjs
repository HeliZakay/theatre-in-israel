#!/usr/bin/env node
/**
 * scrape-all-khan-events.mjs
 *
 * Scrape performance dates/times for ALL Khan Theatre shows in one run.
 * Fetches the show listing, matches shows to DB records,
 * then scrapes events from each show's detail page.
 *
 * Khan Theatre shows may perform at guest venues (e.g. בית ציוני אמריקה),
 * so venue is extracted per-event from the page (touring format).
 *
 * Dry-run by default — prints scraped dates for review.
 *
 * Usage:
 *   node scripts/scrape-all-khan-events.mjs                                              # dry-run
 *   node scripts/scrape-all-khan-events.mjs --apply                                      # write to DB
 *   node scripts/scrape-all-khan-events.mjs --json prisma/data/events-khan.json          # JSON file
 *   node scripts/scrape-all-khan-events.mjs --debug                                      # dump DOM per show
 */

import { runScraper } from "./lib/scraper-runner.mjs";
import {
  fetchShows,
  scrapeShowEvents,
  KHAN_THEATRE,
} from "./lib/hakahn.mjs";

runScraper({
  label: "Khan Theatre Events Scraper",
  theatre: KHAN_THEATRE,
  fetchListings: fetchShows,
  scrapeShowEvents,
  touring: true,
});
