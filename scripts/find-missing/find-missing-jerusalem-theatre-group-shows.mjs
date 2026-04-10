#!/usr/bin/env node
/**
 * find-missing-jerusalem-theatre-group-shows.mjs
 *
 * Scrapes the Jerusalem Theatre Group website, finds shows not yet
 * in the local database, scrapes details, generates AI summaries,
 * downloads images, and generates a Prisma migration file.
 *
 * Usage:
 *   node scripts/find-missing/find-missing-jerusalem-theatre-group-shows.mjs           # interactive
 *   node scripts/find-missing/find-missing-jerusalem-theatre-group-shows.mjs --json    # JSON output
 *   node scripts/find-missing/find-missing-jerusalem-theatre-group-shows.mjs --html    # HTML report
 */

import { runPipeline } from "../lib/pipeline.mjs";
import {
  JERUSALEM_THEATRE_GROUP,
  fetchListing,
  scrapeShowDetails,
} from "../lib/jerusalem-theatre-group.mjs";
import { launchBrowser } from "../lib/browser.mjs";

await runPipeline({
  theatreId: "jerusalem-theatre-group",
  theatreName: JERUSALEM_THEATRE_GROUP,
  theatreConst: JERUSALEM_THEATRE_GROUP,
  fetchListing,
  scrapeDetails: scrapeShowDetails,
  titlePreference: "listing-first",
  launchBrowser,
});
