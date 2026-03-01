#!/usr/bin/env node
/**
 * Backfill cast data for Khan Theatre (תיאטרון החאן) shows.
 *
 * Scrapes each show's detail page on khan.co.il, extracts actor names
 * from the ensemble-actors links, and generates migration SQL.
 *
 * Usage:
 *   node scripts/backfill-khan-cast.mjs
 *   node scripts/backfill-khan-cast.mjs > migration.sql
 */

import { runCastBackfill } from "./lib/backfill-cast-pipeline.mjs";
import { launchBrowser } from "./lib/browser.mjs";
import {
  KHAN_THEATRE,
  fetchShows,
  scrapeCast,
} from "./lib/hakahn.mjs";

const { sql } = await runCastBackfill({
  theatreName: KHAN_THEATRE,
  theatreLabel: "Khan Theatre (תיאטרון החאן)",
  websiteUrl: "khan.co.il",
  fetchListing: fetchShows,
  scrapeCast,
  launchBrowser,
});

if (sql) console.log(sql);
