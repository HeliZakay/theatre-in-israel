#!/usr/bin/env node
/**
 * scrape-all-tzavta-theatre-events.mjs
 *
 * Scrape performance dates/times for ALL Tzavta Theatre shows in one run.
 * Fetches the show listing, matches shows to DB records,
 * then scrapes events from each show's detail page.
 *
 * Tzavta Theatre events include per-event venue info (touring format).
 *
 * Dry-run by default — prints scraped dates for review.
 *
 * Usage:
 *   node scripts/scrape-all-tzavta-theatre-events.mjs                                                     # dry-run
 *   node scripts/scrape-all-tzavta-theatre-events.mjs --apply                                             # write to DB
 *   node scripts/scrape-all-tzavta-theatre-events.mjs --json prisma/data/events-tzavta-theatre.json       # JSON file
 *   node scripts/scrape-all-tzavta-theatre-events.mjs --debug                                             # dump DOM per show
 */

import { runScraper } from "./lib/scraper-runner.mjs";
import {
  fetchShows,
  scrapeShowEvents,
  TZAVTA_THEATRE,
} from "./lib/tzavta.mjs";

runScraper({
  label: "Tzavta Theatre Events Scraper",
  theatre: TZAVTA_THEATRE,
  fetchListings: fetchShows,
  scrapeShowEvents,
  touring: true,
});
