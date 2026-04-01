#!/usr/bin/env node
/**
 * pipeline.mjs — shared scraping pipeline for theatre show discovery.
 *
 * Extracts all common logic so each theatre scraper is a thin wrapper
 * that passes its config here.
 *
 * HTML generation lives in ./html-generator.mjs; the interactive server
 * in ./html-server.mjs; AI processing in ./ai.mjs; migration SQL in
 * ./migration.mjs. All are re-exported here for backward compatibility.
 *
 * Exports:
 *   runPipeline(config)                  — full single-theatre pipeline (original entry point)
 *   collectMissingShows(config, options) — phases 1-4c only (no dotenv, no migrate, no output)
 *   generateHtml(title, groups)          — re-exported from ./html-generator.mjs
 *   startServer(title, theatreId, groups)— re-exported from ./html-server.mjs
 *   saveAndOpenHtml(title, theatreId, groups) — re-exported from ./html-server.mjs
 *   createAIClient()                     — re-exported from ./ai.mjs
 *   processDescriptions(aiClient, results, opts) — re-exported from ./ai.mjs
 *   classifyGenres(aiClient, results, opts)      — re-exported from ./ai.mjs
 *   generateMigrationSQL(shows, theatreId)       — re-exported from ./migration.mjs
 *   writeMigrationFile(sql, theatreId)            — re-exported from ./migration.mjs
 */

import dotenv from "dotenv";
import fs from "fs";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

import { generateSlug } from "./slug.mjs";
import { downloadAndConvert } from "./image.mjs";
import {
  normalise,
  fetchExistingTitles,
  fetchAllExistingSlugs,
  loadExcludedShows,
} from "./db.mjs";
import {
  createAIClient,
  processDescriptions,
  classifyGenres,
} from "./ai.mjs";

// ── Setup ───────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..", "..");

const POLITE_DELAY = 1500;

// ── Helpers ─────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Re-exports for backward compatibility ───────────────────────

export { generateHtml } from "./html-generator.mjs";
export { saveAndOpenHtml, startServer } from "./html-server.mjs";
export {
  createAIClient,
  processDescriptions,
  classifyGenres,
} from "./ai.mjs";
export {
  generateMigrationSQL,
  writeMigrationFile,
} from "./migration.mjs";

// ── Collect missing shows (phases 1–4c) ─────────────────────────

/**
 * Scrape a single theatre and return its missing shows with AI-enriched data.
 *
 * Does NOT call dotenv.config() or prisma migrate — the caller is responsible.
 * Does NOT branch on --json/--html — the caller decides how to present results.
 *
 * @param {object} config              — same shape as runPipeline's config
 * @param {object} [options]
 * @param {boolean} [options.quiet=false]           — suppress progress logs
 * @param {Set|null} [options.existingTitles]       — pre-fetched DB titles (null = no DB)
 * @param {Map|null} [options.existingSlugs]        — pre-fetched slug→theatre map
 * @param {object|null} [options.aiClient]          — OpenAI client instance
 * @returns {Promise<{theatreId,theatreName,theatreConst,results:Array}|null>}
 *          null when there are no missing shows.
 */
export async function collectMissingShows(config, options = {}) {
  const {
    theatreId,
    theatreName,
    theatreConst,
    fetchListing,
    scrapeDetails,
    titlePreference,
    launchBrowser,
  } = config;

  const quiet = options.quiet ?? false;

  // ── Resolve DB state ──────────────────────────────────────────
  const titlesProvided = "existingTitles" in options;
  const existingSet = titlesProvided
    ? options.existingTitles
    : await fetchExistingTitles(theatreConst);

  const slugsProvided = "existingSlugs" in options;
  const slugMap = slugsProvided
    ? options.existingSlugs
    : await fetchAllExistingSlugs();

  const hasDb = existingSet !== null;

  // ── Resolve AI client ─────────────────────────────────────────
  const aiProvided = "aiClient" in options;
  const ai = aiProvided ? options.aiClient : createAIClient();

  // Print warnings only in standalone mode (caller did not supply values)
  if (!aiProvided && !ai) {
    console.warn("⚠️  GITHUB_TOKEN not set — AI summaries will be skipped\n");
  }
  if (!titlesProvided && !hasDb) {
    console.warn(
      "⚠️  DATABASE_URL not set — will scrape details for ALL shows\n",
    );
  }

  // ── Scrape listing page ───────────────────────────────────────
  const browser = await launchBrowser();

  let allShows;
  try {
    allShows = await fetchListing(browser);
  } catch (err) {
    await browser.close();
    throw err;
  }

  // ── Filter to missing shows ───────────────────────────────────
  // Exact match first, then check for dash-separated subtitle differences.
  // Listing cleaners may strip subtitles (e.g. "מצחיקונת – Funny Girl" → "מצחיקונת")
  // while detail-first theatres store the full detail title in the DB.
  const dashSepRe = /^\s+[-–—]\s+/;
  const titleInDb = (scraped) => {
    const norm = normalise(scraped);
    if (existingSet.has(norm)) return true;
    for (const dbTitle of existingSet) {
      const shorter = norm.length <= dbTitle.length ? norm : dbTitle;
      const longer = norm.length <= dbTitle.length ? dbTitle : norm;
      if (longer.startsWith(shorter) && dashSepRe.test(longer.slice(shorter.length))) {
        return true;
      }
    }
    return false;
  };
  const missingShows = hasDb
    ? allShows.filter((s) => !titleInDb(s.title))
    : allShows;

  // ── Filter out previously excluded shows ──────────────────────
  const excludedSet = options.excludedShows ?? loadExcludedShows();
  const afterExclusion = missingShows.filter(
    (s) => !excludedSet.has(normalise(s.title) + "||" + theatreConst),
  );
  const excludedCount = missingShows.length - afterExclusion.length;
  if (excludedCount > 0 && !quiet) {
    console.log(`   ⏭  Skipping ${excludedCount} previously excluded show(s)`);
  }

  if (afterExclusion.length === 0) {
    if (!quiet) {
      console.log(
        `\n🎭  All ${theatreName} shows are already in the database. ✅\n`,
      );
      console.log(
        `   (${allShows.length} scraped · ${existingSet?.size ?? 0} in DB` +
          (excludedCount > 0 ? ` · ${excludedCount} excluded` : "") +
          `)\n`,
      );
    }
    await browser.close();
    return null;
  }

  if (!quiet) {
    const label = hasDb
      ? `Found ${afterExclusion.length} missing show(s) (out of ${allShows.length} scraped, ${existingSet.size} in DB` +
        (excludedCount > 0 ? `, ${excludedCount} excluded` : "") +
        `)`
      : `Scraping details for ${afterExclusion.length} show(s)`;
    console.log(`\n🎭  ${label}\n`);
    console.log("   Fetching details for each show…\n");
  }

  // ── Scrape each missing show's detail page ────────────────────
  const results = [];

  for (let i = 0; i < afterExclusion.length; i++) {
    const { title, url } = afterExclusion[i];

    if (!quiet) {
      process.stdout.write(
        `  [${i + 1}/${afterExclusion.length}]  ${title} … `,
      );
    }

    try {
      const details = await scrapeDetails(browser, url);
      const showTitle =
        titlePreference === "detail-first"
          ? details.title || title
          : title || details.title;

      // Download show image
      let imageUrl = details.imageUrl || null;
      let imageStatus = null;
      let localImagePath = null;
      if (imageUrl) {
        imageStatus = await downloadAndConvert(showTitle, imageUrl);
        if (imageStatus === "success" || imageStatus === "skipped") {
          localImagePath = `/${generateSlug(showTitle)}.webp`;
        }
      }

      // Disambiguate slug if it collides with an existing show from another theatre
      let slug = generateSlug(showTitle);
      if (slugMap && slugMap.has(slug) && slugMap.get(slug) !== theatreConst) {
        slug = `${slug}-${generateSlug(theatreConst)}`;
        if (!quiet) {
          console.log(`    ⚠️  Slug collision — using "${slug}"`);
        }
        // Copy the downloaded image to the disambiguated slug filename
        if (localImagePath) {
          const originalFile = path.join(
            rootDir,
            "public",
            "images",
            "shows",
            `${generateSlug(showTitle)}.webp`,
          );
          const disambiguatedFile = path.join(
            rootDir,
            "public",
            "images",
            "shows",
            `${slug}.webp`,
          );
          try {
            fs.copyFileSync(originalFile, disambiguatedFile);
            localImagePath = `/${slug}.webp`;
          } catch {
            // If copy fails, keep the original image path
          }
        }
      }

      results.push({
        title: showTitle,
        slug,
        theatre: theatreConst,
        durationMinutes: details.durationMinutes,
        rawDescription: details.description || null,
        description: details.description || null,
        summary: "",
        cast: details.cast || null,
        genre: [],
        url,
        imageUrl: localImagePath || imageUrl,
        imageStatus,
      });
      if (!quiet) console.log("✅");
    } catch (err) {
      let errSlug = generateSlug(title);
      if (
        slugMap &&
        slugMap.has(errSlug) &&
        slugMap.get(errSlug) !== theatreConst
      ) {
        errSlug = `${errSlug}-${generateSlug(theatreConst)}`;
      }
      results.push({
        title,
        slug: errSlug,
        theatre: theatreConst,
        durationMinutes: null,
        description: null,
        summary: "",
        cast: null,
        genre: [],
        url,
        imageUrl: null,
        imageStatus: null,
        error: err.message,
      });
      if (!quiet) console.log(`⚠️  ${err.message}`);
    }

    // Be polite — wait between requests (skip after last one)
    if (i < afterExclusion.length - 1) {
      await sleep(POLITE_DELAY);
    }
  }

  // ── Process descriptions (batch) ──────────────────────────────
  if (ai && results.some((r) => !r.error)) {
    if (!quiet) {
      process.stdout.write("\n  📝  Processing descriptions… ");
    }
    await processDescriptions(ai, results, { quiet });
    if (!quiet) {
      console.log("✅");
    }
  }

  // ── Classify genres ───────────────────────────────────────────
  if (ai && results.some((r) => !r.error)) {
    if (!quiet) {
      process.stdout.write("\n  🏷️  Classifying genres… ");
    }
    await classifyGenres(ai, results, { quiet });
    if (!quiet) {
      console.log("✅");
    }
  }

  // Clean up internal field before output
  for (const r of results) delete r.rawDescription;

  await browser.close();

  return { theatreId, theatreName, theatreConst, results };
}

// ── Main pipeline ───────────────────────────────────────────────

/**
 * Run the full scraping pipeline for a theatre.
 *
 * @param {object} config
 * @param {string} config.theatreId       — e.g. "cameri" | "habima"
 * @param {string} config.theatreName     — e.g. "תיאטרון הקאמרי"
 * @param {string} config.theatreConst    — DB theatre value (same as theatreName)
 * @param {Function} config.fetchListing  — (browser) => Promise<[{title,url}]>
 * @param {Function} config.scrapeDetails — (browser, url) => Promise<{title,durationMinutes,description,imageUrl}>
 * @param {"detail-first"|"listing-first"} config.titlePreference
 * @param {Function} config.launchBrowser — () => Promise<Browser>
 */
export async function runPipeline(config) {
  // Import here to avoid circular dependency at module level
  const { saveAndOpenHtml, startServer } = await import("./html-server.mjs");

  const {
    theatreId,
    theatreName,
    theatreConst,
    fetchListing,
    scrapeDetails,
    titlePreference,
    launchBrowser,
  } = config;

  dotenv.config({ path: path.join(rootDir, ".env.local") });

  const jsonMode = process.argv.includes("--json");
  const htmlMode = process.argv.includes("--html");

  try {
    // 0. Ensure local DB has all migrations applied
    if (process.env.DATABASE_URL) {
      try {
        console.log("🔄 Applying pending migrations…");
        execSync("npx prisma migrate deploy", {
          cwd: rootDir,
          stdio: "inherit",
        });
        console.log("");
      } catch {
        console.warn(
          "⚠️  prisma migrate deploy failed — continuing with current DB state.",
        );
        console.warn(
          "   If your local DB is out of sync, resolve manually with: npx prisma migrate resolve\n",
        );
      }
    }

    // 1. DB lookup
    const existingTitles = await fetchExistingTitles(theatreConst);
    const existingSlugs = await fetchAllExistingSlugs();
    const hasDb = existingTitles !== null;

    const aiClient = createAIClient();
    if (!aiClient) {
      console.warn("⚠️  GITHUB_TOKEN not set — AI summaries will be skipped\n");
    }
    if (!hasDb) {
      console.warn(
        "⚠️  DATABASE_URL not set — will scrape details for ALL shows\n",
      );
    }

    const excludedShows = loadExcludedShows();

    // 2–4c. Collect missing shows
    const collected = await collectMissingShows(config, {
      existingTitles,
      existingSlugs,
      aiClient,
      excludedShows,
      quiet: jsonMode,
    });

    if (!collected) {
      if (jsonMode) {
        console.log("[]");
      }
      process.exit(0);
    }

    const { results } = collected;

    // 5. Output results
    if (jsonMode) {
      console.log(JSON.stringify(results, null, 2));
    } else if (htmlMode) {
      saveAndOpenHtml(theatreName, theatreId, results);
    } else {
      // Default: start interactive server for editing + DB insertion
      const ok = results.filter((r) => !r.error).length;
      const errCount = results.filter((r) => r.error).length;
      console.log(
        `Done: ${ok} scraped successfully${errCount ? `, ${errCount} failed` : ""}.\n`,
      );

      await startServer(theatreName, theatreId, results);
    }
  } catch (err) {
    console.error("❌  Failed:", err.message);
    process.exit(1);
  }
}
