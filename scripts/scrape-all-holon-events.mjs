#!/usr/bin/env node
/**
 * scrape-all-holon-events.mjs
 *
 * Scrape performance dates/times from תיאטרון חולון venue website.
 * Matches venue listings to existing DB shows, then scrapes event dates
 * from each matched show's detail page.
 *
 * Dry-run by default — prints matches and scraped dates for review.
 *
 * Usage:
 *   node scripts/scrape-all-holon-events.mjs                              # dry-run
 *   node scripts/scrape-all-holon-events.mjs --apply                       # write to DB
 *   node scripts/scrape-all-holon-events.mjs --json prisma/data/events-holon.json
 *   node scripts/scrape-all-holon-events.mjs --debug                       # dump DOM per page
 */

import { runScraper } from "./lib/scraper-runner.mjs";
import {
  fetchListing,
  scrapeEventDetail,
  VENUE_NAME,
  VENUE_CITY,
} from "./lib/venues/holon.mjs";

runScraper({
  label: "Holon Venue Scraper — תיאטרון חולון",
  venueSource: true,
  fetchListings: fetchListing,
  scrapeShowEvents: scrapeEventDetail,
  venue: { name: VENUE_NAME, city: VENUE_CITY },
});
