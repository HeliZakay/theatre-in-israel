#!/usr/bin/env node
/**
 * Backfill cast data for Beer Sheva Theatre (תיאטרון באר שבע) shows.
 *
 * Scrapes each show's detail page on b7t.co.il, extracts actor names
 * from the "משתתפים" section, and generates migration SQL.
 *
 * Usage:
 *   node scripts/backfill-beer-sheva-cast.mjs
 *   node scripts/backfill-beer-sheva-cast.mjs > migration.sql
 */

import { runCastBackfill } from "./lib/backfill-cast-pipeline.mjs";
import { launchBrowser } from "./lib/browser.mjs";
import {
  BEER_SHEVA_THEATRE,
  fetchListing,
  scrapeCast,
} from "./lib/beer-sheva.mjs";

const { sql } = await runCastBackfill({
  theatreName: BEER_SHEVA_THEATRE,
  theatreLabel: "Beer Sheva Theatre (תיאטרון באר שבע)",
  websiteUrl: "b7t.co.il",
  fetchListing,
  scrapeCast,
  launchBrowser,
});

if (sql) console.log(sql);
