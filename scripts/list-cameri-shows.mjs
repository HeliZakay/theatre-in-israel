#!/usr/bin/env node
/**
 * list-cameri-shows.mjs
 *
 * Scrapes the Cameri Theatre "לוח הצגות מלא" page and prints
 * a deduplicated, alphabetically-sorted list of show titles that
 * are NOT yet in the database.
 *
 * If DATABASE_URL is not configured, falls back to listing all shows.
 *
 * Usage:
 *   node scripts/list-cameri-shows.mjs                # new titles only (default)
 *   node scripts/list-cameri-shows.mjs --json          # JSON array output
 *   node scripts/list-cameri-shows.mjs --all           # list all (skip DB filter)
 *   node scripts/list-cameri-shows.mjs --env=.env.production.local
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

// Load the env file specified via --env flag, or .env.local by default
const envFlag = process.argv.find((a) => a.startsWith("--env="));
const envFile = envFlag ? envFlag.split("=")[1] : ".env.local";
dotenv.config({ path: path.join(rootDir, envFile) });

const CAMERI_THEATRE = "תיאטרון הקאמרי";

const SCHEDULE_URL =
  "https://www.cameri.co.il/%D7%9C%D7%95%D7%97_%D7%94%D7%A6%D7%92%D7%95%D7%AA_%D7%9E%D7%9C%D7%90";

async function fetchShowTitles() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Block images / fonts / css to speed things up
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const type = req.resourceType();
    if (["image", "stylesheet", "font", "media"].includes(type)) {
      req.abort();
    } else {
      req.continue();
    }
  });

  await page.goto(SCHEDULE_URL, { waitUntil: "networkidle2", timeout: 30_000 });

  // Wait for at least one show link to appear (the page is JS-rendered)
  await page.waitForSelector('a[href*="show_"]', { timeout: 15_000 });

  // Extract titles from show links inside the page
  const titles = await page.evaluate(() => {
    const set = new Set();
    document.querySelectorAll('a[href*="/show_"]').forEach((a) => {
      let text = a.textContent.trim();
      if (!text) return;
      // Skip the "לפרטים ותאריכים נוספים" helper links
      if (text.includes("לפרטים ותאריכים")) return;
      // Strip leading "חדש" badge the site prepends to new shows
      text = text.replace(/^חדש\s+/, "");
      set.add(text);
    });
    return [...set];
  });

  await browser.close();

  // Sort alphabetically in Hebrew
  return titles.sort((a, b) => a.localeCompare(b, "he"));
}

/** Normalise a title for comparison: trim, collapse whitespace, lowercase */
function normalise(title) {
  return title.trim().replace(/\s+/g, " ");
}

/**
 * Fetch existing Cameri show titles from the database.
 * Returns a Set of normalised titles, or null if DB is unavailable.
 */
async function fetchExistingTitles() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;

  // Dynamic imports so the script doesn't crash if these deps are missing
  const { Pool } = await import("pg");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const { PrismaClient } = await import("@prisma/client");

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const shows = await prisma.show.findMany({
      where: { theatre: CAMERI_THEATRE },
      select: { title: true },
    });
    return new Set(shows.map((s) => normalise(s.title)));
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

// ── main ────────────────────────────────────────────────────────
const jsonMode = process.argv.includes("--json");
const showAll = process.argv.includes("--all");

try {
  const [scraped, existingSet] = await Promise.all([
    fetchShowTitles(),
    showAll ? Promise.resolve(null) : fetchExistingTitles(),
  ]);

  const hasDb = existingSet !== null;
  const titles = hasDb
    ? scraped.filter((t) => !existingSet.has(normalise(t)))
    : scraped;

  if (!hasDb && !showAll) {
    console.warn(
      "⚠️  DATABASE_URL not set — listing all scraped shows (use --all to silence this warning)\n",
    );
  }

  if (jsonMode) {
    console.log(JSON.stringify(titles, null, 2));
  } else {
    const label = hasDb
      ? `${titles.length} new shows at the Cameri not yet in DB`
      : `${titles.length} shows currently scheduled at the Cameri`;

    console.log(`\n🎭  ${label}:\n`);

    if (titles.length === 0) {
      console.log("  All scraped shows already exist in the database. ✅");
    } else {
      titles.forEach((t, i) =>
        console.log(`  ${String(i + 1).padStart(2)}.  ${t}`),
      );
    }
    console.log();

    if (hasDb) {
      console.log(
        `   (${scraped.length} total scraped · ${existingSet.size} already in DB)\n`,
      );
    }
  }
} catch (err) {
  console.error("❌  Failed to fetch Cameri schedule:", err.message);
  process.exit(1);
}
