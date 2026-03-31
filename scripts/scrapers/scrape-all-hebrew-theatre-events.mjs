#!/usr/bin/env node
/**
 * scrape-all-hebrew-theatre-events.mjs
 *
 * Scrape performance dates/times for ALL Hebrew Theatre shows in one run.
 * Fetches the show listing, matches shows to DB records,
 * then scrapes events from each show's detail page.
 *
 * Hebrew Theatre is a TOURING company — each event has its own venue.
 *
 * Dry-run by default — prints scraped dates for review.
 *
 * Usage:
 *   node scripts/scrapers/scrape-all-hebrew-theatre-events.mjs                                          # dry-run
 *   node scripts/scrapers/scrape-all-hebrew-theatre-events.mjs --apply                                   # write to DB
 *   node scripts/scrapers/scrape-all-hebrew-theatre-events.mjs --json prisma/data/events-hebrew-theatre.json  # JSON file
 *   node scripts/scrapers/scrape-all-hebrew-theatre-events.mjs --debug                                   # dump DOM
 */

import { runScraper } from "../lib/scraper-runner.mjs";
import {
  fetchListing,
  scrapeShowEvents,
  HEBREW_THEATRE,
  resolveVenueCity,
} from "../lib/hebrew-theatre.mjs";

runScraper({
  label: "Hebrew Theatre Events Scraper",
  theatre: HEBREW_THEATRE,
  fetchListings: fetchListing,
  scrapeShowEvents,
  touring: true,
  resolveVenueCity,
  defaultVenueName: "התיאטרון העברי",
});
