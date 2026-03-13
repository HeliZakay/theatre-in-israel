#!/usr/bin/env node
/**
 * scrape-all-or-akiva-events.mjs
 *
 * Scrape performance dates/times from היכל התרבות אור עקיבא venue website.
 * Matches venue listings to existing DB shows, then collects event dates.
 *
 * This scraper is simpler than most venue scrapers — all event data (title,
 * date, time) is on the listing page itself; no detail pages are needed.
 *
 * Dry-run by default — prints matches and scraped dates for review.
 *
 * Usage:
 *   node scripts/scrape-all-or-akiva-events.mjs                              # dry-run
 *   node scripts/scrape-all-or-akiva-events.mjs --apply                       # write to DB
 *   node scripts/scrape-all-or-akiva-events.mjs --json prisma/data/events-or-akiva.json
 *   node scripts/scrape-all-or-akiva-events.mjs --debug                       # dump raw listings
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
  VENUE_NAME,
  VENUE_CITY,
} from "./lib/venues/or-akiva.mjs";
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

// ── Main ────────────────────────────────────────────────────────

async function main() {
  separator();
  console.log(bold(cyan("  Or Akiva Venue Scraper — היכל התרבות אור עקיבא")));
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

  await browser.close();

  if (debug) {
    console.log(dim("  Raw listings:"));
    for (const item of listings) {
      console.log(dim(`    ${bidi(item.title)} | ${item.date} | ${item.hour}`));
    }
    console.log("");
  }

  // ── 3. Group by title, then match to DB shows ──
  /** @type {Map<string, { title: string, events: { date: string, hour: string }[] }>} */
  const byTitle = new Map();
  for (const item of listings) {
    if (!byTitle.has(item.title)) {
      byTitle.set(item.title, { title: item.title, events: [] });
    }
    byTitle.get(item.title).events.push({ date: item.date, hour: item.hour });
  }

  const matched = [];
  const unmatched = [];

  for (const group of byTitle.values()) {
    const result = matchVenueTitle(group.title, allDbShows);
    if (result) {
      matched.push({ ...result, title: group.title, events: group.events });
    } else {
      unmatched.push(group.title);
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
    process.exit(0);
  }

  console.log(cyan(`  Matched ${matched.length} shows.\n`));
  separator();

  // ── 4. Upsert canonical venue (once, for --apply mode) ──
  let db = null;
  let venue = null;
  if (apply) {
    db = await createPrismaClient();
    if (!db) {
      console.error(red("  DATABASE_URL not set — cannot apply."));
      process.exit(1);
    }
    venue = await db.prisma.venue.upsert({
      where: { name_city: { name: VENUE_NAME, city: VENUE_CITY } },
      create: { name: VENUE_NAME, city: VENUE_CITY },
      update: {},
    });
    console.log(dim(`  Venue: ${venue.name} (id=${venue.id})\n`));
  }

  // ── 5. Process events for each matched show ──
  const totals = { shows: 0, events: 0, created: 0, skipped: 0 };
  const collectedEvents = [];

  for (let i = 0; i < matched.length; i++) {
    const show = matched[i];
    const label = `[${i + 1}/${matched.length}]`;

    totals.shows++;
    totals.events += show.events.length;

    console.log(
      green(
        `  ${label} ${bidi(show.title)} → ${bidi(show.theatre)}: ${show.events.length} event(s)`,
      ),
    );

    // Print events in dry-run or debug mode
    if (!apply || debug) {
      for (const ev of show.events) {
        console.log(dim(`        ${ev.date}  ${ev.hour || "??:??"}`));
      }
    }

    // ── Collect for JSON output ──
    if (jsonPath) {
      for (const ev of show.events) {
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
      for (const ev of show.events) {
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
