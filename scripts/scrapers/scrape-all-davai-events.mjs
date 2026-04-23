#!/usr/bin/env node
/**
 * scrape-all-davai-events.mjs
 *
 * Scrape performance dates/times for ALL Davai Theatre shows in one run.
 * Fetches the show listing, matches shows to DB records,
 * then looks up events from the central /events/list/ page.
 *
 * Davai is a touring theatre — events use per-event venue info.
 *
 * Uses a prepareScrape hook to pre-fetch all events from the central
 * events page before matching them to individual shows by title.
 *
 * Dry-run by default — prints scraped dates for review.
 *
 * Usage:
 *   node scripts/scrapers/scrape-all-davai-events.mjs                                        # dry-run
 *   node scripts/scrapers/scrape-all-davai-events.mjs --apply                                 # write to DB
 *   node scripts/scrapers/scrape-all-davai-events.mjs --json prisma/data/events-davai.json    # JSON file
 *   node scripts/scrapers/scrape-all-davai-events.mjs --debug                                 # dump DOM per show
 */

import { runScraper } from "../lib/scraper-runner.mjs";
import {
  fetchListing,
  scrapeShowEvents,
  prepareDavaiScrape,
  DAVAI_THEATRE,
} from "../lib/davai.mjs";

runScraper({
  label: "Davai Theatre Events Scraper",
  theatre: DAVAI_THEATRE,
  fetchListings: fetchListing,
  scrapeShowEvents,
  touring: true,
  async prepareScrape(browser) {
    return prepareDavaiScrape(browser);
  },
});
