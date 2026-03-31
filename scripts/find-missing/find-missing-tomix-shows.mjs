#!/usr/bin/env node
/**
 * find-missing-tomix-shows.mjs
 *
 * Scrapes the toMix Theatre (תיאטרון toMix) website, finds shows not
 * yet in the local database, scrapes details, generates AI summaries,
 * downloads images, and generates a Prisma migration file with the new shows.
 *
 * Usage:
 *   node scripts/find-missing/find-missing-tomix-shows.mjs                # interactive (generates migration)
 *   node scripts/find-missing/find-missing-tomix-shows.mjs --json          # JSON output
 *   node scripts/find-missing/find-missing-tomix-shows.mjs --html          # HTML report
 */

import { runPipeline } from "../lib/pipeline.mjs";
import { launchBrowser } from "../lib/browser.mjs";
import {
  TOMIX_THEATRE,
  fetchListing,
  scrapeShowDetails,
} from "../lib/tomix.mjs";

await runPipeline({
  theatreId: "tomix",
  theatreName: TOMIX_THEATRE,
  theatreConst: TOMIX_THEATRE,
  fetchListing,
  scrapeDetails: scrapeShowDetails,
  titlePreference: "detail-first",
  launchBrowser,
});
