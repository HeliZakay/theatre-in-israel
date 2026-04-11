#!/usr/bin/env node
/**
 * scrape-all-tmuna-theatre-events.mjs
 *
 * Scrape performance dates/times for shows at Tmuna Theatre.
 * Matches shows from both אנסמבל תמונע and הפקות עצמאיות (independent
 * productions that perform at the Tmuna venue).
 *
 * Dry-run by default — prints scraped dates for review.
 *
 * Usage:
 *   node scripts/scrapers/scrape-all-tmuna-theatre-events.mjs                                                    # dry-run
 *   node scripts/scrapers/scrape-all-tmuna-theatre-events.mjs --apply                                            # write to DB
 *   node scripts/scrapers/scrape-all-tmuna-theatre-events.mjs --json prisma/data/events-tmuna-theatre.json       # JSON file
 *   node scripts/scrapers/scrape-all-tmuna-theatre-events.mjs --debug                                            # dump DOM per show
 */

import { runScraper } from "../lib/scraper-runner.mjs";
import {
  fetchListing,
  scrapeShowEvents,
  TMUNA_THEATRE,
} from "../lib/tmuna.mjs";

runScraper({
  label: "Tmuna Theatre Events Scraper",
  theatres: [TMUNA_THEATRE, 'הפקות עצמאיות'],
  venue: { name: "תיאטרון תמונע", city: "תל אביב" },
  fetchListings: fetchListing,
  scrapeShowEvents,
});
