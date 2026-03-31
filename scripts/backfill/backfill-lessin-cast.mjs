#!/usr/bin/env node
/**
 * Backfill cast data for Beit Lessin Theatre (תיאטרון בית ליסין) shows.
 *
 * Scrapes each show's detail page on lessin.co.il, extracts actor names
 * from the "יוצרים ושחקנים" section, and generates migration SQL.
 *
 * Usage:
 *   node scripts/backfill/backfill-lessin-cast.mjs
 *   node scripts/backfill/backfill-lessin-cast.mjs > migration.sql
 */

import { runCastBackfill } from "../lib/backfill-cast-pipeline.mjs";
import { launchBrowser } from "../lib/browser.mjs";
import {
  LESSIN_THEATRE,
  fetchListing,
  scrapeShowDetails,
} from "../lib/lessin.mjs";

const { sql } = await runCastBackfill({
  theatreName: LESSIN_THEATRE,
  theatreLabel: "Beit Lessin Theatre (תיאטרון בית ליסין)",
  websiteUrl: "lessin.co.il",
  fetchListing,
  scrapeCast: async (browser, url) =>
    (await scrapeShowDetails(browser, url)).cast || null,
  launchBrowser,
});

if (sql) console.log(sql);
