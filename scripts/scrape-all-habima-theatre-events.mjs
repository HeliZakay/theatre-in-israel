#!/usr/bin/env node
/**
 * scrape-all-habima-theatre-events.mjs
 *
 * Scrape performance dates/times for ALL Habima Theatre shows in one run.
 * Fetches the repertoire listing, matches shows to DB records,
 * then scrapes events from each show's detail page.
 *
 * Habima Theatre events include per-event venue info (touring format).
 *
 * Uses a prepareScrape hook to fetch valid dates from the presentations
 * calendar (source of truth) before scraping individual show pages.
 *
 * Dry-run by default — prints scraped dates for review.
 *
 * Usage:
 *   node scripts/scrape-all-habima-theatre-events.mjs                                                        # dry-run
 *   node scripts/scrape-all-habima-theatre-events.mjs --apply                                                 # write to DB
 *   node scripts/scrape-all-habima-theatre-events.mjs --json prisma/data/events-habima-theatre.json          # JSON file
 *   node scripts/scrape-all-habima-theatre-events.mjs --debug                                                 # dump DOM per show
 */

import { runScraper } from "./lib/scraper-runner.mjs";
import {
  fetchListing,
  scrapeShowEvents,
  fetchPresentationDates,
  HABIMA_THEATRE,
} from "./lib/habima.mjs";

runScraper({
  label: "Habima Theatre Events Scraper",
  theatre: HABIMA_THEATRE,
  fetchListings: fetchListing,
  scrapeShowEvents,
  touring: true,
  async prepareScrape(browser) {
    const validDates = await fetchPresentationDates(browser);
    console.log(`  Calendar has ${validDates.size} active dates.\n`);
    return { validDates };
  },
});
