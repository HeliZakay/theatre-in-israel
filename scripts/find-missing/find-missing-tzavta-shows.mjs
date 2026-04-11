#!/usr/bin/env node
/**
 * find-missing-tzavta-shows.mjs
 *
 * Scrapes the Tzavta Theatre (תיאטרון צוותא) show listings, finds shows
 * not yet in the local database, scrapes details, generates AI summaries,
 * downloads images, and generates a Prisma migration file with the new shows.
 *
 * New shows are assigned to הפקות עצמאיות (independent productions)
 * since all shows at Tzavta are independent productions.
 *
 * Usage:
 *   node scripts/find-missing/find-missing-tzavta-shows.mjs                # interactive (generates migration)
 *   node scripts/find-missing/find-missing-tzavta-shows.mjs --json          # JSON output
 *   node scripts/find-missing/find-missing-tzavta-shows.mjs --html          # HTML report
 */

import { runPipeline } from "../lib/pipeline.mjs";
import { launchBrowser } from "../lib/browser.mjs";
import {
  TZAVTA_THEATRE,
  fetchListing,
  scrapeShowDetails,
} from "../lib/tzavta.mjs";

await runPipeline({
  theatreId: "tzavta",
  theatreName: TZAVTA_THEATRE,
  theatreConst: TZAVTA_THEATRE,
  assignTheatre: "הפקות עצמאיות",
  existingTheatres: [TZAVTA_THEATRE, "הפקות עצמאיות"],
  fetchListing,
  scrapeDetails: scrapeShowDetails,
  titlePreference: "listing-first",
  launchBrowser,
});
