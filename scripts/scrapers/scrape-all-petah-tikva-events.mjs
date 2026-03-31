#!/usr/bin/env node
/**
 * scrape-all-petah-tikva-events.mjs
 *
 * Scrape performance dates/times from היכל התרבות פתח תקווה venue website.
 * Matches venue listings to existing DB shows, then scrapes event dates
 * from each matched show's detail page (JSON-LD).
 *
 * Dry-run by default — prints matches and scraped dates for review.
 *
 * Usage:
 *   node scripts/scrapers/scrape-all-petah-tikva-events.mjs                              # dry-run
 *   node scripts/scrapers/scrape-all-petah-tikva-events.mjs --apply                       # write to DB
 *   node scripts/scrapers/scrape-all-petah-tikva-events.mjs --json prisma/data/events-petah-tikva.json
 *   node scripts/scrapers/scrape-all-petah-tikva-events.mjs --debug                       # dump DOM per page
 */

import { runScraper } from "../lib/scraper-runner.mjs";
import {
  fetchAllEvents,
  VENUE_NAME,
  VENUE_CITY,
} from "../lib/venues/petah-tikva.mjs";

runScraper({
  label: "Petah Tikva Venue Scraper — היכל התרבות פתח תקווה",
  venueSource: true,
  fetchListings: fetchAllEvents,
  venue: { name: VENUE_NAME, city: VENUE_CITY },
  stealth: true,
});
