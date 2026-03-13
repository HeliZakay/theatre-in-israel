#!/usr/bin/env node
/**
 * scrape-all-events.mjs
 *
 * Orchestrator that runs all theatre scrapers in parallel with controlled
 * concurrency. Each scraper is spawned as a child process so a crash in
 * one cannot affect the others.
 *
 * Usage:
 *   node scripts/scrape-all-events.mjs                  # default concurrency (4)
 *   node scripts/scrape-all-events.mjs --concurrency 2  # limit to 2 at a time
 */

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

// ── Scraper definitions ─────────────────────────────────────────
const SCRAPERS = [
  { label: "Cameri",          script: "scrape-all-cameri-events.mjs",              json: "prisma/data/events.json" },
  { label: "Lessin",          script: "scrape-all-lessin-events.mjs",              json: "prisma/data/events-lessin.json" },
  { label: "Hebrew Theatre",  script: "scrape-all-hebrew-theatre-events.mjs",      json: "prisma/data/events-hebrew-theatre.json" },
  { label: "Khan",            script: "scrape-all-khan-events.mjs",                json: "prisma/data/events-khan.json" },
  { label: "Gesher",          script: "scrape-all-gesher-events.mjs",              json: "prisma/data/events-gesher.json" },
  { label: "Haifa Theatre",   script: "scrape-all-haifa-theatre-events.mjs",       json: "prisma/data/events-haifa-theatre.json" },
  { label: "Tmuna",           script: "scrape-all-tmuna-theatre-events.mjs",       json: "prisma/data/events-tmuna-theatre.json" },
  { label: "Beer Sheva",      script: "scrape-all-beer-sheva-theatre-events.mjs",  json: "prisma/data/events-beer-sheva-theatre.json" },
  { label: "Tzavta",          script: "scrape-all-tzavta-theatre-events.mjs",      json: "prisma/data/events-tzavta-theatre.json" },
  { label: "Habima",          script: "scrape-all-habima-theatre-events.mjs",       json: "prisma/data/events-habima-theatre.json" },
  // Venue scrapers
  { label: "Nes Ziona",       script: "scrape-all-nes-ziona-events.mjs",            json: "prisma/data/events-nes-ziona.json" },
  { label: "Ashdod",          script: "scrape-all-ashdod-events.mjs",              json: "prisma/data/events-ashdod.json" },
  { label: "Beer Sheva Venue", script: "scrape-all-beer-sheva-venue-events.mjs",  json: "prisma/data/events-beer-sheva-venue.json" },
  { label: "Rishon LeZion",   script: "scrape-all-rishon-lezion-events.mjs",    json: "prisma/data/events-rishon-lezion.json" },
  { label: "Petah Tikva",    script: "scrape-all-petah-tikva-events.mjs",     json: "prisma/data/events-petah-tikva.json" },
  { label: "Or Akiva",       script: "scrape-all-or-akiva-events.mjs",       json: "prisma/data/events-or-akiva.json" },
  { label: "Theatron HaZafon", script: "scrape-all-theatron-hazafon-events.mjs", json: "prisma/data/events-theatron-hazafon.json" },
  { label: "Kfar Saba",       script: "scrape-all-kfar-saba-events.mjs",       json: "prisma/data/events-kfar-saba.json" },
  { label: "Airport City",   script: "scrape-all-airport-city-events.mjs",   json: "prisma/data/events-airport-city.json" },
  { label: "Ashkelon",      script: "scrape-all-ashkelon-events.mjs",      json: "prisma/data/events-ashkelon.json" },
  { label: "Holon",         script: "scrape-all-holon-events.mjs",         json: "prisma/data/events-holon.json" },
  { label: "Kiryat Motzkin", script: "scrape-all-kiryat-motzkin-events.mjs", json: "prisma/data/events-kiryat-motzkin.json" },
  { label: "Rehovot",        script: "scrape-all-rehovot-events.mjs",       json: "prisma/data/events-rehovot.json" },
];

// ── CLI args ────────────────────────────────────────────────────
const args = process.argv.slice(2);
const concurrencyIdx = args.indexOf("--concurrency");
const concurrency = concurrencyIdx !== -1 ? parseInt(args[concurrencyIdx + 1], 10) : 4;

// ── Run a single scraper as a child process ─────────────────────
function runScraper({ label, script, json }) {
  return new Promise((resolve) => {
    const scriptPath = path.join(__dirname, script);
    const child = spawn("node", [scriptPath, "--json", path.join(rootDir, json)], {
      cwd: rootDir,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));

    const start = Date.now();
    child.on("close", (code) => {
      resolve({
        label,
        code,
        duration: ((Date.now() - start) / 1000).toFixed(1),
        stdout: Buffer.concat(stdout).toString(),
        stderr: Buffer.concat(stderr).toString(),
      });
    });
  });
}

// ── Concurrency-limited pool ────────────────────────────────────
async function runAll(tasks, limit) {
  const results = [];
  const queue = [...tasks];

  async function worker() {
    while (queue.length > 0) {
      const task = queue.shift();
      const result = await runScraper(task);

      // Print output immediately when each scraper finishes
      console.log(`\n[${ result.label }] ${result.code === 0 ? "OK" : "FAILED"} (${result.duration}s)`);
      if (result.stdout) process.stdout.write(result.stdout);
      if (result.stderr) process.stderr.write(result.stderr);

      results.push(result);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, () => worker()));
  return results;
}

// ── Main ────────────────────────────────────────────────────────
console.log(`Scraping ${SCRAPERS.length} theatres (concurrency: ${concurrency})\n`);
const start = Date.now();

const results = await runAll(SCRAPERS, concurrency);

const totalDuration = ((Date.now() - start) / 1000).toFixed(1);
const succeeded = results.filter((r) => r.code === 0);
const failed = results.filter((r) => r.code !== 0);

console.log(`\n${"─".repeat(60)}`);
console.log(`Done in ${totalDuration}s — ${succeeded.length} succeeded, ${failed.length} failed`);
if (failed.length > 0) {
  console.log(`Failed: ${failed.map((r) => r.label).join(", ")}`);
}
console.log("─".repeat(60));

// Exit 0 so the commit + email steps always run.
// Failed scrapers are visible in the output above.
