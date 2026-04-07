#!/usr/bin/env node
/**
 * scrape-all-incubator-events.mjs
 *
 * Scrape performance dates/times for ALL Incubator Theatre shows in one run.
 * Scrapes directly from incubator.org.il — captures events at all venues
 * (not just Tzavta).
 *
 * Dry-run by default — prints scraped dates for review.
 *
 * Usage:
 *   node scripts/scrapers/scrape-all-incubator-events.mjs                                            # dry-run
 *   node scripts/scrapers/scrape-all-incubator-events.mjs --apply                                    # write to DB
 *   node scripts/scrapers/scrape-all-incubator-events.mjs --json prisma/data/events-incubator.json   # JSON file
 *   node scripts/scrapers/scrape-all-incubator-events.mjs --debug                                    # dump DOM per show
 */

import { runScraper } from "../lib/scraper-runner.mjs";
import {
  INCUBATOR_THEATRE,
  fetchListing,
  scrapeShowEvents,
} from "../lib/incubator.mjs";

runScraper({
  label: "Incubator Theatre Events Scraper",
  theatre: INCUBATOR_THEATRE,
  fetchListings: fetchListing,
  scrapeShowEvents,
  touring: true,
});
