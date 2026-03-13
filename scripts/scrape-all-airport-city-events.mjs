#!/usr/bin/env node
/**
 * scrape-all-airport-city-events.mjs
 *
 * Scrape performance dates/times from היכל התרבות אייפורט סיטי venue website.
 * Matches venue listings to existing DB shows, then scrapes event dates
 * from each matched show's detail page.
 *
 * Dry-run by default — prints matches and scraped dates for review.
 *
 * Usage:
 *   node scripts/scrape-all-airport-city-events.mjs                              # dry-run
 *   node scripts/scrape-all-airport-city-events.mjs --apply                       # write to DB
 *   node scripts/scrape-all-airport-city-events.mjs --json prisma/data/events-airport-city.json
 *   node scripts/scrape-all-airport-city-events.mjs --debug                       # dump DOM per page
 */

import fs from "fs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { launchBrowser } from "./lib/browser.mjs";
import { createPrismaClient } from "./lib/db.mjs";
import { fetchAllDbShows, matchVenueTitle } from "./lib/venue-match.mjs";
import {
  fetchListing,
  scrapeEventDetail,
  VENUE_NAME,
  VENUE_CITY,
} from "./lib/venues/airport-city.mjs";
import {
  bold,
  cyan,
  yellow,
  green,
  red,
  dim,
  bidi,
  separator,
} from "./lib/cli.mjs";

// ── Parse CLI args ──────────────────────────────────────────────

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));

const debug = flags.has("--debug");
const apply = flags.has("--apply");

const jsonFlag = args.indexOf("--json");
const jsonPath = jsonFlag !== -1 ? args[jsonFlag + 1] : null;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(rootDir, ".env.local") });

const POLITE_DELAY = 1500;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Main ────────────────────────────────────────────────────────

async function main() {
  separator();
  console.log(bold(cyan("  Airport City Venue Scraper — היכל התרבות אייפורט סיטי")));
  console.log(
    dim(
      `  Mode: ${jsonPath ? "JSON OUTPUT" : apply ? "APPLY (write to DB)" : "DRY-RUN (review only)"}${debug ? " + DEBUG" : ""}`,
    ),
  );
  separator();

  // ── 1. Fetch all shows from DB ──
  const allDbShows = await fetchAllDbShows();
  if (!allDbShows) {
    console.error(red("  DATABASE_URL not set — cannot query shows."));
    process.exit(1);
  }

  console.log(dim(`\n  Found ${allDbShows.length} shows in DB (all theatres).\n`));

  // ── 2. Launch browser and fetch venue listing ──
  const browser = await launchBrowser();

  let listings;
  try {
    console.log(dim("  Fetching venue listing…"));
    listings = await fetchListing(browser);
    console.log(dim(`  Listing returned ${listings.length} events.\n`));
  } catch (err) {
    console.error(red(`  Failed to fetch listing: ${err.message}`));
    await browser.close();
    process.exit(1);
  }

  // ── 3. Match listing titles to DB shows ──
  const matched = [];
  const unmatched = [];

  for (const item of listings) {
    const result = matchVenueTitle(item.title, allDbShows);
    if (result) {
      matched.push({ ...result, title: item.title, detailUrl: item.detailUrl });
    } else {
      unmatched.push(item.title);
    }
  }

  if (unmatched.length > 0) {
    console.log(
      yellow(`  Could not match ${unmatched.length} listing(s) to DB shows:`),
    );
    for (const t of unmatched) {
      console.log(dim(`    - ${bidi(t)}`));
    }
    console.log("");
  }

  if (matched.length === 0) {
    console.log(yellow("  No listings matched — nothing to scrape."));
    await browser.close();
    process.exit(0);
  }

  console.log(cyan(`  Matched ${matched.length} listings. Scraping events…\n`));
  separator();

  // ── 4. Upsert canonical venue (once, for --apply mode) ──
  let db = null;
  let venue = null;
  if (apply) {
    db = await createPrismaClient();
    if (!db) {
      console.error(red("  DATABASE_URL not set — cannot apply."));
      await browser.close();
      process.exit(1);
    }
    venue = await db.prisma.venue.upsert({
      where: { name_city: { name: VENUE_NAME, city: VENUE_CITY } },
      create: { name: VENUE_NAME, city: VENUE_CITY },
      update: {},
    });
    console.log(dim(`  Venue: ${venue.name} (id=${venue.id})\n`));
  }

  // ── 5. Scrape events for each matched show ──
  const totals = { shows: 0, events: 0, created: 0, skipped: 0, failed: 0 };
  const collectedEvents = [];

  for (let i = 0; i < matched.length; i++) {
    const show = matched[i];
    const label = `[${i + 1}/${matched.length}]`;

    try {
      const result = await scrapeEventDetail(browser, show.detailUrl, { debug });

      if (result.events.length === 0) {
        console.log(yellow(`  ${label} ${bidi(show.title)}: no events found`));
        totals.shows++;

        if (debug && result.debugHtml) {
          console.log(dim("    (debug HTML dumped — check console)"));
        }
      } else {
        totals.shows++;
        totals.events += result.events.length;

        console.log(
          green(
            `  ${label} ${bidi(show.title)} → ${bidi(show.theatre)}: ${result.events.length} event(s)`,
          ),
        );

        // Print events in dry-run or debug mode
        if (!apply || debug) {
          for (const ev of result.events) {
            console.log(dim(`        ${ev.date}  ${ev.hour || "??:??"}`));
          }
        }

        // ── Collect for JSON output ──
        if (jsonPath) {
          for (const ev of result.events) {
            collectedEvents.push({
              showId: show.showId,
              showSlug: show.showSlug,
              date: ev.date,
              hour: ev.hour || "00:00",
            });
          }
        }

        // ── Apply to DB ──
        if (apply && !jsonPath && venue && db) {
          let created = 0;
          let skipped = 0;
          for (const ev of result.events) {
            try {
              await db.prisma.event.upsert({
                where: {
                  showId_venueId_date_hour: {
                    showId: show.showId,
                    venueId: venue.id,
                    date: new Date(ev.date),
                    hour: ev.hour || "00:00",
                  },
                },
                create: {
                  showId: show.showId,
                  venueId: venue.id,
                  date: new Date(ev.date),
                  hour: ev.hour || "00:00",
                },
                update: {},
              });
              created++;
            } catch (e) {
              skipped++;
              if (debug) {
                console.log(
                  dim(`        skip ${ev.date} ${ev.hour}: ${e.message}`),
                );
              }
            }
          }
          totals.created += created;
          totals.skipped += skipped;
          console.log(
            dim(`        → DB: ${created} created, ${skipped} skipped`),
          );
        }
      }
    } catch (err) {
      totals.failed++;
      totals.shows++;
      console.log(
        red(`  ${label} ${bidi(show.title)}: ERROR — ${err.message}`),
      );
    }

    // Polite delay between requests
    if (i < matched.length - 1) {
      await sleep(POLITE_DELAY);
    }
  }

  // ── 6. Write JSON file if requested ──
  if (jsonPath) {
    const output = {
      scrapedAt: new Date().toISOString(),
      venueSource: true,
      venue: { name: VENUE_NAME, city: VENUE_CITY },
      events: collectedEvents,
    };
    const outPath = path.resolve(rootDir, jsonPath);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");
    console.log(
      green(`\n  Wrote ${collectedEvents.length} events to ${outPath}`),
    );
  }

  // ── 7. Summary ──
  await browser.close();
  if (db) {
    await db.prisma.$disconnect();
    await db.pool.end();
  }

  console.log("");
  separator();
  console.log(bold(cyan("  Summary")));
  separator();
  console.log(`  Listings found:   ${listings.length}`);
  console.log(`  Shows matched:    ${matched.length}`);
  console.log(`  Shows processed:  ${totals.shows}`);
  console.log(`  Total events:     ${totals.events}`);
  if (apply && !jsonPath) {
    console.log(green(`  Events created:   ${totals.created}`));
    console.log(dim(`  Events skipped:   ${totals.skipped}`));
  }
  if (jsonPath) {
    console.log(green(`  Events written:   ${collectedEvents.length}`));
  }
  if (totals.failed > 0) {
    console.log(red(`  Shows failed:     ${totals.failed}`));
  }
  if (unmatched.length > 0) {
    console.log(yellow(`  Listings skipped: ${unmatched.length}`));
  }
  separator();
  console.log("");
}

main().catch((err) => {
  console.error(red(err.message));
  process.exit(1);
});
