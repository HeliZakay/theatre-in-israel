#!/usr/bin/env node
/**
 * Backfill cast data for Tzavta Theatre (תיאטרון צוותא) shows.
 *
 * Scrapes each show's detail page on tzavta.co.il, extracts actor names
 * from the show_content_insert div, and generates migration SQL.
 *
 * Usage:
 *   node scripts/backfill-tzavta-cast.mjs
 *   node scripts/backfill-tzavta-cast.mjs > migration.sql
 */

import { runCastBackfill } from "./lib/backfill-cast-pipeline.mjs";
import { launchBrowser } from "./lib/browser.mjs";
import {
  TZAVTA_THEATRE,
  fetchShows,
  scrapeCast,
} from "./lib/tzavta.mjs";

const { sql } = await runCastBackfill({
  theatreName: TZAVTA_THEATRE,
  theatreLabel: "Tzavta Theatre (תיאטרון צוותא)",
  websiteUrl: "tzavta.co.il",
  fetchListing: fetchShows,
  scrapeCast,
  launchBrowser,
});

if (sql) console.log(sql);
