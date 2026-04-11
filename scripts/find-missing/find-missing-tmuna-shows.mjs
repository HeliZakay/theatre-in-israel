#!/usr/bin/env node
/**
 * find-missing-tmuna-shows.mjs
 *
 * Scrapes the Tmuna Theatre schedule, finds shows not yet in the
 * local database, scrapes details, generates AI summaries, downloads
 * images, and generates a Prisma migration file with the new shows.
 *
 * New shows are assigned to הפקות עצמאיות (independent productions)
 * since most shows at Tmuna are independent, not ensemble productions.
 *
 * Only theatrical productions are scraped — music concerts and
 * literature events are filtered out automatically.
 *
 * Usage:
 *   node scripts/find-missing/find-missing-tmuna-shows.mjs
 */

import { runPipeline } from "../lib/pipeline.mjs";
import { launchBrowser } from "../lib/browser.mjs";
import { TMUNA_THEATRE, fetchListing, scrapeShowDetails } from "../lib/tmuna.mjs";

await runPipeline({
  theatreId: "tmuna",
  theatreName: TMUNA_THEATRE,
  theatreConst: TMUNA_THEATRE,
  assignTheatre: "הפקות עצמאיות",
  existingTheatres: [TMUNA_THEATRE, "הפקות עצמאיות", "אנסמבל קבוצת עבודה"],
  fetchListing,
  scrapeDetails: scrapeShowDetails,
  titlePreference: "listing-first",
  launchBrowser,
});
