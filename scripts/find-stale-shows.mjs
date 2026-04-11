#!/usr/bin/env node
/**
 * find-stale-shows.mjs — find DB shows not present on theatre websites.
 *
 * The reverse of find-all-missing-shows.mjs: reports shows that exist
 * in the database but were NOT found by scraping the theatre listing page.
 *
 * Usage:
 *   node scripts/find-stale-shows.mjs                       # all theatres
 *   node scripts/find-stale-shows.mjs --theatres cameri,habima
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import { THEATRE_IDS, loadTheatreConfigs } from "./lib/theatres.mjs";
import { createPrismaClient } from "./lib/db.mjs";
import { normalise } from "./lib/normalize.mjs";
import { green, red, cyan, bold, separator } from "./lib/cli.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

// ── Parse CLI flags ─────────────────────────────────────────────

const args = process.argv.slice(2);

let selectedIds = null;
const theatresIdx = args.indexOf("--theatres");
if (theatresIdx !== -1 && args[theatresIdx + 1]) {
  selectedIds = args[theatresIdx + 1]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// ── Title matching (mirrors pipeline.mjs logic) ─────────────────

const dashSepRe = /^\s+[-–—]\s+/;

function titlesMatch(dbTitle, scrapedTitle) {
  const normDb = normalise(dbTitle);
  const normScraped = normalise(scrapedTitle);
  if (normDb === normScraped) return true;

  const shorter =
    normDb.length <= normScraped.length ? normDb : normScraped;
  const longer =
    normDb.length <= normScraped.length ? normScraped : normDb;
  return (
    longer.startsWith(shorter) && dashSepRe.test(longer.slice(shorter.length))
  );
}

// ── Main ────────────────────────────────────────────────────────

async function main() {
  dotenv.config({ path: path.join(rootDir, ".env.local") });

  // Validate theatre IDs
  if (selectedIds) {
    const invalid = selectedIds.filter((id) => !THEATRE_IDS.includes(id));
    if (invalid.length > 0) {
      console.error(
        red(`Unknown theatre ID(s): ${invalid.join(", ")}`) +
          `\nValid IDs: ${THEATRE_IDS.join(", ")}`,
      );
      process.exit(1);
    }
  }

  const ids = selectedIds || [...THEATRE_IDS];

  console.log(
    bold(`\n🔍  Scanning ${ids.length} theatre(s) for stale DB shows…\n`),
  );
  console.log(`   Theatres: ${ids.join(", ")}\n`);

  // Connect to DB
  const db = await createPrismaClient();
  if (!db) {
    console.error(red("DATABASE_URL not set — cannot fetch DB shows."));
    process.exit(1);
  }

  // Load all configs
  const configs = await loadTheatreConfigs(ids);

  const allStale = [];
  const errors = [];

  for (const config of configs) {
    separator();
    console.log(
      cyan(bold(`\n📍 ${config.theatreName} (${config.theatreId})\n`)),
    );

    // Fetch DB shows for this theatre
    const dbShows = await db.prisma.show.findMany({
      where: { theatre: config.theatreConst },
      select: { title: true, slug: true },
    });

    if (dbShows.length === 0) {
      console.log(`   No shows in DB for this theatre.\n`);
      continue;
    }

    // Scrape listing
    let scrapedShows;
    try {
      const browser = await config.launchBrowser();
      try {
        scrapedShows = await config.fetchListing(browser);
      } finally {
        await browser.close();
      }
    } catch (err) {
      errors.push({ theatreId: config.theatreId, error: err.message });
      console.error(red(`   ✗ Failed to scrape: ${err.message}\n`));
      continue;
    }

    const scrapedTitles = scrapedShows.map((s) => s.title);

    // Find DB shows not in scraped listing
    const stale = dbShows.filter(
      (dbShow) => !scrapedTitles.some((st) => titlesMatch(dbShow.title, st)),
    );

    console.log(
      `   ${dbShows.length} in DB · ${scrapedShows.length} scraped · ${bold(String(stale.length))} not found on website\n`,
    );

    if (stale.length > 0) {
      for (const s of stale) {
        console.log(`   • ${s.title}`);
        allStale.push({
          theatre: config.theatreName,
          theatreId: config.theatreId,
          title: s.title,
          slug: s.slug,
        });
      }
      console.log("");
    }
  }

  // Summary
  separator();
  console.log("");

  if (errors.length > 0) {
    console.log(
      red(
        `⚠️  ${errors.length} theatre(s) failed: ${errors.map((e) => e.theatreId).join(", ")}\n`,
      ),
    );
  }

  if (allStale.length === 0) {
    console.log(green("✅  All DB shows were found on their theatre websites.\n"));
  } else {
    console.log(
      bold(`📊  Total: ${allStale.length} DB show(s) not found on websites\n`),
    );
  }

  await db.prisma.$disconnect();
  await db.pool.end();
}

main().catch((err) => {
  console.error("❌  Fatal error:", err.message);
  process.exit(1);
});
