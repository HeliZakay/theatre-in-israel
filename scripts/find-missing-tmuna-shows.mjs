#!/usr/bin/env node
/**
 * find-missing-tmuna-shows.mjs
 *
 * Scrapes the Tmuna Theatre schedule, finds shows not yet in the
 * local database, scrapes details, generates AI summaries, downloads
 * images, and generates a Prisma migration file with the new shows.
 *
 * Only theatrical productions are scraped — music concerts and
 * literature events are filtered out automatically.
 *
 * Usage:
 *   node scripts/find-missing-tmuna-shows.mjs
 */

import { runPipeline } from "./lib/pipeline.mjs";
import { launchBrowser } from "./lib/browser.mjs";
import { TMUNA_THEATRE, fetchListing, scrapeShowDetails } from "./lib/tmuna.mjs";

await runPipeline({
  theatreId: "tmuna",
  theatreName: TMUNA_THEATRE,
  theatreConst: TMUNA_THEATRE,
  fetchListing,
  scrapeDetails: scrapeShowDetails,
  titlePreference: "listing-first",
  launchBrowser,
});
