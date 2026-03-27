#!/usr/bin/env node
/**
 * scrape-all-kiryat-motzkin-events.mjs
 *
 * Scrape performance dates/times from היכל התיאטרון קריית מוצקין venue website.
 * Matches venue listings to existing DB shows, then scrapes event dates
 * from each matched show's detail page.
 *
 * Dry-run by default — prints matches and scraped dates for review.
 *
 * Usage:
 *   node scripts/scrape-all-kiryat-motzkin-events.mjs                              # dry-run
 *   node scripts/scrape-all-kiryat-motzkin-events.mjs --apply                       # write to DB
 *   node scripts/scrape-all-kiryat-motzkin-events.mjs --json prisma/data/events-kiryat-motzkin.json
 *   node scripts/scrape-all-kiryat-motzkin-events.mjs --debug                       # dump DOM per page
 */

import { runScraper } from "./lib/scraper-runner.mjs";
import {
  fetchListing,
  scrapeEventDetail,
  VENUE_NAME,
  VENUE_CITY,
} from "./lib/venues/kiryat-motzkin.mjs";

runScraper({
  label: "Kiryat Motzkin Venue Scraper — היכל התיאטרון קריית מוצקין",
  venueSource: true,
  fetchListings: fetchListing,
  scrapeShowEvents: scrapeEventDetail,
  venue: { name: VENUE_NAME, city: VENUE_CITY },
});
