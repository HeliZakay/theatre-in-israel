#!/usr/bin/env node
/**
 * find-missing-lessin-shows.mjs
 *
 * Scrapes the Beit Lessin Theatre website, finds shows not yet in the
 * local database, scrapes details, generates AI summaries, downloads
 * images, and generates a Prisma migration file with the new shows.
 *
 * Usage:
 *   node scripts/find-missing-lessin-shows.mjs                # interactive (generates migration)
 *   node scripts/find-missing-lessin-shows.mjs --json          # JSON output
 *   node scripts/find-missing-lessin-shows.mjs --html          # HTML report
 */

import { runPipeline } from "./lib/pipeline.mjs";
import { launchBrowser } from "./lib/browser.mjs";
import {
  LESSIN_THEATRE,
  fetchShows,
  scrapeShowDetails,
} from "./lib/lessin.mjs";

await runPipeline({
  theatreId: "lessin",
  theatreName: LESSIN_THEATRE,
  theatreConst: LESSIN_THEATRE,
  fetchListing: fetchShows,
  scrapeDetails: scrapeShowDetails,
  titlePreference: "listing-first",
  launchBrowser,
});
