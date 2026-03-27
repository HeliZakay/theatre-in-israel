#!/usr/bin/env node
/**
 * scrape-all-gesher-events.mjs
 *
 * Scrape performance dates/times for ALL Gesher Theatre shows in one run.
 * Fetches the show listing, matches shows to DB records,
 * then scrapes events from each show's detail page.
 *
 * Gesher Theatre is a fixed venue — all events are at תיאטרון גשר, תל אביב-יפו.
 *
 * Dry-run by default — prints scraped dates for review.
 *
 * Usage:
 *   node scripts/scrape-all-gesher-events.mjs                                              # dry-run
 *   node scripts/scrape-all-gesher-events.mjs --apply                                      # write to DB
 *   node scripts/scrape-all-gesher-events.mjs --json prisma/data/events-gesher.json        # JSON file
 *   node scripts/scrape-all-gesher-events.mjs --debug                                      # dump DOM per show
 */

import { runScraper } from "./lib/scraper-runner.mjs";
import {
  fetchShows,
  scrapeShowEvents,
  GESHER_THEATRE,
} from "./lib/gesher.mjs";

runScraper({
  label: "Gesher Theatre Events Scraper",
  theatre: GESHER_THEATRE,
  fetchListings: fetchShows,
  scrapeShowEvents,
  touring: true,
});
