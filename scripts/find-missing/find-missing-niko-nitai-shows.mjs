#!/usr/bin/env node
/**
 * find-missing-niko-nitai-shows.mjs
 *
 * Scrapes the Niko Nitai Theatre website, finds shows not yet
 * in the local database, scrapes details, generates AI summaries,
 * downloads images, and generates a Prisma migration file.
 *
 * Usage:
 *   node scripts/find-missing/find-missing-niko-nitai-shows.mjs           # interactive
 *   node scripts/find-missing/find-missing-niko-nitai-shows.mjs --json    # JSON output
 *   node scripts/find-missing/find-missing-niko-nitai-shows.mjs --html    # HTML report
 */

import { runPipeline } from "../lib/pipeline.mjs";
import {
  NIKO_NITAI_THEATRE,
  fetchListing,
  scrapeShowDetails,
} from "../lib/niko-nitai.mjs";
import { launchStealthBrowser } from "../lib/browser.mjs";

await runPipeline({
  theatreId: "niko-nitai",
  theatreName: NIKO_NITAI_THEATRE,
  theatreConst: NIKO_NITAI_THEATRE,
  fetchListing,
  scrapeDetails: scrapeShowDetails,
  titlePreference: "listing-first",
  launchBrowser: launchStealthBrowser,
});
