#!/usr/bin/env node
/**
 * find-missing-habima-guest-shows.mjs
 *
 * Scrapes the Habima Theatre guest-shows page (/הבימה-4/), finds
 * independent productions not yet in the local database, scrapes
 * details, generates AI summaries, downloads images, and generates
 * a Prisma migration file with the new shows.
 *
 * New shows are assigned theatre "הפקות עצמאיות" (slug: "independent").
 *
 * Usage:
 *   node scripts/find-missing/find-missing-habima-guest-shows.mjs                # interactive (generates migration)
 *   node scripts/find-missing/find-missing-habima-guest-shows.mjs --json          # JSON output
 *   node scripts/find-missing/find-missing-habima-guest-shows.mjs --html          # HTML report
 */

import { runPipeline } from "../lib/pipeline.mjs";
import { launchBrowser } from "../lib/browser.mjs";
import { scrapeShowDetails } from "../lib/habima.mjs";
import { fetchListing } from "../lib/venues/habima-guest.mjs";

const INDEPENDENT_THEATRE = "הפקות עצמאיות";

/** Adapt venue fetchListing (returns detailUrl) to pipeline format (expects url). */
async function fetchGuestListing(browser) {
  const listings = await fetchListing(browser);
  return listings.map(({ title, detailUrl }) => ({ title, url: detailUrl }));
}

await runPipeline({
  theatreId: "independent",
  theatreName: INDEPENDENT_THEATRE,
  theatreConst: INDEPENDENT_THEATRE,
  fetchListing: fetchGuestListing,
  scrapeDetails: scrapeShowDetails,
  titlePreference: "listing-first",
  launchBrowser,
});
