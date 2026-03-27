#!/usr/bin/env node
/**
 * scrape-all-kfar-saba-events.mjs
 *
 * Scrape performance dates/times from היכל התרבות כפר סבא venue website.
 * Matches venue listings to existing DB shows, then scrapes event dates
 * from each matched show's detail page (Hebrew dates table).
 *
 * Dry-run by default — prints matches and scraped dates for review.
 *
 * Usage:
 *   node scripts/scrape-all-kfar-saba-events.mjs                              # dry-run
 *   node scripts/scrape-all-kfar-saba-events.mjs --apply                       # write to DB
 *   node scripts/scrape-all-kfar-saba-events.mjs --json prisma/data/events-kfar-saba.json
 *   node scripts/scrape-all-kfar-saba-events.mjs --debug                       # dump DOM per page
 */

import { runScraper } from "./lib/scraper-runner.mjs";
import {
  fetchAllEvents,
  VENUE_NAME,
  VENUE_CITY,
} from "./lib/venues/kfar-saba.mjs";

runScraper({
  label: "Kfar Saba Venue Scraper — היכל התרבות כפר סבא",
  venueSource: true,
  fetchListings: fetchAllEvents,
  venue: { name: VENUE_NAME, city: VENUE_CITY },
  stealth: true,
});
