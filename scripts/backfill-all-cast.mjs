#!/usr/bin/env node
/**
 * backfill-all-cast.mjs — backfill cast data for all (or selected) theatres.
 *
 * Scrapes all (or selected) theatres sequentially, looking for shows that
 * are missing cast data, extracts cast from each detail page, and generates
 * a combined migration SQL file.
 *
 * Usage:
 *   node scripts/backfill-all-cast.mjs                              # all theatres
 *   node scripts/backfill-all-cast.mjs --theatres cameri,habima     # specific theatres
 *
 * Outputs UPDATE statements to stdout. Redirect to a file if needed:
 *   node scripts/backfill-all-cast.mjs > migration.sql
 */

import { THEATRE_IDS, loadTheatreConfig } from "./lib/theatres.mjs";
import { runCastBackfill } from "./lib/backfill-cast-pipeline.mjs";
import { bold, green, red, cyan, separator } from "./lib/cli.mjs";

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

// ── Main ────────────────────────────────────────────────────────

async function main() {
  const ids = selectedIds || [...THEATRE_IDS];

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

  console.error(
    bold(`\n🎭  Backfilling cast data for ${ids.length} theatre(s)…\n`),
  );
  console.error(`   Theatres: ${ids.join(", ")}\n`);

  const allSql = [];
  const errors = [];

  for (const id of ids) {
    separator();
    console.error(cyan(bold(`\n📍 ${id}\n`)));

    try {
      const config = await loadTheatreConfig(id);
      const { sql } = await runCastBackfill({
        theatreName: config.theatreName,
        theatreLabel: config.theatreLabel,
        websiteUrl: config.websiteUrl,
        fetchListing: config.fetchListing,
        scrapeCast: config.scrapeCast,
        launchBrowser: config.launchBrowser,
      });
      if (sql) allSql.push(sql);
    } catch (err) {
      errors.push({ theatreId: id, error: err.message });
      console.error(red(`  ✗ Failed: ${err.message}\n`));
    }
  }

  // ── Summary ──
  separator();
  if (errors.length > 0) {
    console.error(
      red(
        `\n⚠️  ${errors.length} theatre(s) failed: ${errors.map((e) => e.theatreId).join(", ")}\n`,
      ),
    );
  }

  if (allSql.length > 0) {
    console.log(allSql.join("\n\n"));
  } else {
    console.error(green("\n✅  All shows already have cast data!\n"));
  }
}

main().catch((err) => {
  console.error(red(err.message));
  process.exit(1);
});
