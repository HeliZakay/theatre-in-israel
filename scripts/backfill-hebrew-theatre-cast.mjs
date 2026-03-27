#!/usr/bin/env node
/**
 * Backfill cast data for Hebrew Theatre (התיאטרון העברי) shows.
 *
 * Scrapes each show's detail page on teatron.org.il, extracts actor names
 * from the "משתתפים" section, and generates migration SQL.
 *
 * Usage:
 *   node scripts/backfill-hebrew-theatre-cast.mjs
 *   node scripts/backfill-hebrew-theatre-cast.mjs > migration.sql
 */

import { runCastBackfill } from "./lib/backfill-cast-pipeline.mjs";
import { launchBrowser } from "./lib/browser.mjs";
import {
  HEBREW_THEATRE,
  fetchListing,
  scrapeShowDetails,
} from "./lib/hebrew-theatre.mjs";

const { sql } = await runCastBackfill({
  theatreName: HEBREW_THEATRE,
  theatreLabel: "Hebrew Theatre (התיאטרון העברי)",
  websiteUrl: "teatron.org.il",
  fetchListing,
  scrapeCast: async (browser, url) =>
    (await scrapeShowDetails(browser, url)).cast || null,
  launchBrowser,
});

if (sql) console.log(sql);
