#!/usr/bin/env node
/**
 * Backfill cast data for Haifa Theatre (תיאטרון חיפה) shows.
 *
 * Scrapes each show's detail page on ht1.co.il, extracts actor names
 * from the "בהשתתפות:" section, and generates migration SQL.
 *
 * Usage:
 *   node scripts/backfill-haifa-cast.mjs
 *   node scripts/backfill-haifa-cast.mjs > migration.sql
 */

import { runCastBackfill } from "./lib/backfill-cast-pipeline.mjs";
import { launchBrowser } from "./lib/browser.mjs";
import {
  HAIFA_THEATRE,
  fetchListing,
  scrapeShowDetails,
} from "./lib/haifa.mjs";

const { sql } = await runCastBackfill({
  theatreName: HAIFA_THEATRE,
  theatreLabel: "Haifa Theatre (תיאטרון חיפה)",
  websiteUrl: "ht1.co.il",
  fetchListing,
  scrapeCast: async (browser, url) =>
    (await scrapeShowDetails(browser, url)).cast || null,
  launchBrowser,
});

if (sql) console.log(sql);
