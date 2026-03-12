#!/usr/bin/env node
/**
 * scrape-habima-theatre-events.mjs
 *
 * Scrape performance dates/times from a Habima Theatre show detail page.
 * Dry-run by default — prints scraped dates for review.
 *
 * Usage:
 *   node scripts/scrape-habima-theatre-events.mjs <show-url>             # dry-run
 *   node scripts/scrape-habima-theatre-events.mjs <show-url> --debug     # dump DOM
 *   node scripts/scrape-habima-theatre-events.mjs <show-url> --apply     # write to DB
 */

import { launchBrowser } from "./lib/browser.mjs";
import { scrapeShowEvents, HABIMA_THEATRE } from "./lib/habima.mjs";
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
const positional = args.filter((a) => !a.startsWith("--"));

const debug = flags.has("--debug");
const apply = flags.has("--apply");
const url = positional[0];

if (!url) {
  console.error(
    red(
      "Usage: node scripts/scrape-habima-theatre-events.mjs <show-url> [--debug] [--apply]",
    ),
  );
  process.exit(1);
}

// ── Main ────────────────────────────────────────────────────────

async function main() {
  separator();
  console.log(bold(cyan("  Habima Theatre Events Scraper")));
  console.log(dim(`  URL: ${url}`));
  console.log(
    dim(
      `  Mode: ${apply ? "APPLY (write to DB)" : "DRY-RUN (review only)"}${debug ? " + DEBUG" : ""}`,
    ),
  );
  separator();

  const browser = await launchBrowser();

  try {
    console.log(dim("\n  Launching browser and loading page…\n"));
    const result = await scrapeShowEvents(browser, url, { debug });

    // ── Debug output ──
    if (debug && result.debugHtml) {
      separator();
      console.log(bold(yellow("  DEBUG: Raw HTML of dates section")));
      separator();
      console.log(result.debugHtml);
      separator();
    }

    // ── Events table ──
    if (result.events.length === 0) {
      console.log(red("\n  No dates/events found on this page."));
      console.log(dim("  Try --debug to inspect the DOM structure.\n"));
    } else {
      console.log(`\n  ${green(`Found ${result.events.length} event(s):`)}\n`);
      console.log(
        `  ${bold("Date")}         ${bold("Time")}    ${bold("Venue")}`,
      );
      console.log(dim("  " + "-".repeat(60)));
      for (const ev of result.events) {
        const venue = bidi(ev.venueName);
        const city = dim(`(${bidi(ev.venueCity)})`);
        console.log(
          `  ${ev.date}    ${ev.hour || "??:??"}    ${venue}  ${city}`,
        );
        if (debug && ev.rawText) {
          console.log(dim(`    raw: ${bidi(ev.rawText)}`));
        }
      }
    }

    // ── Apply to DB ──
    if (apply && result.events.length > 0) {
      separator();
      console.log(bold(cyan("  Writing to database…")));

      const { createPrismaClient, normaliseForMatch } = await import("./lib/db.mjs");
      const db = await createPrismaClient();
      if (!db) {
        console.error(red("  DATABASE_URL not set — cannot apply."));
        process.exit(1);
      }

      try {
        const pageTitle = result.title || "";
        if (!pageTitle) {
          console.error(red("  Could not extract show title from page — cannot resolve show."));
          process.exit(1);
        }

        const normalisedTitle = normaliseForMatch(pageTitle);
        const dbShows = await db.prisma.show.findMany({
          where: { theatre: HABIMA_THEATRE },
          select: { id: true, slug: true, title: true },
        });

        const show = dbShows.find(
          (s) => normaliseForMatch(s.title) === normalisedTitle,
        );
        if (!show) {
          console.error(
            red(`  Show not found for title: ${bidi(pageTitle)}`),
          );
          process.exit(1);
        }
        console.log(dim(`  Show: ${bidi(show.title)} (id=${show.id})`));

        const venueCache = new Map();
        let created = 0;
        let skipped = 0;

        for (const ev of result.events) {
          try {
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
            console.log(dim(`  Skipped ${ev.date} ${ev.hour}: ${e.message}`));
            skipped++;
          }
        }
        console.log(green(`\n  Created: ${created}, Skipped: ${skipped}`));
      } finally {
        await db.prisma.$disconnect();
        await db.pool.end();
      }
    }

    console.log("");
    separator();
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(red(err.message));
  process.exit(1);
});
