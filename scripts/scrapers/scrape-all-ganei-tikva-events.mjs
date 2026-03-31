#!/usr/bin/env node
/**
 * scrape-all-ganei-tikva-events.mjs
 *
 * Scrape performance dates/times from מרכז הבמה גני תקווה venue website.
 * Matches venue listings to existing DB shows, then scrapes event dates
 * from each matched show's detail page (Hebrew dates table).
 *
 * Dry-run by default — prints matches and scraped dates for review.
 *
 * Usage:
 *   node scripts/scrapers/scrape-all-ganei-tikva-events.mjs                              # dry-run
 *   node scripts/scrapers/scrape-all-ganei-tikva-events.mjs --apply                       # write to DB
 *   node scripts/scrapers/scrape-all-ganei-tikva-events.mjs --json prisma/data/events-ganei-tikva.json
 *   node scripts/scrapers/scrape-all-ganei-tikva-events.mjs --debug                       # dump DOM per page
 */

import { runScraper } from "../lib/scraper-runner.mjs";
import {
  fetchAllEvents,
  VENUE_NAME,
  VENUE_CITY,
} from "../lib/venues/ganei-tikva.mjs";

runScraper({
  label: "Ganei Tikva Venue Scraper — מרכז הבמה גני תקווה",
  venueSource: true,
  fetchListings: fetchAllEvents,
  venue: { name: VENUE_NAME, city: VENUE_CITY },
  stealth: true,
});
