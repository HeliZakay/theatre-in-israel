#!/usr/bin/env node
/**
 * scrape-all-haifa-theatre-events.mjs
 *
 * Scrape performance dates/times for ALL Haifa Theatre shows in one run.
 * Fetches the show listing, matches shows to DB records,
 * then scrapes events from each show's detail page.
 *
 * Haifa Theatre shows may perform at guest venues,
 * so venue is extracted per-event from the page (touring format).
 *
 * Dry-run by default — prints scraped dates for review.
 *
 * Usage:
 *   node scripts/scrapers/scrape-all-haifa-theatre-events.mjs                                              # dry-run
 *   node scripts/scrapers/scrape-all-haifa-theatre-events.mjs --apply                                      # write to DB
 *   node scripts/scrapers/scrape-all-haifa-theatre-events.mjs --json prisma/data/events-haifa-theatre.json # JSON file
 *   node scripts/scrapers/scrape-all-haifa-theatre-events.mjs --debug                                      # dump DOM per show
 */

import { runScraper } from "../lib/scraper-runner.mjs";
import {
  fetchListing,
  scrapeShowEvents,
  HAIFA_THEATRE,
} from "../lib/haifa.mjs";

runScraper({
  label: "Haifa Theatre Events Scraper",
  theatre: HAIFA_THEATRE,
  fetchListings: fetchListing,
  scrapeShowEvents,
  touring: true,
});
