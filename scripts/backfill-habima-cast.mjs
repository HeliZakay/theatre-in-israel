#!/usr/bin/env node
/**
 * Backfill cast data for Habima Theatre (תיאטרון הבימה) shows.
 *
 * Scrapes each show's detail page on habima.co.il, extracts actor names
 * from the "יוצרים ושחקנים" section, and generates migration SQL.
 *
 * Usage:
 *   node scripts/backfill-habima-cast.mjs
 *   node scripts/backfill-habima-cast.mjs > migration.sql
 */

import { runCastBackfill } from "./lib/backfill-cast-pipeline.mjs";
import { launchBrowser } from "./lib/browser.mjs";
import {
  HABIMA_THEATRE,
  fetchRepertoire,
  scrapeShowDetails,
} from "./lib/habima.mjs";

const { sql } = await runCastBackfill({
  theatreName: HABIMA_THEATRE,
  theatreLabel: "Habima Theatre (תיאטרון הבימה)",
  websiteUrl: "habima.co.il",
  fetchListing: fetchRepertoire,
  scrapeCast: async (browser, url) =>
    (await scrapeShowDetails(browser, url)).cast || null,
  launchBrowser,
});

if (sql) console.log(sql);
