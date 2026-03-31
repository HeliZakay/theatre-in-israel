#!/usr/bin/env node
/**
 * scrape-all-jerusalem-theatre-events.mjs
 *
 * Scrape performance dates/times from תיאטרון ירושלים venue website.
 * Matches venue listings to existing DB shows, then scrapes event dates
 * from each matched show's detail page.
 *
 * Dry-run by default — prints matches and scraped dates for review.
 *
 * Usage:
 *   node scripts/scrapers/scrape-all-jerusalem-theatre-events.mjs                              # dry-run
 *   node scripts/scrapers/scrape-all-jerusalem-theatre-events.mjs --apply                       # write to DB
 *   node scripts/scrapers/scrape-all-jerusalem-theatre-events.mjs --json prisma/data/events-jerusalem-theatre.json
 *   node scripts/scrapers/scrape-all-jerusalem-theatre-events.mjs --debug                       # dump DOM per page
 */

import { runScraper } from "../lib/scraper-runner.mjs";
import {
  fetchListing,
  scrapeEventDetail,
  VENUE_NAME,
  VENUE_CITY,
} from "../lib/venues/jerusalem-theatre.mjs";

runScraper({
  label: "Jerusalem Theatre Venue Scraper — תיאטרון ירושלים",
  venueSource: true,
  fetchListings: fetchListing,
  scrapeShowEvents: scrapeEventDetail,
  venue: { name: VENUE_NAME, city: VENUE_CITY },
});
