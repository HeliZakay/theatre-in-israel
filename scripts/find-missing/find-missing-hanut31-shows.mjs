#!/usr/bin/env node
/**
 * find-missing-hanut31-shows.mjs
 *
 * Scrapes the Hanut31 Theatre website, finds shows not yet in the
 * local database, scrapes details, generates AI summaries, downloads
 * images, and generates a Prisma migration file with the new shows.
 *
 * Usage:
 *   node scripts/find-missing/find-missing-hanut31-shows.mjs           # interactive (generates migration)
 *   node scripts/find-missing/find-missing-hanut31-shows.mjs --json    # JSON output
 *   node scripts/find-missing/find-missing-hanut31-shows.mjs --html    # HTML report
 */

import { runPipeline } from "../lib/pipeline.mjs";
import {
  HANUT31_THEATRE,
  fetchListing,
  scrapeShowDetails,
} from "../lib/hanut31.mjs";
import { launchBrowser } from "../lib/browser.mjs";

await runPipeline({
  theatreId: "hanut31",
  theatreName: HANUT31_THEATRE,
  theatreConst: HANUT31_THEATRE,
  fetchListing,
  scrapeDetails: scrapeShowDetails,
  titlePreference: "detail-first",
  launchBrowser,
});
