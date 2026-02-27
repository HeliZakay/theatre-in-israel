#!/usr/bin/env node
/**
 * backfill-cast.mjs — backfills the `cast` column for existing shows
 * by scraping theatre websites.
 *
 * Usage:
 *   node scripts/backfill-cast.mjs                         # all theatres
 *   node scripts/backfill-cast.mjs --dry-run               # preview only
 *   node scripts/backfill-cast.mjs --theatres cameri,habima # only these two
 */

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { THEATRE_IDS, loadTheatreConfigs } from "./lib/theatres.mjs";
import { createPrismaClient, normalise } from "./lib/db.mjs";
import { green, red, cyan, yellow, bold, dim, separator } from "./lib/cli.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

const POLITE_DELAY = 1500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Escape a value for use in a SQL string literal.
 * Returns the string wrapped in single quotes with internal quotes doubled,
 * or the literal `NULL` for null/undefined values.
 */
function escapeSql(s) {
  if (s == null) return "NULL";
  return "'" + String(s).replace(/'/g, "''") + "'";
}

// ── Parse CLI flags ─────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");

let selectedIds = null;
const theatresIdx = args.indexOf("--theatres");
if (theatresIdx !== -1 && args[theatresIdx + 1]) {
  selectedIds = args[theatresIdx + 1]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// ── Main ────────────────────────────────────────────────────────

async function main() {
  dotenv.config({ path: path.join(rootDir, ".env.local") });

  // 0. Validate theatre IDs
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

  // 1. Connect to the database and fetch shows with cast = null
  const db = await createPrismaClient();
  if (!db) {
    console.error(
      red("DATABASE_URL is not set — cannot connect to the database."),
    );
    process.exit(1);
  }

  let showsMissingCast;
  try {
    showsMissingCast = await db.prisma.show.findMany({
      where: { cast: null },
      select: { id: true, title: true, slug: true, theatre: true },
    });
  } finally {
    await db.prisma.$disconnect();
    await db.pool.end();
  }

  if (showsMissingCast.length === 0) {
    console.log(
      green("\n✅  All shows already have cast data. Nothing to do.\n"),
    );
    process.exit(0);
  }

  console.log(
    bold(
      `\n🎭  Found ${showsMissingCast.length} show(s) with missing cast data.\n`,
    ),
  );

  // 2. Group shows by theatre name
  /** @type {Map<string, Array<{id: number, title: string, slug: string, theatre: string}>>} */
  const byTheatre = new Map();
  for (const show of showsMissingCast) {
    const list = byTheatre.get(show.theatre) || [];
    list.push(show);
    byTheatre.set(show.theatre, list);
  }

  // 3. Load theatre configs
  const ids = selectedIds || [...THEATRE_IDS];
  const configs = await loadTheatreConfigs(ids);

  // Build a lookup: theatreConst (theatre name) → config
  /** @type {Map<string, object>} */
  const configByName = new Map();
  for (const cfg of configs) {
    configByName.set(cfg.theatreConst, cfg);
  }

  // 4. For each theatre group, scrape and match
  /** @type {Array<{slug: string, cast: string}>} */
  const updates = [];
  let skippedNoConfig = 0;
  let skippedNoMatch = 0;
  let skippedNoCast = 0;
  let scraperErrors = 0;

  for (const [theatreName, dbShows] of byTheatre) {
    const config = configByName.get(theatreName);
    if (!config) {
      // Theatre not in the selected set or unknown — skip
      skippedNoConfig += dbShows.length;
      if (!selectedIds) {
        console.log(
          yellow(
            `⚠️  No scraper config found for "${theatreName}" — skipping ${dbShows.length} show(s)`,
          ),
        );
      }
      continue;
    }

    separator();
    console.log(
      cyan(
        bold(
          `\n📍 ${theatreName} (${config.theatreId}) — ${dbShows.length} show(s) missing cast\n`,
        ),
      ),
    );

    // 4a. Build a normalised-title → dbShow lookup for this theatre
    /** @type {Map<string, {id: number, title: string, slug: string, theatre: string}>} */
    const normTitleToShow = new Map();
    for (const s of dbShows) {
      normTitleToShow.set(normalise(s.title), s);
    }

    // 4b. Launch browser and fetch listing
    let browser;
    let listings;
    try {
      browser = await config.launchBrowser();
      listings = await config.fetchListing(browser);
    } catch (err) {
      console.error(
        red(
          `   ✗ Failed to fetch listing for ${theatreName}: ${err.message}\n`,
        ),
      );
      scraperErrors += dbShows.length;
      if (browser) await browser.close().catch(() => {});
      continue;
    }

    // 4c. Match listings to DB shows by normalised title
    /** @type {Array<{dbShow: object, url: string}>} */
    const matched = [];
    for (const listing of listings) {
      const normTitle = normalise(listing.title);
      const dbShow = normTitleToShow.get(normTitle);
      if (dbShow) {
        matched.push({ dbShow, url: listing.url });
      }
    }

    const unmatched = dbShows.length - matched.length;
    if (unmatched > 0) {
      skippedNoMatch += unmatched;
    }

    console.log(
      `   ${matched.length} matched on listing page (${unmatched} unmatched)\n`,
    );

    if (matched.length === 0) {
      await browser.close().catch(() => {});
      continue;
    }

    // 4d. Scrape detail pages for matched shows
    for (let i = 0; i < matched.length; i++) {
      const { dbShow, url } = matched[i];

      process.stdout.write(
        `  [${i + 1}/${matched.length}]  ${dbShow.title} … `,
      );

      try {
        const details = await config.scrapeDetails(browser, url);

        if (details.cast) {
          updates.push({ slug: dbShow.slug, cast: details.cast });
          console.log(green("✅ cast found"));
        } else {
          skippedNoCast++;
          console.log(yellow("⏭  no cast on page"));
        }
      } catch (err) {
        scraperErrors++;
        console.log(red(`⚠️  ${err.message}`));
      }

      // Be polite — wait between requests (skip after last one)
      if (i < matched.length - 1) {
        await sleep(POLITE_DELAY);
      }
    }

    await browser.close().catch(() => {});
  }

  // 5. Summary
  separator();
  console.log("");
  console.log(bold("📊  Summary:"));
  console.log(
    `   ${green(`${updates.length} show(s) with cast data to update`)}`,
  );
  if (skippedNoConfig > 0) {
    console.log(
      `   ${yellow(`${skippedNoConfig} show(s) skipped (no scraper config)`)}`,
    );
  }
  if (skippedNoMatch > 0) {
    console.log(
      `   ${yellow(`${skippedNoMatch} show(s) skipped (not found on listing page)`)}`,
    );
  }
  if (skippedNoCast > 0) {
    console.log(
      `   ${yellow(`${skippedNoCast} show(s) skipped (no cast on detail page)`)}`,
    );
  }
  if (scraperErrors > 0) {
    console.log(`   ${red(`${scraperErrors} show(s) failed due to errors`)}`);
  }
  console.log("");

  if (updates.length === 0) {
    console.log(yellow("Nothing to update — no migration file generated.\n"));
    process.exit(0);
  }

  // 6. Generate migration SQL
  const sqlLines = [
    `-- Migration: Backfill cast data for existing shows`,
    `-- Generated on ${new Date().toISOString()}`,
    `-- ${updates.length} show(s) updated`,
    "",
  ];

  for (const { slug, cast } of updates) {
    sqlLines.push(
      `UPDATE "Show" SET "cast" = ${escapeSql(cast)} WHERE "slug" = ${escapeSql(slug)};`,
    );
  }
  sqlLines.push("");

  const sql = sqlLines.join("\n");

  if (dryRun) {
    console.log(bold("🔍  Dry run — migration SQL that would be written:\n"));
    console.log(dim("─".repeat(60)));
    console.log(sql);
    console.log(dim("─".repeat(60)));
    console.log(yellow("\nNo migration file written (--dry-run).\n"));
    process.exit(0);
  }

  // 7. Write migration file
  const now = new Date();
  const ts = now.toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const migrationName = `${ts}_backfill_cast_data`;
  const migrationDir = path.join(
    rootDir,
    "prisma",
    "migrations",
    migrationName,
  );
  fs.mkdirSync(migrationDir, { recursive: true });
  const migrationFilePath = path.join(migrationDir, "migration.sql");
  fs.writeFileSync(migrationFilePath, sql, "utf-8");

  const relPath = path.relative(rootDir, migrationFilePath);
  console.log(green(`✅  Migration written to ${relPath}`));
  console.log(
    dim(`   Run ${bold("npx prisma migrate deploy")} to apply it.\n`),
  );
}

main().catch((err) => {
  console.error(red(`\n❌  Fatal error: ${err.message}`));
  process.exit(1);
});
