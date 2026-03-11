#!/usr/bin/env node
/**
 * scrape-cameri-events.mjs
 *
 * Scrape performance dates/times from a Cameri show detail page.
 * Dry-run by default — prints scraped dates for review.
 *
 * Usage:
 *   node scripts/scrape-cameri-events.mjs <cameri-show-url>             # dry-run
 *   node scripts/scrape-cameri-events.mjs <cameri-show-url> --debug     # dump DOM for selector discovery
 *   node scripts/scrape-cameri-events.mjs <cameri-show-url> --apply     # write to DB (Venue + Event)
 */

import { launchBrowser, scrapeShowEvents, CAMERI_BASE } from "./lib/cameri.mjs";
import {
  bold,
  cyan,
  yellow,
  green,
  red,
  dim,
  bidi,
  separator,
  printField,
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
      "Usage: node scripts/scrape-cameri-events.mjs <cameri-show-url> [--debug] [--apply]",
    ),
  );
  process.exit(1);
}

// ── Main ────────────────────────────────────────────────────────

async function main() {
  separator();
  console.log(bold(cyan("  Cameri Events Scraper")));
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
    if (debug) {
      separator();
      console.log(bold(yellow("  DEBUG: Raw HTML of dates section")));
      separator();
      if (result.debugHtml) {
        console.log(result.debugHtml);
      } else {
        console.log(red("  (no dates container found)"));
      }

      if (result.debugDateElements?.length) {
        separator();
        console.log(bold(yellow("  DEBUG: Elements with date-like text")));
        separator();
        for (const el of result.debugDateElements) {
          console.log(
            dim(`  <${el.tag}`) +
              (el.id ? ` id="${el.id}"` : "") +
              (el.classes ? ` class="${el.classes}"` : "") +
              dim(">"),
          );
          console.log(`    ${bidi(el.text)}`);
          console.log("");
        }
      }
      separator();
    }

    // ── Venue ──
    if (result.venue) {
      console.log(`\n  ${yellow("Venue:")} ${bidi(result.venue)}`);
    } else {
      console.log(`\n  ${yellow("Venue:")} ${dim("(not detected)")}`);
    }

    // ── Events table ──
    if (result.events.length === 0) {
      console.log(red("\n  No dates/events found on this page."));
      console.log(dim("  Try --debug to inspect the DOM structure.\n"));
    } else {
      console.log(`\n  ${green(`Found ${result.events.length} event(s):`)}\n`);
      console.log(
        `  ${bold("Date")}         ${bold("Time")}    ${bold("Note")}`,
      );
      console.log(dim("  " + "-".repeat(50)));
      for (const ev of result.events) {
        const note = ev.note ? yellow(ev.note) : "";
        console.log(`  ${ev.date}    ${ev.hour || "??:??"}    ${note}`);
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
        // Resolve show from URL slug.
        const urlPath = decodeURIComponent(new URL(url).pathname);
        // Extract slug: last non-empty segment of the path.
        // Cameri URLs use underscores (לילה_טוב_אמא) but DB slugs use hyphens.
        const segments = urlPath.split("/").filter(Boolean);
        const slug = segments[segments.length - 1].replace(/_/g, "-");

        const show = await db.prisma.show.findFirst({
          where: { slug },
        });
        if (!show) {
          console.error(red(`  Show not found for slug: ${slug}`));
          process.exit(1);
        }
        console.log(dim(`  Show: ${show.title} (id=${show.id})`));

        // Upsert venue — always use the canonical theatre name regardless
        // of the specific hall (קאמרי 3, קאמרי 1, etc.) scraped from the page.
        const venueName = "תיאטרון הקאמרי";
        const venue = await db.prisma.venue.upsert({
          where: { name_city: { name: venueName, city: "תל אביב" } },
          create: { name: venueName, city: "תל אביב" },
          update: {},
        });
        console.log(dim(`  Venue: ${venue.name} (id=${venue.id})`));

        // Upsert events.
        let created = 0;
        let skipped = 0;
        for (const ev of result.events) {
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
