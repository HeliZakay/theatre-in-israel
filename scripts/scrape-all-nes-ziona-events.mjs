#!/usr/bin/env node
/**
 * scrape-all-nes-ziona-events.mjs
 *
 * Scrape performance dates/times from היכל התרבות נס ציונה venue website.
 * Matches venue listings to existing DB shows, then scrapes event dates
 * from each matched show's detail page.
 *
 * Dry-run by default — prints matches and scraped dates for review.
 *
 * Usage:
 *   node scripts/scrape-all-nes-ziona-events.mjs                              # dry-run
 *   node scripts/scrape-all-nes-ziona-events.mjs --apply                       # write to DB
 *   node scripts/scrape-all-nes-ziona-events.mjs --json prisma/data/events-nes-ziona.json
 *   node scripts/scrape-all-nes-ziona-events.mjs --debug                       # dump DOM per page
 */

import { runScraper } from "./lib/scraper-runner.mjs";
import {
  fetchListing,
  scrapeEventDetail,
  VENUE_NAME,
  VENUE_CITY,
} from "./lib/venues/nes-ziona.mjs";

runScraper({
  label: "Nes Ziona Venue Scraper — היכל התרבות נס ציונה",
  venueSource: true,
  fetchListings: fetchListing,
  scrapeShowEvents: scrapeEventDetail,
  venue: { name: VENUE_NAME, city: VENUE_CITY },
});
