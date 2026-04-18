#!/usr/bin/env node
/**
 * find-missing-davai-shows.mjs
 *
 * Scrapes the Davai Clown Theatre website, finds shows not yet in the
 * local database, scrapes details, generates AI summaries, downloads
 * images, and generates a Prisma migration file with the new shows.
 *
 * Usage:
 *   node scripts/find-missing/find-missing-davai-shows.mjs           # interactive (generates migration)
 *   node scripts/find-missing/find-missing-davai-shows.mjs --json    # JSON output
 *   node scripts/find-missing/find-missing-davai-shows.mjs --html    # HTML report
 */

import { runPipeline } from "../lib/pipeline.mjs";
import {
  DAVAI_THEATRE,
  fetchListing,
  scrapeShowDetails,
} from "../lib/davai.mjs";
import { launchBrowser } from "../lib/browser.mjs";

await runPipeline({
  theatreId: "davai",
  theatreName: DAVAI_THEATRE,
  theatreConst: DAVAI_THEATRE,
  fetchListing,
  scrapeDetails: scrapeShowDetails,
  titlePreference: "listing-first",
  launchBrowser,
});
