#!/usr/bin/env node
/**
 * scrape-all-lessin-events.mjs
 *
 * Scrape performance dates/times for ALL Beit Lessin shows in one run.
 * Fetches the show listing, matches shows to DB records,
 * then scrapes events from each show's detail page.
 *
 * Dry-run by default — prints scraped dates for review.
 *
 * Usage:
 *   node scripts/scrapers/scrape-all-lessin-events.mjs                          # dry-run
 *   node scripts/scrapers/scrape-all-lessin-events.mjs --apply                   # write to DB
 *   node scripts/scrapers/scrape-all-lessin-events.mjs --json prisma/data/events-lessin.json  # write JSON file
 *   node scripts/scrapers/scrape-all-lessin-events.mjs --debug                   # dump DOM per show
 */

import { runScraper } from "../lib/scraper-runner.mjs";
import { fetchListing, scrapeShowEvents, LESSIN_THEATRE } from "../lib/lessin.mjs";

runScraper({
  label: "Lessin Events Scraper",
  theatre: LESSIN_THEATRE,
  fetchListings: fetchListing,
  scrapeShowEvents,
  venue: { name: "תיאטרון בית ליסין", city: "תל אביב" },
});
