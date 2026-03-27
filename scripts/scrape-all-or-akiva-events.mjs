#!/usr/bin/env node
/**
 * scrape-all-or-akiva-events.mjs
 *
 * Scrape performance dates/times from היכל התרבות אור עקיבא venue website.
 * Matches venue listings to existing DB shows, then collects event dates.
 *
 * This scraper is simpler than most venue scrapers — all event data (title,
 * date, time) is on the listing page itself; no detail pages are needed.
 *
 * Dry-run by default — prints matches and scraped dates for review.
 *
 * Usage:
 *   node scripts/scrape-all-or-akiva-events.mjs                              # dry-run
 *   node scripts/scrape-all-or-akiva-events.mjs --apply                       # write to DB
 *   node scripts/scrape-all-or-akiva-events.mjs --json prisma/data/events-or-akiva.json
 *   node scripts/scrape-all-or-akiva-events.mjs --debug                       # dump raw listings
 */

import { runScraper } from "./lib/scraper-runner.mjs";
import {
  fetchListing,
  VENUE_NAME,
  VENUE_CITY,
} from "./lib/venues/or-akiva.mjs";

runScraper({
  label: "Or Akiva Venue Scraper — היכל התרבות אור עקיבא",
  venueSource: true,
  fetchListings: fetchListing,
  venue: { name: VENUE_NAME, city: VENUE_CITY },
});
