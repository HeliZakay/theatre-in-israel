#!/usr/bin/env node
/**
 * Backfill cast data for Tmuna Theatre (תיאטרון תמונע) shows.
 *
 * Scrapes each show's detail page on tmu-na.org.il, extracts actor names
 * from the credits section, and generates migration SQL.
 *
 * Usage:
 *   node scripts/backfill-tmuna-cast.mjs
 *   node scripts/backfill-tmuna-cast.mjs > migration.sql
 */

import { runCastBackfill } from "./lib/backfill-cast-pipeline.mjs";
import { launchBrowser } from "./lib/browser.mjs";
import {
  TMUNA_THEATRE,
  fetchShows,
  scrapeShowDetails,
} from "./lib/tmuna.mjs";

const { sql } = await runCastBackfill({
  theatreName: TMUNA_THEATRE,
  theatreLabel: "Tmuna Theatre (תיאטרון תמונע)",
  websiteUrl: "tmu-na.org.il",
  fetchListing: fetchShows,
  scrapeCast: async (browser, url) =>
    (await scrapeShowDetails(browser, url)).cast || null,
  launchBrowser,
});

if (sql) console.log(sql);
