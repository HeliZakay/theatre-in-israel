#!/usr/bin/env node
/**
 * scrape-all-habima-guest-events.mjs
 *
 * Scrape performance dates/times from Habima Theatre guest shows ("הצגות אורחות").
 * This is a venue-source scraper — matches listings to existing DB shows
 * via matchVenueTitle(), then scrapes event dates from each detail page.
 *
 * The guest shows page (/הבימה-4/) lists independent productions hosted at
 * Habima. Detail pages use the same structure as regular Habima shows, so
 * we reuse scrapeShowEvents() from habima.mjs.
 *
 * Dry-run by default — prints matches and scraped dates for review.
 *
 * Usage:
 *   node scripts/scrapers/scrape-all-habima-guest-events.mjs                                  # dry-run
 *   node scripts/scrapers/scrape-all-habima-guest-events.mjs --apply                           # write to DB
 *   node scripts/scrapers/scrape-all-habima-guest-events.mjs --json prisma/data/events-habima-guest.json
 *   node scripts/scrapers/scrape-all-habima-guest-events.mjs --debug                           # dump DOM per page
 */

import { runScraper } from "../lib/scraper-runner.mjs";
import { scrapeShowEvents } from "../lib/habima.mjs";
import {
  fetchListing,
  VENUE_NAME,
  VENUE_CITY,
} from "../lib/venues/habima-guest.mjs";

runScraper({
  label: "Habima Guest Shows — הצגות אורחות",
  venueSource: true,
  fetchListings: fetchListing,
  scrapeShowEvents,
  venue: { name: VENUE_NAME, city: VENUE_CITY },
});
