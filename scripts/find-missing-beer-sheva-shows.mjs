#!/usr/bin/env node
/**
 * find-missing-beer-sheva-shows.mjs
 *
 * Scrapes the Beer Sheva Theatre (תיאטרון באר שבע) website, finds shows
 * not yet in the local database, scrapes details, generates AI summaries,
 * downloads images, and generates a Prisma migration file with the new shows.
 *
 * Usage:
 *   node scripts/find-missing-beer-sheva-shows.mjs                # interactive (generates migration)
 *   node scripts/find-missing-beer-sheva-shows.mjs --json          # JSON output
 *   node scripts/find-missing-beer-sheva-shows.mjs --html          # HTML report
 */

import { runPipeline } from "./lib/pipeline.mjs";
import { launchBrowser } from "./lib/browser.mjs";
import {
  BEER_SHEVA_THEATRE,
  fetchListing,
  scrapeShowDetails,
} from "./lib/beer-sheva.mjs";

await runPipeline({
  theatreId: "beer-sheva",
  theatreName: BEER_SHEVA_THEATRE,
  theatreConst: BEER_SHEVA_THEATRE,
  fetchListing,
  scrapeDetails: scrapeShowDetails,
  titlePreference: "listing-first",
  launchBrowser,
});
