#!/usr/bin/env node
/**
 * find-missing-meshulash-shows.mjs
 *
 * Scrapes the Meshulash Theatre website, finds shows not yet in the
 * local database, scrapes details, generates AI summaries, downloads
 * images, and generates a Prisma migration file with the new shows.
 *
 * Usage:
 *   node scripts/find-missing/find-missing-meshulash-shows.mjs           # interactive (generates migration)
 *   node scripts/find-missing/find-missing-meshulash-shows.mjs --json    # JSON output
 *   node scripts/find-missing/find-missing-meshulash-shows.mjs --html    # HTML report
 */

import { runPipeline } from "../lib/pipeline.mjs";
import {
  MESHULASH_THEATRE,
  fetchListing,
  scrapeShowDetails,
} from "../lib/meshulash.mjs";
import { launchBrowser } from "../lib/browser.mjs";

await runPipeline({
  theatreId: "meshulash",
  theatreName: MESHULASH_THEATRE,
  theatreConst: MESHULASH_THEATRE,
  fetchListing,
  scrapeDetails: scrapeShowDetails,
  titlePreference: "detail-first",
  launchBrowser,
});
