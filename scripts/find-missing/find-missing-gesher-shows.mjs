#!/usr/bin/env node
/**
 * find-missing-gesher-shows.mjs
 *
 * Scrapes the Gesher Theatre (תיאטרון גשר) repertoire, finds shows
 * not yet in the local database, scrapes details, generates AI
 * summaries, downloads images, and generates a Prisma migration file
 * with the new shows.
 *
 * Usage:
 *   node scripts/find-missing/find-missing-gesher-shows.mjs                # interactive (generates migration)
 *   node scripts/find-missing/find-missing-gesher-shows.mjs --json          # JSON output
 *   node scripts/find-missing/find-missing-gesher-shows.mjs --html          # HTML report
 */

import { runPipeline } from "../lib/pipeline.mjs";
import { launchBrowser } from "../lib/browser.mjs";
import {
  GESHER_THEATRE,
  fetchListing,
  scrapeShowDetails,
} from "../lib/gesher.mjs";

await runPipeline({
  theatreId: "gesher",
  theatreName: GESHER_THEATRE,
  theatreConst: GESHER_THEATRE,
  fetchListing,
  scrapeDetails: scrapeShowDetails,
  titlePreference: "listing-first",
  launchBrowser,
});
