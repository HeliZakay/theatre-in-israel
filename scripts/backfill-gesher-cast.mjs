#!/usr/bin/env node
/**
 * Backfill cast data for Gesher Theatre (תיאטרון גשר) shows.
 *
 * Scrapes each show's detail page on gesher-theatre.co.il, extracts actor names
 * from the "שחקנים" section, and generates migration SQL.
 *
 * Usage:
 *   node scripts/backfill-gesher-cast.mjs
 *   node scripts/backfill-gesher-cast.mjs > migration.sql
 */

import { runCastBackfill } from "./lib/backfill-cast-pipeline.mjs";
import { launchBrowser } from "./lib/browser.mjs";
import {
  GESHER_THEATRE,
  fetchShows,
  scrapeShowDetails,
} from "./lib/gesher.mjs";

const { sql } = await runCastBackfill({
  theatreName: GESHER_THEATRE,
  theatreLabel: "Gesher Theatre (תיאטרון גשר)",
  websiteUrl: "gesher-theatre.co.il",
  fetchListing: fetchShows,
  scrapeCast: async (browser, url) =>
    (await scrapeShowDetails(browser, url)).cast || null,
  launchBrowser,
});

if (sql) console.log(sql);
