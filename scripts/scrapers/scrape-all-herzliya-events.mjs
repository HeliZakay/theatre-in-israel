#!/usr/bin/env node
/**
 * scrape-all-herzliya-events.mjs
 *
 * Scrape performance dates/times from היכל אמנויות הבמה הרצליה venue website.
 * Matches venue listings to existing DB shows, then scrapes event dates
 * from each matched show's detail page.
 *
 * Dry-run by default — prints matches and scraped dates for review.
 *
 * Usage:
 *   node scripts/scrapers/scrape-all-herzliya-events.mjs                              # dry-run
 *   node scripts/scrapers/scrape-all-herzliya-events.mjs --apply                       # write to DB
 *   node scripts/scrapers/scrape-all-herzliya-events.mjs --json prisma/data/events-herzliya.json
 *   node scripts/scrapers/scrape-all-herzliya-events.mjs --debug                       # dump DOM per page
 */

import { runScraper } from "../lib/scraper-runner.mjs";
import {
  fetchListing,
  scrapeEventDetail,
  VENUE_NAME,
  VENUE_CITY,
} from "../lib/venues/herzliya.mjs";

runScraper({
  label: "Herzliya Venue Scraper — היכל אמנויות הבמה הרצליה",
  venueSource: true,
  fetchListings: fetchListing,
  scrapeShowEvents: scrapeEventDetail,
  venue: { name: VENUE_NAME, city: VENUE_CITY },
});
