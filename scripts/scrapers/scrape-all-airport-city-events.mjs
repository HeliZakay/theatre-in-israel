#!/usr/bin/env node
/**
 * scrape-all-airport-city-events.mjs
 *
 * Scrape performance dates/times from היכל התרבות איירפורט סיטי venue website.
 * Matches venue listings to existing DB shows, then scrapes event dates
 * from each matched show's detail page.
 *
 * Dry-run by default — prints matches and scraped dates for review.
 *
 * Usage:
 *   node scripts/scrapers/scrape-all-airport-city-events.mjs                              # dry-run
 *   node scripts/scrapers/scrape-all-airport-city-events.mjs --apply                       # write to DB
 *   node scripts/scrapers/scrape-all-airport-city-events.mjs --json prisma/data/events-airport-city.json
 *   node scripts/scrapers/scrape-all-airport-city-events.mjs --debug                       # dump DOM per page
 */

import { runScraper } from "../lib/scraper-runner.mjs";
import {
  fetchListing,
  scrapeEventDetail,
  VENUE_NAME,
  VENUE_CITY,
} from "../lib/venues/airport-city.mjs";

runScraper({
  label: "Airport City Venue Scraper — היכל התרבות איירפורט סיטי",
  venueSource: true,
  fetchListings: fetchListing,
  scrapeShowEvents: scrapeEventDetail,
  venue: { name: VENUE_NAME, city: VENUE_CITY },
});
