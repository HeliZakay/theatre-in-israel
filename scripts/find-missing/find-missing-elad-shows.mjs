#!/usr/bin/env node
/**
 * find-missing-elad-shows.mjs
 *
 * Discover new Elad Theatre shows not yet in the database.
 * Scrapes the Wix nav for show listing and Wix show pages for details.
 */

import { runPipeline } from "../lib/pipeline.mjs";
import {
  ELAD_THEATRE,
  fetchListing,
  scrapeShowDetails,
} from "../lib/elad.mjs";
import { launchStealthBrowser } from "../lib/browser.mjs";

await runPipeline({
  theatreId: "elad",
  theatreName: ELAD_THEATRE,
  theatreConst: ELAD_THEATRE,
  fetchListing,
  scrapeDetails: scrapeShowDetails,
  titlePreference: "detail-first",
  launchBrowser: launchStealthBrowser,
});
