#!/usr/bin/env node
/**
 * scrape-all-beer-sheva-venue-events.mjs
 *
 * Scrape performance dates/times from תיאטרון באר שבע venue website.
 * Matches venue listings to existing DB shows (from ANY theatre),
 * then scrapes event dates from each matched show's detail page.
 *
 * This is the VENUE scraper — it captures touring shows from other theatres
 * performing at the Beer Sheva venue. The separate theatre scraper
 * (scrape-all-beer-sheva-theatre-events.mjs) handles Beer Sheva Theatre's
 * own productions.
 *
 * Dry-run by default — prints matches and scraped dates for review.
 *
 * Usage:
 *   node scripts/scrape-all-beer-sheva-venue-events.mjs                              # dry-run
 *   node scripts/scrape-all-beer-sheva-venue-events.mjs --apply                       # write to DB
 *   node scripts/scrape-all-beer-sheva-venue-events.mjs --json prisma/data/events-beer-sheva-venue.json
 *   node scripts/scrape-all-beer-sheva-venue-events.mjs --debug                       # dump DOM per page
 */

import { runScraper } from "./lib/scraper-runner.mjs";
import {
  fetchListing,
  scrapeEventDetail,
  VENUE_NAME,
  VENUE_CITY,
} from "./lib/venues/beer-sheva.mjs";

runScraper({
  label: "Beer Sheva Venue Scraper — תיאטרון באר שבע (כל ההצגות)",
  venueSource: true,
  fetchListings: fetchListing,
  scrapeShowEvents: scrapeEventDetail,
  venue: { name: VENUE_NAME, city: VENUE_CITY },
  skipTheatre: "תיאטרון באר שבע",
});
