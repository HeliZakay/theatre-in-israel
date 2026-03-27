#!/usr/bin/env node
/**
 * scrape-all-cameri-events.mjs
 *
 * Scrape performance dates/times for ALL Cameri shows in one run.
 * Fetches the repertoire listing, matches shows to DB records,
 * then scrapes events from each show's detail page.
 *
 * Dry-run by default — prints scraped dates for review.
 *
 * Usage:
 *   node scripts/scrape-all-cameri-events.mjs                          # dry-run
 *   node scripts/scrape-all-cameri-events.mjs --apply                   # write to DB
 *   node scripts/scrape-all-cameri-events.mjs --json prisma/data/events.json  # write JSON file
 *   node scripts/scrape-all-cameri-events.mjs --debug                   # dump DOM per show
 */

import { runScraper } from "./lib/scraper-runner.mjs";
import {
  fetchSchedule,
  scrapeShowEvents,
  CAMERI_THEATRE,
} from "./lib/cameri.mjs";

runScraper({
  label: "Cameri Events Scraper",
  theatre: CAMERI_THEATRE,
  fetchListings: fetchSchedule,
  scrapeShowEvents,
  venue: { name: "תיאטרון הקאמרי", city: "תל אביב" },
});
