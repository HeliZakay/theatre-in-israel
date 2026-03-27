#!/usr/bin/env node
/**
 * scrape-all-theatron-hazafon-events.mjs
 *
 * Scrape performance dates/times from תיאטרון הצפון venue website.
 * Matches venue listings to existing DB shows, then collects event dates
 * directly from the listing page (no detail pages needed).
 *
 * Dry-run by default — prints matches and scraped dates for review.
 *
 * Usage:
 *   node scripts/scrape-all-theatron-hazafon-events.mjs                              # dry-run
 *   node scripts/scrape-all-theatron-hazafon-events.mjs --apply                       # write to DB
 *   node scripts/scrape-all-theatron-hazafon-events.mjs --json prisma/data/events-theatron-hazafon.json
 *   node scripts/scrape-all-theatron-hazafon-events.mjs --debug                       # dump raw listings
 */

import { runScraper } from "./lib/scraper-runner.mjs";
import {
  fetchListing,
  VENUE_NAME,
  VENUE_CITY,
} from "./lib/venues/theatron-hazafon.mjs";

runScraper({
  label: "Theatron HaZafon Venue Scraper — תיאטרון הצפון",
  venueSource: true,
  fetchListings: fetchListing,
  venue: { name: VENUE_NAME, city: VENUE_CITY },
  stealth: true,
});
