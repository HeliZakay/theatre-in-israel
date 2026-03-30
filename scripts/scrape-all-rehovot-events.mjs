#!/usr/bin/env node
/**
 * scrape-all-rehovot-events.mjs
 *
 * Scrape performance dates/times from בית העם רחובות venue website.
 * Matches venue listings to existing DB shows, then collects event dates.
 *
 * This scraper is simpler than most venue scrapers — all event data (title,
 * date, time) is on the listing page itself; no detail pages are needed.
 *
 * Dry-run by default — prints matches and scraped dates for review.
 *
 * Usage:
 *   node scripts/scrape-all-rehovot-events.mjs                              # dry-run
 *   node scripts/scrape-all-rehovot-events.mjs --apply                       # write to DB
 *   node scripts/scrape-all-rehovot-events.mjs --json prisma/data/events-rehovot.json
 *   node scripts/scrape-all-rehovot-events.mjs --debug                       # dump raw listings
 */

import { runScraper } from "./lib/scraper-runner.mjs";
import {
  fetchListing,
  VENUE_NAME,
  VENUE_CITY,
} from "./lib/venues/rehovot.mjs";

runScraper({
  label: "Rehovot Venue Scraper — בית העם רחובות",
  venueSource: true,
  stealth: true,
  fetchListings: fetchListing,
  venue: { name: VENUE_NAME, city: VENUE_CITY },
});
