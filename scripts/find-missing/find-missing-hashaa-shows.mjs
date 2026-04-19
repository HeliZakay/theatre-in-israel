#!/usr/bin/env node
/**
 * find-missing-hashaa-shows.mjs
 *
 * Discover Israeli Hour Theatre shows that are on the website
 * but not yet in the database.
 *
 * Usage:
 *   node scripts/find-missing/find-missing-hashaa-shows.mjs          # interactive
 *   node scripts/find-missing/find-missing-hashaa-shows.mjs --json   # JSON output
 */

import { runPipeline } from "../lib/pipeline.mjs";
import { HASHAA_THEATRE, fetchListing, scrapeShowDetails } from "../lib/hashaa.mjs";
import { launchStealthBrowser } from "../lib/browser.mjs";

await runPipeline({
  theatreId: "hashaa",
  theatreName: HASHAA_THEATRE,
  theatreConst: HASHAA_THEATRE,
  fetchListing,
  scrapeDetails: scrapeShowDetails,
  titlePreference: "listing-first",
  launchBrowser: launchStealthBrowser,
});
