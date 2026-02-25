#!/usr/bin/env node
/**
 * find-missing-cameri-shows.mjs
 *
 * Scrapes the Cameri Theatre schedule, finds shows not yet in the
 * local database, scrapes details, generates AI summaries, downloads
 * images, and generates a Prisma migration file with the new shows.
 *
 * Usage:
 *   node scripts/find-missing-cameri-shows.mjs                # interactive (generates migration)
 *   node scripts/find-missing-cameri-shows.mjs --json          # JSON output
 *   node scripts/find-missing-cameri-shows.mjs --html          # HTML report
 */

import { runPipeline } from "./lib/pipeline.mjs";
import {
  CAMERI_THEATRE,
  launchBrowser,
  fetchSchedule,
  scrapeShowDetails,
} from "./lib/cameri.mjs";

await runPipeline({
  theatreId: "cameri",
  theatreName: CAMERI_THEATRE,
  theatreConst: CAMERI_THEATRE,
  fetchListing: fetchSchedule,
  scrapeDetails: scrapeShowDetails,
  titlePreference: "detail-first",
  launchBrowser,
});
