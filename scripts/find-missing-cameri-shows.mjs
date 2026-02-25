#!/usr/bin/env node
/**
 * find-missing-cameri-shows.mjs
 *
 * Combines list-cameri-shows.mjs & get-cameri-show.mjs to:
 *   1. Scrape the Cameri Theatre schedule page for all show titles + URLs
 *   2. Filter out shows already in the database
 *   3. Scrape each missing show's detail page for title, duration & description
 *   4. Output the extracted details
 *
 * Usage:
 *   node scripts/find-missing-cameri-shows.mjs                # missing shows only
 *   node scripts/find-missing-cameri-shows.mjs --json          # JSON output
 *   node scripts/find-missing-cameri-shows.mjs --all           # scrape all (skip DB filter)
 *   node scripts/find-missing-cameri-shows.mjs --env=.env.production.local
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

// ── CLI flags ───────────────────────────────────────────────────
const envFlag = process.argv.find((a) => a.startsWith("--env="));
const envFile = envFlag ? envFlag.split("=")[1] : ".env.local";
dotenv.config({ path: path.join(rootDir, envFile) });

const jsonMode = process.argv.includes("--json");
const showAll = process.argv.includes("--all");

const CAMERI_THEATRE = "תיאטרון הקאמרי";
const CAMERI_BASE = "https://www.cameri.co.il";
const SCHEDULE_URL =
  "https://www.cameri.co.il/%D7%9C%D7%95%D7%97_%D7%94%D7%A6%D7%92%D7%95%D7%AA_%D7%9E%D7%9C%D7%90";

// Small delay between scraping individual show pages (ms)
const POLITE_DELAY = 1500;

// ── helpers ─────────────────────────────────────────────────────

/** Normalise a title for comparison: trim + collapse whitespace */
function normalise(title) {
  return title.trim().replace(/\s+/g, " ");
}

function generateSlug(title) {
  return title
    .trim()
    .replace(/\s+/g, "-")
    .replace(/'/g, "\u05F3")
    .replace(/[?#%|\\/:*"<>]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── schedule page scraper ───────────────────────────────────────

/**
 * Scrape the Cameri schedule page.
 * Returns an array of { title, url } with deduplicated titles,
 * sorted alphabetically in Hebrew.
 */
async function fetchShowList(browser) {
  const page = await browser.newPage();

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
  await page.waitForSelector('a[href*="show_"]', { timeout: 15_000 });

  const shows = await page.evaluate((base) => {
    const map = new Map(); // title → url (dedup by title)
    document.querySelectorAll('a[href*="/show_"]').forEach((a) => {
      let text = a.textContent.trim();
      if (!text) return;
      if (text.includes("לפרטים ותאריכים")) return;
      text = text.replace(/^חדש\s+/, "");

      if (!map.has(text)) {
        // Build absolute URL
        const href = a.getAttribute("href") || "";
        const url = href.startsWith("http") ? href : `${base}${href}`;
        map.set(text, url);
      }
    });
    return [...map.entries()].map(([title, url]) => ({ title, url }));
  }, CAMERI_BASE);

  await page.close();

  // Sort alphabetically in Hebrew
  return shows.sort((a, b) => a.title.localeCompare(b.title, "he"));
}

// ── detail page scraper ─────────────────────────────────────────

/**
 * Scrape a single Cameri show detail page.
 * Returns { title, durationMinutes, description }.
 */
async function scrapeShowDetails(browser, url) {
  const page = await browser.newPage();

  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const type = req.resourceType();
    if (["image", "stylesheet", "font", "media"].includes(type)) {
      req.abort();
    } else {
      req.continue();
    }
  });

  await page.goto(url, { waitUntil: "networkidle2", timeout: 30_000 });
  await page.waitForSelector("h1", { timeout: 15_000 });

  const data = await page.evaluate(() => {
    // ── Title ──
    const h1 = document.querySelector("h1");
    let title = h1 ? h1.textContent.trim() : "";
    title = title.replace(/^חדש\s+/, "");

    // ── Duration ──
    let durationMinutes = null;
    const body = document.body.innerText;
    const durationMatch = body.match(/משך ההצגה:\s*(\d+)\s*דקות/);
    if (durationMatch) {
      durationMinutes = parseInt(durationMatch[1], 10);
    }

    // ── Description ──
    let description = "";
    const aboutMarker = "על ההצגה";
    const stopMarkers = ["צוות ושחקנים", "משך ההצגה", "גלריית תמונות"];
    const aboutIdx = body.indexOf(aboutMarker);
    if (aboutIdx !== -1) {
      let rest = body.slice(aboutIdx + aboutMarker.length).trim();
      let endIdx = rest.length;
      for (const marker of stopMarkers) {
        const idx = rest.indexOf(marker);
        if (idx !== -1 && idx < endIdx) endIdx = idx;
      }
      description = rest
        .slice(0, endIdx)
        .trim()
        .replace(/\n{3,}/g, "\n\n")
        .replace(/\*צילום:.*$/gm, "")
        .replace(/^\*[^\n]*$/gm, "")
        .replace(/תכניה/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    }

    return { title, durationMinutes, description };
  });

  await page.close();
  return data;
}

// ── DB lookup ───────────────────────────────────────────────────

/**
 * Fetch existing Cameri show titles from the database.
 * Returns a Set of normalised titles, or null if DB is unavailable.
 */
async function fetchExistingTitles() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;

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

try {
  // 1. DB lookup (in parallel with nothing — starts early)
  const existingSet = showAll ? null : await fetchExistingTitles();
  const hasDb = existingSet !== null;

  if (!hasDb && !showAll) {
    console.warn(
      "⚠️  DATABASE_URL not set — will scrape details for ALL shows (use --all to silence this warning)\n",
    );
  }

  // 2. Scrape schedule page
  const browser = await puppeteer.launch({ headless: true });

  let allShows;
  try {
    allShows = await fetchShowList(browser);
  } catch (err) {
    await browser.close();
    throw err;
  }

  // 3. Filter to missing shows only
  const missingShows = hasDb
    ? allShows.filter((s) => !existingSet.has(normalise(s.title)))
    : allShows;

  if (missingShows.length === 0) {
    if (!jsonMode) {
      console.log("\n🎭  All Cameri shows are already in the database. ✅\n");
      console.log(
        `   (${allShows.length} scraped · ${existingSet?.size ?? 0} in DB)\n`,
      );
    } else {
      console.log("[]");
    }
    await browser.close();
    process.exit(0);
  }

  if (!jsonMode) {
    const label = hasDb
      ? `Found ${missingShows.length} missing show(s) (out of ${allShows.length} scraped, ${existingSet.size} in DB)`
      : `Scraping details for ${missingShows.length} show(s)`;
    console.log(`\n🎭  ${label}\n`);
    console.log("   Fetching details for each show…\n");
  }

  // 4. Scrape each missing show's detail page
  const results = [];

  for (let i = 0; i < missingShows.length; i++) {
    const { title, url } = missingShows[i];

    if (!jsonMode) {
      process.stdout.write(`  [${i + 1}/${missingShows.length}]  ${title} … `);
    }

    try {
      const details = await scrapeShowDetails(browser, url);
      results.push({
        title: details.title || title,
        slug: generateSlug(details.title || title),
        theatre: CAMERI_THEATRE,
        durationMinutes: details.durationMinutes,
        description: details.description || null,
        url,
      });
      if (!jsonMode) console.log("✅");
    } catch (err) {
      results.push({
        title,
        slug: generateSlug(title),
        theatre: CAMERI_THEATRE,
        durationMinutes: null,
        description: null,
        url,
        error: err.message,
      });
      if (!jsonMode) console.log(`⚠️  ${err.message}`);
    }

    // Be polite — wait between requests (skip after last one)
    if (i < missingShows.length - 1) {
      await sleep(POLITE_DELAY);
    }
  }

  await browser.close();

  // 5. Output results
  if (jsonMode) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log("\n" + "─".repeat(60));
    console.log(`\n📋  Details for ${results.length} missing show(s):\n`);

    for (const show of results) {
      console.log(`  🎭  ${show.title}`);
      console.log(`      slug:     ${show.slug}`);
      console.log(`      תיאטרון: ${show.theatre}`);
      console.log(
        `      משך:     ${show.durationMinutes ? `${show.durationMinutes} דקות` : "לא צוין"}`,
      );
      if (show.error) {
        console.log(`      ⚠️  שגיאה: ${show.error}`);
      } else if (show.description) {
        console.log(`      תיאור:`);
        const lines = show.description.split("\n");
        for (const line of lines) {
          console.log(`        ${line}`);
        }
      }
      console.log(`      URL: ${show.url}`);
      console.log();
    }

    const ok = results.filter((r) => !r.error).length;
    const failed = results.filter((r) => r.error).length;
    console.log(
      `Done: ${ok} scraped successfully${failed ? `, ${failed} failed` : ""}.\n`,
    );
  }
} catch (err) {
  console.error("❌  Failed:", err.message);
  process.exit(1);
}
