#!/usr/bin/env node
/**
 * scrape-all-tzavta-theatre-events.mjs
 *
 * Scrape performance dates/times for ALL Tzavta Theatre shows in one run.
 * Fetches the show listing, matches shows to DB records,
 * then scrapes events from each show's detail page.
 *
 * Tzavta Theatre is a fixed venue — all events are at תיאטרון צוותא, תל אביב.
 *
 * Dry-run by default — prints scraped dates for review.
 *
 * Usage:
 *   node scripts/scrape-all-tzavta-theatre-events.mjs                                                     # dry-run
 *   node scripts/scrape-all-tzavta-theatre-events.mjs --apply                                             # write to DB
 *   node scripts/scrape-all-tzavta-theatre-events.mjs --json prisma/data/events-tzavta-theatre.json       # JSON file
 *   node scripts/scrape-all-tzavta-theatre-events.mjs --debug                                             # dump DOM per show
 */

import fs from "fs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { launchBrowser } from "./lib/browser.mjs";
import { fetchShows, scrapeShowEvents, TZAVTA_THEATRE } from "./lib/tzavta.mjs";
import { createPrismaClient, normaliseForMatch } from "./lib/db.mjs";
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
  console.log(bold(cyan("  Tzavta Theatre Events Scraper — All Shows")));
  console.log(
    dim(
      `  Mode: ${jsonPath ? "JSON OUTPUT" : apply ? "APPLY (write to DB)" : "DRY-RUN (review only)"}${debug ? " + DEBUG" : ""}`,
    ),
  );
  separator();

  // ── 1. Connect to DB and query all Tzavta Theatre shows ──
  const db = await createPrismaClient();
  if (!db) {
    console.error(red("  DATABASE_URL not set — cannot query shows."));
    process.exit(1);
  }

  let dbShows;
  try {
    dbShows = await db.prisma.show.findMany({
      where: { theatre: TZAVTA_THEATRE },
      select: { id: true, slug: true, title: true },
      orderBy: { title: "asc" },
    });
  } catch (err) {
    console.error(red(`  DB query failed: ${err.message}`));
    process.exit(1);
  }

  if (dbShows.length === 0) {
    console.log(yellow("  No Tzavta Theatre shows found in DB."));
    await db.prisma.$disconnect();
    await db.pool.end();
    process.exit(0);
  }

  console.log(dim(`\n  Found ${dbShows.length} Tzavta Theatre shows in DB.\n`));

  // ── 2. Launch browser and fetch show listing ──
  const browser = await launchBrowser();

  let listings;
  try {
    console.log(dim("  Fetching show listing…"));
    listings = await fetchShows(browser);
    console.log(dim(`  Listing returned ${listings.length} shows.\n`));
  } catch (err) {
    console.error(red(`  Failed to fetch show listing: ${err.message}`));
    await browser.close();
    await db.prisma.$disconnect();
    await db.pool.end();
    process.exit(1);
  }

  // ── 3. Build title→URL map and match DB shows ──
  const listingMap = new Map();
  for (const { title, url } of listings) {
    listingMap.set(normaliseForMatch(title), url);
  }

  const matched = [];
  const unmatched = [];
  for (const show of dbShows) {
    const key = normaliseForMatch(show.title);
    const url = listingMap.get(key);
    if (url) {
      matched.push({ ...show, url });
    } else {
      unmatched.push(show);
    }
  }

  if (unmatched.length > 0) {
    console.log(
      yellow(
        `  Could not match ${unmatched.length} DB show(s) to listing URLs:`,
      ),
    );
    for (const s of unmatched) {
      console.log(dim(`    - ${bidi(s.title)} (${s.slug})`));
    }
    console.log("");
  }

  if (matched.length === 0) {
    console.log(red("  No shows matched — nothing to scrape."));
    await browser.close();
    await db.prisma.$disconnect();
    await db.pool.end();
    process.exit(0);
  }

  console.log(cyan(`  Matched ${matched.length} shows. Scraping events…\n`));
  separator();

  // ── 4. Iterate over matched shows ──
  const venueCache = new Map(); // "name|city" → venue row
  const totals = { shows: 0, events: 0, created: 0, skipped: 0, failed: 0 };
  const collectedEvents = [];

  for (let i = 0; i < matched.length; i++) {
    const show = matched[i];
    const label = `[${i + 1}/${matched.length}]`;

    try {
      const result = await scrapeShowEvents(browser, show.url, { debug });

      if (result.events.length === 0) {
        console.log(yellow(`  ${label} ${bidi(show.title)}: no events found`));
        totals.shows++;
      } else {
        totals.shows++;
        totals.events += result.events.length;

        console.log(
          green(
            `  ${label} ${bidi(show.title)}: ${result.events.length} event(s)`,
          ),
        );

        // Print events in dry-run or debug mode
        if (!apply || debug) {
          for (const ev of result.events) {
            console.log(
              dim(
                `        ${ev.date}  ${ev.hour || "??:??"}  ${bidi(ev.venueName)}  (${bidi(ev.venueCity)})`,
              ),
            );
          }
        }

        // ── Collect for JSON output ──
        if (jsonPath) {
          for (const ev of result.events) {
            collectedEvents.push({
              showId: show.id,
              showSlug: show.slug,
              date: ev.date,
              hour: ev.hour || "00:00",
              venueName: ev.venueName,
              venueCity: ev.venueCity,
            });
          }
        }

        // ── Apply to DB ──
        if (apply && !jsonPath) {
          let created = 0;
          let skipped = 0;

          for (const ev of result.events) {
            const cacheKey = `${ev.venueName}|${ev.venueCity}`;

            let venue = venueCache.get(cacheKey);
            if (!venue) {
              venue = await db.prisma.venue.upsert({
                where: { name_city: { name: ev.venueName, city: ev.venueCity } },
                create: { name: ev.venueName, city: ev.venueCity },
                update: {},
              });
              venueCache.set(cacheKey, venue);
            }

            try {
              await db.prisma.event.upsert({
                where: {
                  showId_venueId_date_hour: {
                    showId: show.id,
                    venueId: venue.id,
                    date: new Date(ev.date),
                    hour: ev.hour || "00:00",
                  },
                },
                create: {
                  showId: show.id,
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

  // ── 5. Write JSON file if requested ──
  if (jsonPath) {
    const output = {
      scrapedAt: new Date().toISOString(),
      touring: true,
      events: collectedEvents,
    };
    const outPath = path.resolve(rootDir, jsonPath);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");
    console.log(
      green(`\n  Wrote ${collectedEvents.length} events to ${outPath}`),
    );
  }

  // ── 6. Summary ──
  await browser.close();
  await db.prisma.$disconnect();
  await db.pool.end();

  console.log("");
  separator();
  console.log(bold(cyan("  Summary")));
  separator();
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
    console.log(yellow(`  Shows unmatched:  ${unmatched.length}`));
  }
  separator();
  console.log("");
}

main().catch((err) => {
  console.error(red(err.message));
  process.exit(1);
});
