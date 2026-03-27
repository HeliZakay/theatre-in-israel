#!/usr/bin/env node
/**
 * scrape-all-tomix-events.mjs
 *
 * Scrape performance dates/times for ALL toMix Theatre shows in one run.
 * Fetches the show listing, matches shows to DB records,
 * then scrapes events from each show's detail page.
 *
 * toMix Theatre shows tour multiple venues, so venue is extracted
 * per-event from the eventer.co.il widget (touring format).
 *
 * Dry-run by default — prints scraped dates for review.
 *
 * Usage:
 *   node scripts/scrape-all-tomix-events.mjs                                              # dry-run
 *   node scripts/scrape-all-tomix-events.mjs --apply                                      # write to DB
 *   node scripts/scrape-all-tomix-events.mjs --json prisma/data/events-tomix.json          # JSON file
 *   node scripts/scrape-all-tomix-events.mjs --debug                                      # dump DOM per show
 */

import { runScraper } from "./lib/scraper-runner.mjs";
import {
  fetchShows,
  scrapeShowEvents,
  TOMIX_THEATRE,
} from "./lib/tomix.mjs";

runScraper({
  label: "toMix Theatre Events Scraper",
  theatre: TOMIX_THEATRE,
  fetchListings: fetchShows,
  scrapeShowEvents,
  touring: true,
});
