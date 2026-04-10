#!/usr/bin/env node
/**
 * scrape-elad-events.mjs
 *
 * Scrape performance dates/times for a single Elad Theatre show.
 * Visits the Wix show page to find the SmartTicket link, then
 * scrapes dates from the SmartTicket detail page.
 *
 * Dry-run by default — prints scraped dates for review.
 *
 * Usage:
 *   node scripts/scrapers/scrape-elad-events.mjs <show-url>             # dry-run
 *   node scripts/scrapers/scrape-elad-events.mjs <show-url> --debug     # dump raw HTML
 *   node scripts/scrapers/scrape-elad-events.mjs <show-url> --apply     # write to DB
 */

import { launchStealthBrowser } from "../lib/browser.mjs";
import {
  scrapeShowEvents,
  ELAD_THEATRE,
} from "../lib/elad.mjs";
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
      "Usage: node scripts/scrapers/scrape-elad-events.mjs <show-url> [--debug] [--apply]",
    ),
  );
  process.exit(1);
}

// ── Main ────────────────────────────────────────────────────────

async function main() {
  separator();
  console.log(bold(cyan("  Elad Theatre Events Scraper")));
  console.log(dim(`  URL: ${url}`));
  console.log(
    dim(
      `  Mode: ${apply ? "APPLY (write to DB)" : "DRY-RUN (review only)"}${debug ? " + DEBUG" : ""}`,
    ),
  );
  separator();

  const browser = await launchStealthBrowser();

  try {
    console.log(dim("\n  Scraping events…\n"));

    const result = await scrapeShowEvents(browser, url, { debug });

    // ── Debug output ──
    if (debug && result.debugHtml) {
      separator();
      console.log(bold(yellow("  DEBUG: SmartTicket page HTML (first 5000 chars)")));
      separator();
      console.log(dim(result.debugHtml.slice(0, 5000)));
      separator();
    }

    // ── Events table ──
    if (result.events.length === 0) {
      console.log(red("\n  No events found for this show URL."));
      console.log(
        dim("  Make sure the URL is a Wix show page with a SmartTicket link."),
      );
      console.log("");
    } else {
      console.log(
        `\n  ${green(`Found ${result.events.length} event(s):`)}\n`,
      );
      console.log(
        `  ${bold("Date")}         ${bold("Time")}    ${bold("Venue")}`,
      );
      console.log(dim("  " + "-".repeat(80)));
      for (const ev of result.events) {
        const venue = ev.venueName
          ? `${bidi(ev.venueName)}, ${bidi(ev.venueCity)}`
          : dim("(unknown)");
        console.log(
          `  ${ev.date}    ${ev.hour || "??:??"}    ${venue}`,
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
        // Resolve show from URL slug
        const slug = url.replace(/^https?:\/\/[^/]+\//, "").split("?")[0];
        const dbShows = await db.prisma.show.findMany({
          where: { theatre: ELAD_THEATRE },
          select: { id: true, slug: true, title: true },
        });

        // Try exact slug match, then normalised title match
        let show = dbShows.find((s) => s.slug === slug);
        if (!show) {
          const normSlug = normaliseForMatch(slug.replace(/-/g, " "));
          show = dbShows.find(
            (s) => normaliseForMatch(s.title) === normSlug,
          );
        }

        if (!show) {
          console.error(
            red(`  Show not found in DB for URL slug: ${slug}`),
          );
          console.error(
            dim("  Available shows:"),
          );
          for (const s of dbShows) {
            console.error(dim(`    ${bidi(s.title)} (${s.slug})`));
          }
          process.exit(1);
        }
        console.log(dim(`  Show: ${bidi(show.title)} (id=${show.id})`));

        let created = 0;
        let skipped = 0;

        for (const ev of result.events) {
          // Upsert venue per event (touring)
          const venue = await db.prisma.venue.upsert({
            where: {
              name_city: { name: ev.venueName, city: ev.venueCity },
            },
            create: {
              name: ev.venueName,
              city: ev.venueCity,
              regions: [],
            },
            update: {},
          });

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
