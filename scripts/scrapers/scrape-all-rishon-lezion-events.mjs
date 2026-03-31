#!/usr/bin/env node
/**
 * scrape-all-rishon-lezion-events.mjs
 *
 * Scrape performance dates/times from היכל התרבות ראשון לציון venue website.
 * Matches venue listings to existing DB shows, then scrapes event dates
 * from each matched show's detail page.
 *
 * Dry-run by default — prints matches and scraped dates for review.
 *
 * Usage:
 *   node scripts/scrapers/scrape-all-rishon-lezion-events.mjs                              # dry-run
 *   node scripts/scrapers/scrape-all-rishon-lezion-events.mjs --apply                       # write to DB
 *   node scripts/scrapers/scrape-all-rishon-lezion-events.mjs --json prisma/data/events-rishon-lezion.json
 *   node scripts/scrapers/scrape-all-rishon-lezion-events.mjs --debug                       # dump DOM per page
 */

import { runScraper } from "../lib/scraper-runner.mjs";
import {
  fetchListing,
  scrapeEventDetail,
  VENUE_NAME,
  VENUE_CITY,
} from "../lib/venues/rishon-lezion.mjs";

runScraper({
  label: "Rishon LeZion Venue Scraper — היכל התרבות ראשון לציון",
  venueSource: true,
  fetchListings: fetchListing,
  scrapeShowEvents: scrapeEventDetail,
  venue: { name: VENUE_NAME, city: VENUE_CITY },
});
