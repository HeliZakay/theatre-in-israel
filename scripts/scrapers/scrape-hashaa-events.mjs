#!/usr/bin/env node
/**
 * scrape-hashaa-events.mjs
 *
 * Scrape performance dates/times for a single Israeli Hour Theatre show.
 * Since all events come from the API, this script calls fetchListing()
 * to populate the cache, then reads events for the given show URL.
 *
 * Dry-run by default — prints scraped dates for review.
 *
 * Usage:
 *   node scripts/scrapers/scrape-hashaa-events.mjs <show-url>             # dry-run
 *   node scripts/scrapers/scrape-hashaa-events.mjs <show-url> --debug     # dump raw texts
 *   node scripts/scrapers/scrape-hashaa-events.mjs <show-url> --apply     # write to DB
 */

import { launchStealthBrowser } from "../lib/browser.mjs";
import {
  fetchListing,
  scrapeShowEvents,
  HASHAA_THEATRE,
  resolveVenueCity,
} from "../lib/hashaa.mjs";
import {
  bold,
  cyan,
  yellow,
  green,
  red,
  dim,
  bidi,
  separator,
} from "../lib/cli.mjs";

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
      "Usage: node scripts/scrapers/scrape-hashaa-events.mjs <show-url> [--debug] [--apply]",
    ),
  );
  process.exit(1);
}

// ── Main ────────────────────────────────────────────────────────

async function main() {
  separator();
  console.log(bold(cyan("  Israeli Hour Theatre Events Scraper")));
  console.log(dim(`  URL: ${url}`));
  console.log(
    dim(
      `  Mode: ${apply ? "APPLY (write to DB)" : "DRY-RUN (review only)"}${debug ? " + DEBUG" : ""}`,
    ),
  );
  separator();

  const browser = await launchStealthBrowser();

  try {
    console.log(dim("\n  Fetching API data…\n"));

    // Populate the events cache
    const listing = await fetchListing(browser);
    console.log(dim(`  Found ${listing.length} show(s) from API.\n`));

    // Read events for the requested show URL
    const result = await scrapeShowEvents(browser, url, { debug });

    // ── Debug output ──
    if (debug && result.events.length > 0) {
      separator();
      console.log(bold(yellow("  DEBUG: Raw event data")));
      separator();
      for (const ev of result.events) {
        console.log(dim(`    ${ev.rawText}`));
      }
      separator();
    }

    // ── Events table ──
    if (result.events.length === 0) {
      console.log(red("\n  No events found for this show URL."));
      console.log(dim("  Available shows:"));
      for (const s of listing) {
        console.log(dim(`    ${bidi(s.title)} → ${s.url}`));
      }
      console.log("");
    } else {
      console.log(
        `\n  ${green(`Found ${result.events.length} event(s) for ${bidi(result.title)}:`)}\n`,
      );
      console.log(
        `  ${bold("Date")}         ${bold("Time")}    ${bold("Venue")}`,
      );
      console.log(dim("  " + "-".repeat(60)));
      for (const ev of result.events) {
        const venue = ev.venueName ? bidi(ev.venueName) : dim("(unknown)");
        const city = resolveVenueCity(ev.venueName || "");
        const cityLabel = city !== "לא ידוע" ? dim(`(${bidi(city)})`) : "";
        console.log(
          `  ${ev.date}    ${ev.hour || "??:??"}    ${venue}  ${cityLabel}`,
        );
      }
    }

    // ── Apply to DB ──
    if (apply && result.events.length > 0) {
      separator();
      console.log(bold(cyan("  Writing to database…")));

      const { createPrismaClient, normaliseForMatch } = await import(
        "../lib/db.mjs"
      );
      const db = await createPrismaClient();
      if (!db) {
        console.error(red("  DATABASE_URL not set — cannot apply."));
        process.exit(1);
      }

      try {
        const pageTitle = result.title || "";
        if (!pageTitle) {
          console.error(
            red("  Could not extract show title — cannot resolve show."),
          );
          process.exit(1);
        }

        const normalisedTitle = normaliseForMatch(pageTitle);
        const dbShows = await db.prisma.show.findMany({
          where: { theatre: HASHAA_THEATRE },
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
            const venueName = ev.venueName || "תיאטרון השעה הישראלי";
            const venueCity = resolveVenueCity(venueName);
            const cacheKey = `${venueName}|${venueCity}`;

            let venue = venueCache.get(cacheKey);
            if (!venue) {
              venue = await db.prisma.venue.upsert({
                where: { name_city: { name: venueName, city: venueCity } },
                create: { name: venueName, city: venueCity },
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
