#!/usr/bin/env node
/**
 * scrape-all-hanut31-events.mjs
 *
 * Scrape performance dates/times for ALL Hanut31 Theatre shows.
 * Events are scraped from individual /events/{slug} pages via JSON-LD.
 * fetchListing() visits all event pages and caches results, so
 * scrapeShowEvents() reads from cache — no per-show navigation needed.
 *
 * Usage:
 *   node scripts/scrapers/scrape-all-hanut31-events.mjs                          # dry-run
 *   node scripts/scrapers/scrape-all-hanut31-events.mjs --apply                   # write to DB
 *   node scripts/scrapers/scrape-all-hanut31-events.mjs --json prisma/data/events-hanut31.json  # write JSON file
 *   node scripts/scrapers/scrape-all-hanut31-events.mjs --debug                   # dump debug info
 */

import { runScraper } from "../lib/scraper-runner.mjs";
import {
  fetchListing,
  populateEventsCache,
  scrapeShowEvents,
  HANUT31_THEATRE,
} from "../lib/hanut31.mjs";

runScraper({
  label: "Hanut31 Theatre Events Scraper",
  theatre: HANUT31_THEATRE,
  fetchListings: async (browser) => {
    const shows = await fetchListing(browser);
    await populateEventsCache(browser, shows);
    return shows;
  },
  scrapeShowEvents,
  venue: { name: "תיאטרון החנות", city: "תל אביב" },
  politeDelay: 0, // scrapeShowEvents reads from cache, no network needed
});
