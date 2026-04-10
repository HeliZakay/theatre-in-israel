#!/usr/bin/env node
/**
 * scrape-all-hasimta-events.mjs
 *
 * Scrape performance dates/times for ALL Hasimta Theatre shows in one run.
 * Fixed venue: תיאטרון הסימטה, תל אביב-יפו.
 *
 * Dry-run by default — prints scraped dates for review.
 *
 * Usage:
 *   node scripts/scrapers/scrape-all-hasimta-events.mjs                                          # dry-run
 *   node scripts/scrapers/scrape-all-hasimta-events.mjs --apply                                  # write to DB
 *   node scripts/scrapers/scrape-all-hasimta-events.mjs --json prisma/data/events-hasimta.json   # JSON file
 *   node scripts/scrapers/scrape-all-hasimta-events.mjs --debug                                  # dump DOM per show
 */

import { runScraper } from "../lib/scraper-runner.mjs";
import {
  HASIMTA_THEATRE,
  fetchListing,
  scrapeShowEvents,
} from "../lib/hasimta.mjs";

runScraper({
  label: "Hasimta Theatre Events Scraper",
  theatre: HASIMTA_THEATRE,
  fetchListings: fetchListing,
  scrapeShowEvents,
  venue: { name: "תיאטרון הסימטה", city: "תל אביב-יפו" },
});
