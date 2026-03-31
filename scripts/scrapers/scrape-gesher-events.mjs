#!/usr/bin/env node
/**
 * scrape-gesher-events.mjs
 *
 * Scrape performance dates/times from a Gesher Theatre show detail page.
 * Dry-run by default — prints scraped dates for review.
 *
 * Usage:
 *   node scripts/scrapers/scrape-gesher-events.mjs <show-url>             # dry-run
 *   node scripts/scrapers/scrape-gesher-events.mjs <show-url> --debug     # dump DOM
 *   node scripts/scrapers/scrape-gesher-events.mjs <show-url> --apply     # write to DB
 */

import { launchBrowser } from "../lib/browser.mjs";
import { scrapeShowEvents, GESHER_THEATRE } from "../lib/gesher.mjs";
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
      "Usage: node scripts/scrapers/scrape-gesher-events.mjs <show-url> [--debug] [--apply]",
    ),
  );
  process.exit(1);
}

// ── Main ────────────────────────────────────────────────────────

async function main() {
  separator();
  console.log(bold(cyan("  Gesher Theatre Events Scraper")));
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

      const { createPrismaClient } = await import("./lib/db.mjs");
      const db = await createPrismaClient();
      if (!db) {
        console.error(red("  DATABASE_URL not set — cannot apply."));
        process.exit(1);
      }

      try {
        // Resolve show from slug — Gesher URLs use ?ContentID=XXXX
        // so we try to extract the slug from the URL path segments first,
        // then fall back to matching by ContentID or title.
        const parsedUrl = new URL(url);
        const contentId = parsedUrl.searchParams.get("ContentID");
        const segments = parsedUrl.pathname.split("/").filter(Boolean);
        let slug = segments[segments.length - 1];
        // If the last segment is a generic path like "view", try ContentID
        if (!slug || slug === "view") {
          slug = contentId || slug;
        }
        slug = slug.replace(/[–—]/g, "-");

        const show = await db.prisma.show.findFirst({
          where: {
            theatre: GESHER_THEATRE,
            OR: [{ slug }, { slug: contentId }],
          },
        });
        if (!show) {
          console.error(red(`  Show not found for slug: ${slug}`));
          process.exit(1);
        }
        console.log(dim(`  Show: ${show.title} (id=${show.id})`));

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
