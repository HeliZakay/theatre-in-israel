#!/usr/bin/env node
/**
 * find-missing-hebrew-theatre-shows.mjs
 *
 * Scrapes the Hebrew Theatre (התיאטרון העברי) website, finds shows not
 * yet in the local database, scrapes details, generates AI summaries,
 * downloads images, and generates a Prisma migration file with the new shows.
 *
 * Usage:
 *   node scripts/find-missing-hebrew-theatre-shows.mjs                # interactive (generates migration)
 *   node scripts/find-missing-hebrew-theatre-shows.mjs --json          # JSON output
 *   node scripts/find-missing-hebrew-theatre-shows.mjs --html          # HTML report
 */

import { runPipeline } from "./lib/pipeline.mjs";
import { launchBrowser } from "./lib/browser.mjs";
import {
  HEBREW_THEATRE,
  fetchListing,
  scrapeShowDetails,
} from "./lib/hebrew-theatre.mjs";

await runPipeline({
  theatreId: "hebrew-theatre",
  theatreName: HEBREW_THEATRE,
  theatreConst: HEBREW_THEATRE,
  fetchListing,
  scrapeDetails: scrapeShowDetails,
  titlePreference: "listing-first",
  launchBrowser,
});
