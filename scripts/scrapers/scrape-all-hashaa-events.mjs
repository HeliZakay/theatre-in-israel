#!/usr/bin/env node
/**
 * scrape-all-hashaa-events.mjs
 *
 * Scrape performance dates/times for ALL Israeli Hour Theatre shows.
 * Events are fetched from the SmartTicket JSON API (/api/shows).
 * fetchListing() caches all events, so scrapeShowEvents() reads from
 * cache — no per-show page navigation needed for events.
 *
 * Israeli Hour Theatre is a TOURING company — each event has its own venue.
 *
 * Dry-run by default — prints scraped dates for review.
 *
 * Usage:
 *   node scripts/scrapers/scrape-all-hashaa-events.mjs                                    # dry-run
 *   node scripts/scrapers/scrape-all-hashaa-events.mjs --apply                             # write to DB
 *   node scripts/scrapers/scrape-all-hashaa-events.mjs --json prisma/data/events-hashaa.json  # JSON file
 *   node scripts/scrapers/scrape-all-hashaa-events.mjs --debug                             # dump debug info
 */

import { runScraper } from "../lib/scraper-runner.mjs";
import {
  fetchListing,
  scrapeShowEvents,
  HASHAA_THEATRE,
  resolveVenueCity,
} from "../lib/hashaa.mjs";

runScraper({
  label: "Hashaa Theatre Events Scraper",
  theatre: HASHAA_THEATRE,
  fetchListings: fetchListing,
  scrapeShowEvents,
  touring: true,
  resolveVenueCity,
  defaultVenueName: "תיאטרון השעה הישראלי",
  stealth: true,
  politeDelay: 0,
});
