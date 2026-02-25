#!/usr/bin/env node
/**
 * download-missing-images.mjs
 *
 * Downloads show poster images from various theatre websites,
 * converts them to .webp, and saves them to public/.
 *
 * Show data is loaded from scripts/data/show-images.json.
 * Two phases:
 *   1. Direct URL downloads
 *   2. Puppeteer-based extraction for shows without known URLs
 *
 * Usage:
 *   node scripts/download-missing-images.mjs
 */

import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";
import { downloadAndConvert, extractAndDownloadImage } from "./lib/image.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Load show data from JSON ────────────────────────────────────
const dataPath = path.join(__dirname, "data", "show-images.json");
const { showsWithUrls, showsNeedingPuppeteer } = JSON.parse(
  readFileSync(dataPath, "utf-8"),
);

// ── Main ────────────────────────────────────────────────────────

async function main() {
  const stats = { success: 0, failed: 0, skipped: 0 };

  // Phase 1: Direct downloads (no Puppeteer needed)
  console.log(
    `\n═══ Phase 1: Direct downloads (${showsWithUrls.length} shows) ═══\n`,
  );

  // Process 4 at a time to avoid overwhelming servers
  for (let i = 0; i < showsWithUrls.length; i += 4) {
    const batch = showsWithUrls.slice(i, i + 4);
    const results = await Promise.all(
      batch.map((show) =>
        downloadAndConvert(show.title, show.url, { verbose: true }),
      ),
    );
    results.forEach((result) => stats[result]++);
  }

  // Phase 2: Puppeteer-based extraction
  console.log(
    `\n═══ Phase 2: Puppeteer extraction (${showsNeedingPuppeteer.length} shows) ═══\n`,
  );

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    for (const show of showsNeedingPuppeteer) {
      const result = await extractAndDownloadImage(
        browser,
        show.title,
        show.pageUrl,
        { verbose: true },
      );
      stats[result]++;
    }
  } catch (err) {
    console.error(`\n❌ Puppeteer launch error: ${err.message}`);
    console.log("   Skipping Puppeteer shows...");
    stats.failed += showsNeedingPuppeteer.length;
  } finally {
    if (browser) await browser.close();
  }

  // Summary
  const total = showsWithUrls.length + showsNeedingPuppeteer.length;
  console.log(`\n═══ Summary ═══`);
  console.log(`Total: ${total} shows`);
  console.log(`✅ Downloaded: ${stats.success}`);
  console.log(`⏭️  Skipped (already exists): ${stats.skipped}`);
  console.log(`❌ Failed: ${stats.failed}`);
}

main();
