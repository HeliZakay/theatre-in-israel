#!/usr/bin/env node
/**
 * scrape-all-ashdod-events.mjs
 *
 * Scrape performance dates/times from המשכן לאמנויות הבמה אשדוד venue website.
 * Matches venue listings to existing DB shows, then collects event dates
 * directly from the listing page (no detail pages needed).
 *
 * Dry-run by default — prints matches and scraped dates for review.
 *
 * Usage:
 *   node scripts/scrapers/scrape-all-ashdod-events.mjs                              # dry-run
 *   node scripts/scrapers/scrape-all-ashdod-events.mjs --apply                       # write to DB
 *   node scripts/scrapers/scrape-all-ashdod-events.mjs --json prisma/data/events-ashdod.json
 */

import { runScraper } from "../lib/scraper-runner.mjs";
import {
  fetchListing,
  VENUE_NAME,
  VENUE_CITY,
} from "../lib/venues/ashdod.mjs";

runScraper({
  label: "Ashdod Venue Scraper — המשכן לאמנויות הבמה אשדוד",
  venueSource: true,
  fetchListings: fetchListing,
  venue: { name: VENUE_NAME, city: VENUE_CITY },
  stealth: true,
});
