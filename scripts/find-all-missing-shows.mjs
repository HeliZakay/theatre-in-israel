#!/usr/bin/env node
/**
 * find-all-missing-shows.mjs — unified scraper for all theatres.
 *
 * Scrapes all (or selected) theatres, shows a combined interactive
 * HTML review UI, and generates a single migration file.
 *
 * Usage:
 *   node scripts/find-all-missing-shows.mjs                 # all theatres, interactive
 *   node scripts/find-all-missing-shows.mjs --json           # all theatres, JSON output
 *   node scripts/find-all-missing-shows.mjs --html           # all theatres, HTML file
 *   node scripts/find-all-missing-shows.mjs --theatres cameri,habima   # only these two
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

import {
  THEATRE_IDS,
  loadTheatreConfigs,
  loadAllTheatreConfigs,
} from "./lib/theatres.mjs";
import {
  collectMissingShows,
  createAIClient,
  startServer,
  saveAndOpenHtml,
} from "./lib/pipeline.mjs";
import { fetchAllExistingSlugs } from "./lib/db.mjs";
import { green, red, cyan, bold, separator } from "./lib/cli.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

// ── Parse CLI flags ─────────────────────────────────────────────

const args = process.argv.slice(2);
const jsonMode = args.includes("--json");
const htmlMode = args.includes("--html");

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

  const ids = selectedIds || [...THEATRE_IDS];

  if (!jsonMode) {
    console.log(
      bold(`\n🎭  Scanning ${ids.length} theatre(s) for missing shows…\n`),
    );
    console.log(`   Theatres: ${ids.join(", ")}\n`);
  }

  // 1. Load theatre configs
  const configs = await loadTheatreConfigs(ids);

  // 2. Ensure local DB has all migrations applied
  if (process.env.DATABASE_URL) {
    try {
      if (!jsonMode) console.log("🔄 Applying pending migrations…");
      execSync("npx prisma migrate deploy", {
        cwd: rootDir,
        stdio: jsonMode ? "ignore" : "inherit",
      });
      if (!jsonMode) console.log("");
    } catch {
      if (!jsonMode) {
        console.warn(
          "⚠️  prisma migrate deploy failed — continuing with current DB state.\n",
        );
      }
    }
  }

  // 3. Shared resources (fetched once, reused across all theatres)
  const existingSlugs = await fetchAllExistingSlugs();
  const aiClient = createAIClient();

  if (!jsonMode) {
    if (!aiClient) {
      console.warn("⚠️  GITHUB_TOKEN not set — AI summaries will be skipped\n");
    }
    if (!existingSlugs) {
      console.warn(
        "⚠️  DATABASE_URL not set — will scrape details for ALL shows\n",
      );
    }
  }

  // 4. Scrape each theatre sequentially
  const groups = [];
  const errors = [];

  for (const config of configs) {
    if (!jsonMode) {
      separator();
      console.log(
        cyan(bold(`\n📍 ${config.theatreName} (${config.theatreId})\n`)),
      );
    }

    try {
      const result = await collectMissingShows(config, {
        existingSlugs,
        aiClient,
        quiet: jsonMode,
      });

      if (result) {
        groups.push(result);
        if (!jsonMode) {
          console.log(
            green(`   ✓ ${result.results.length} missing show(s) found\n`),
          );
        }
      }
    } catch (err) {
      errors.push({ theatreId: config.theatreId, error: err.message });
      if (!jsonMode) {
        console.error(
          red(`   ✗ Failed to scrape ${config.theatreName}: ${err.message}\n`),
        );
      }
    }
  }

  // 5. Summary
  if (!jsonMode) {
    separator();
    console.log("");

    const totalShows = groups.reduce((sum, g) => sum + g.results.length, 0);
    if (errors.length > 0) {
      console.log(
        red(
          `⚠️  ${errors.length} theatre(s) failed: ${errors.map((e) => e.theatreId).join(", ")}\n`,
        ),
      );
    }

    if (groups.length === 0) {
      console.log(green("✅  All shows are up to date across all theatres!\n"));
      process.exit(0);
    }

    const breakdown = groups
      .map(
        (g) => `${g.theatreName}: ${g.results.filter((r) => !r.error).length}`,
      )
      .join(", ");
    console.log(
      bold(
        `📊  Total: ${totalShows} missing show(s) from ${groups.length} theatre(s)`,
      ),
    );
    console.log(`   ${breakdown}\n`);
  }

  // 6. Output
  if (jsonMode) {
    const allResults = groups.flatMap((g) => g.results);
    if (allResults.length === 0) {
      console.log("[]");
    } else {
      console.log(JSON.stringify(allResults, null, 2));
    }
  } else if (htmlMode) {
    saveAndOpenHtml("כל התיאטראות", "all_theatres", groups);
  } else {
    if (groups.length === 0) {
      process.exit(0);
    }
    await startServer("כל התיאטראות", "all_theatres", groups);
  }
}

main().catch((err) => {
  console.error("❌  Fatal error:", err.message);
  process.exit(1);
});
