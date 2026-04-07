#!/usr/bin/env node
/**
 * scrape-all-incubator-events.mjs
 *
 * Scrape performance dates/times for ALL Incubator Theatre shows in one run.
 * Reuses Tzavta's listing and event scraping — Incubator shows perform
 * at the Tzavta venue and appear on the Tzavta website.
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
import { fetchListing, scrapeShowEvents } from "../lib/tzavta.mjs";

const INCUBATOR_THEATRE = "תיאטרון האינקובטור";

runScraper({
  label: "Incubator Theatre Events Scraper",
  theatre: INCUBATOR_THEATRE,
  fetchListings: fetchListing,
  scrapeShowEvents,
  touring: true,
});
