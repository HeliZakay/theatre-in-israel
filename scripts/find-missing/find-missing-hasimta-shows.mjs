#!/usr/bin/env node
/**
 * find-missing-hasimta-shows.mjs
 *
 * Scrapes the Hasimta Theatre website, finds shows not yet in the
 * local database, scrapes details, generates AI summaries, downloads
 * images, and generates a Prisma migration file with the new shows.
 *
 * Usage:
 *   node scripts/find-missing/find-missing-hasimta-shows.mjs           # interactive (generates migration)
 *   node scripts/find-missing/find-missing-hasimta-shows.mjs --json    # JSON output
 *   node scripts/find-missing/find-missing-hasimta-shows.mjs --html    # HTML report
 */

import { runPipeline } from "../lib/pipeline.mjs";
import {
  HASIMTA_THEATRE,
  fetchListing,
  scrapeShowDetails,
} from "../lib/hasimta.mjs";
import { launchBrowser } from "../lib/browser.mjs";

await runPipeline({
  theatreId: "hasimta",
  theatreName: HASIMTA_THEATRE,
  theatreConst: HASIMTA_THEATRE,
  fetchListing,
  scrapeDetails: scrapeShowDetails,
  titlePreference: "detail-first",
  launchBrowser,
});
