#!/usr/bin/env node
/**
 * Backfill cast data for Cameri Theatre (תיאטרון הקאמרי) shows.
 *
 * Scrapes each show's detail page on cameri.co.il, extracts actor names
 * from the "משתתפים" section, and generates migration SQL.
 *
 * Usage:
 *   node scripts/backfill-cameri-cast.mjs
 *   node scripts/backfill-cameri-cast.mjs > migration.sql
 */

import { runCastBackfill } from "./lib/backfill-cast-pipeline.mjs";
import { launchBrowser } from "./lib/browser.mjs";
import {
  CAMERI_THEATRE,
  fetchListing,
  scrapeCast,
} from "./lib/cameri.mjs";

const { sql } = await runCastBackfill({
  theatreName: CAMERI_THEATRE,
  theatreLabel: "Cameri Theatre (תיאטרון הקאמרי)",
  websiteUrl: "cameri.co.il",
  fetchListing,
  scrapeCast,
  launchBrowser,
});

if (sql) console.log(sql);
