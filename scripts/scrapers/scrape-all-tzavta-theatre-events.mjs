#!/usr/bin/env node
/**
 * scrape-all-tzavta-theatre-events.mjs
 *
 * Scrape performance dates/times for shows at Tzavta Theatre.
 * All shows are independent productions (הפקות עצמאיות) that perform
 * at the Tzavta venue.
 *
 * Dry-run by default — prints scraped dates for review.
 *
 * Usage:
 *   node scripts/scrapers/scrape-all-tzavta-theatre-events.mjs                                                     # dry-run
 *   node scripts/scrapers/scrape-all-tzavta-theatre-events.mjs --apply                                             # write to DB
 *   node scripts/scrapers/scrape-all-tzavta-theatre-events.mjs --json prisma/data/events-tzavta-theatre.json       # JSON file
 *   node scripts/scrapers/scrape-all-tzavta-theatre-events.mjs --debug                                             # dump DOM per show
 */

import { runScraper } from "../lib/scraper-runner.mjs";
import {
  fetchListing,
  scrapeShowEvents,
} from "../lib/tzavta.mjs";

runScraper({
  label: "Tzavta Theatre Events Scraper",
  theatres: ['הפקות עצמאיות'],
  venue: { name: "תיאטרון צוותא", city: "תל אביב" },
  fetchListings: fetchListing,
  scrapeShowEvents,
});
