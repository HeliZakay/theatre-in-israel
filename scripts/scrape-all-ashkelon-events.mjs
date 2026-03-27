#!/usr/bin/env node
/**
 * scrape-all-ashkelon-events.mjs
 *
 * Scrape performance dates/times from היכל התרבות אשקלון venue website.
 * Matches venue listings to existing DB shows, then collects event dates.
 *
 * This scraper is simpler than most venue scrapers — all event data (title,
 * date, time) is on the listing page itself; no detail pages are needed.
 *
 * Dry-run by default — prints matches and scraped dates for review.
 *
 * Usage:
 *   node scripts/scrape-all-ashkelon-events.mjs                              # dry-run
 *   node scripts/scrape-all-ashkelon-events.mjs --apply                       # write to DB
 *   node scripts/scrape-all-ashkelon-events.mjs --json prisma/data/events-ashkelon.json
 *   node scripts/scrape-all-ashkelon-events.mjs --debug                       # dump raw listings
 */

import { runScraper } from "./lib/scraper-runner.mjs";
import {
  fetchListing,
  VENUE_NAME,
  VENUE_CITY,
} from "./lib/venues/ashkelon.mjs";

runScraper({
  label: "Ashkelon Venue Scraper — היכל התרבות אשקלון",
  venueSource: true,
  fetchListings: fetchListing,
  venue: { name: VENUE_NAME, city: VENUE_CITY },
});
