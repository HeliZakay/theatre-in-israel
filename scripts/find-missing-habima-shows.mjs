#!/usr/bin/env node
/**
 * find-missing-habima-shows.mjs
 *
 * Scrapes the Habima Theatre repertoire, finds shows not yet in the
 * local database, scrapes details, generates AI summaries, downloads
 * images, and generates a Prisma migration file with the new shows.
 *
 * Usage:
 *   node scripts/find-missing-habima-shows.mjs                # interactive (generates migration)
 *   node scripts/find-missing-habima-shows.mjs --json          # JSON output
 *   node scripts/find-missing-habima-shows.mjs --html          # HTML report
 */

import { runPipeline } from "./lib/pipeline.mjs";
import { launchBrowser } from "./lib/browser.mjs";
import {
  HABIMA_THEATRE,
  fetchRepertoire,
  scrapeShowDetails,
} from "./lib/habima.mjs";

await runPipeline({
  theatreId: "habima",
  theatreName: HABIMA_THEATRE,
  theatreConst: HABIMA_THEATRE,
  fetchListing: fetchRepertoire,
  scrapeDetails: scrapeShowDetails,
  titlePreference: "listing-first",
  launchBrowser,
});
