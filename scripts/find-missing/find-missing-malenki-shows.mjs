#!/usr/bin/env node
/**
 * find-missing-malenki-shows.mjs
 *
 * Scrapes the Malenki Theatre website, finds shows not yet in the
 * local database, scrapes details, generates AI summaries, downloads
 * images, and generates a Prisma migration file with the new shows.
 *
 * Usage:
 *   node scripts/find-missing/find-missing-malenki-shows.mjs           # interactive (generates migration)
 *   node scripts/find-missing/find-missing-malenki-shows.mjs --json    # JSON output
 *   node scripts/find-missing/find-missing-malenki-shows.mjs --html    # HTML report
 */

import { runPipeline } from "../lib/pipeline.mjs";
import {
  MALENKI_THEATRE,
  fetchListing,
  scrapeShowDetails,
} from "../lib/malenki.mjs";
import { launchBrowser } from "../lib/browser.mjs";

await runPipeline({
  theatreId: "malenki",
  theatreName: MALENKI_THEATRE,
  theatreConst: MALENKI_THEATRE,
  fetchListing,
  scrapeDetails: scrapeShowDetails,
  titlePreference: "detail-first",
  launchBrowser,
});
