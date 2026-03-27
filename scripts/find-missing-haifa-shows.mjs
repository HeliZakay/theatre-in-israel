#!/usr/bin/env node
/**
 * find-missing-haifa-shows.mjs
 *
 * Scrapes the Haifa Theatre (תיאטרון חיפה) schedule, finds shows not
 * yet in the local database, scrapes details, generates AI summaries,
 * downloads images, and generates a Prisma migration file with the new shows.
 *
 * Usage:
 *   node scripts/find-missing-haifa-shows.mjs                # interactive (generates migration)
 *   node scripts/find-missing-haifa-shows.mjs --json          # JSON output
 *   node scripts/find-missing-haifa-shows.mjs --html          # HTML report
 */

import { runPipeline } from "./lib/pipeline.mjs";
import { launchBrowser } from "./lib/browser.mjs";
import { HAIFA_THEATRE, fetchListing, scrapeShowDetails } from "./lib/haifa.mjs";

await runPipeline({
  theatreId: "haifa",
  theatreName: HAIFA_THEATRE,
  theatreConst: HAIFA_THEATRE,
  fetchListing,
  scrapeDetails: scrapeShowDetails,
  titlePreference: "listing-first",
  launchBrowser,
});
