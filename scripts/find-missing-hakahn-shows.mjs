#!/usr/bin/env node
/**
 * find-missing-hakahn-shows.mjs
 *
 * Scrapes the Khan Theatre (תיאטרון החאן) shows page, finds shows not
 * yet in the local database, scrapes details, generates AI summaries,
 * downloads images, and generates a Prisma migration file with the new shows.
 *
 * Usage:
 *   node scripts/find-missing-hakahn-shows.mjs                # interactive (generates migration)
 *   node scripts/find-missing-hakahn-shows.mjs --json          # JSON output
 *   node scripts/find-missing-hakahn-shows.mjs --html          # HTML report
 */

import { runPipeline } from "./lib/pipeline.mjs";
import { launchBrowser } from "./lib/browser.mjs";
import { KHAN_THEATRE, fetchListing, scrapeShowDetails } from "./lib/hakahn.mjs";

await runPipeline({
  theatreId: "hakahn",
  theatreName: KHAN_THEATRE,
  theatreConst: KHAN_THEATRE,
  fetchListing,
  scrapeDetails: scrapeShowDetails,
  titlePreference: "listing-first",
  launchBrowser,
});
