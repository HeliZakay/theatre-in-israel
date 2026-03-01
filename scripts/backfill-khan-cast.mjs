#!/usr/bin/env node
/**
 * Backfill cast data for Khan Theatre (תיאטרון החאן) shows.
 *
 * Scrapes each show's detail page on khan.co.il, extracts actor names
 * from the ensemble-actors links, and generates migration SQL.
 *
 * Usage:
 *   node scripts/backfill-khan-cast.mjs
 *
 * Outputs UPDATE statements to stdout. Redirect to a file if needed:
 *   node scripts/backfill-khan-cast.mjs > migration.sql
 */

import { launchBrowser, setupRequestInterception } from "./lib/browser.mjs";
import { createPrismaClient } from "./lib/db.mjs";
import {
  bold,
  cyan,
  green,
  red,
  yellow,
  dim,
  bidi,
  separator,
} from "./lib/cli.mjs";
import { KHAN_THEATRE, KHAN_BASE, SHOWS_URL } from "./lib/hakahn.mjs";

// ── Title prefixes to strip (same as hakahn.mjs) ──────────────

const TITLE_PREFIXES = [
  /^תיאטרון החאן מציג\s*[-–—]\s*/,
  /^תיאטרון החאן מארח\s*[-–—]\s*/,
];

function cleanTitle(title) {
  let cleaned = title;
  for (const re of TITLE_PREFIXES) cleaned = cleaned.replace(re, "");
  return cleaned.trim();
}

function normaliseForMatch(s) {
  return s
    .replace(/[\u05F3\u2019\u02BC']/g, "'")
    .replace(/[\u05B0-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]/g, "") // strip niqqud
    .replace(/\s+/g, " ")
    .trim();
}

function escapeSql(s) {
  return s.replace(/'/g, "''");
}

async function main() {
  // ── 1. Fetch Khan shows from DB ──
  const db = await createPrismaClient();
  if (!db) {
    console.error(red("DATABASE_URL not set — cannot query shows."));
    process.exit(1);
  }

  let dbShows;
  try {
    dbShows = await db.prisma.show.findMany({
      where: { theatre: KHAN_THEATRE, cast: null },
      select: { slug: true, title: true },
      orderBy: { title: "asc" },
    });
  } finally {
    await db.prisma.$disconnect();
    await db.pool.end();
  }

  if (dbShows.length === 0) {
    console.log(green("All Khan shows already have cast data."));
    return;
  }

  console.error(
    cyan(`Found ${dbShows.length} Khan shows without cast data.\n`),
  );

  // ── 2. Scrape listing page for title→URL mapping ──
  const browser = await launchBrowser();
  const listingPage = await browser.newPage();
  await setupRequestInterception(listingPage);
  await listingPage.goto(SHOWS_URL, {
    waitUntil: "networkidle2",
    timeout: 60_000,
  });
  await listingPage.waitForSelector('a[href*="/shows/"]', { timeout: 30_000 });

  const listings = await listingPage.evaluate((base) => {
    const map = new Map();
    document
      .querySelectorAll('.article-body h2 a[href*="/shows/"]')
      .forEach((a) => {
        const title = a.textContent.trim().replace(/\s+/g, " ");
        const href = a.getAttribute("href") || "";
        const url = href.startsWith("http") ? href : `${base}${href}`;
        if (title && !map.has(title)) map.set(title, url);
      });
    return [...map.entries()].map(([title, url]) => ({ title, url }));
  }, KHAN_BASE);
  await listingPage.close();

  // Clean titles
  const listingMap = new Map();
  for (const { title, url } of listings) {
    listingMap.set(normaliseForMatch(cleanTitle(title)), url);
  }

  // ── 3. Match DB shows to listing URLs ──
  const matched = [];
  const unmatched = [];
  for (const show of dbShows) {
    const key = normaliseForMatch(show.title);
    const url = listingMap.get(key);
    if (url) {
      matched.push({ ...show, url });
    } else {
      unmatched.push(show);
    }
  }

  if (unmatched.length > 0) {
    console.error(
      yellow(`Could not match ${unmatched.length} shows to listing URLs:`),
    );
    for (const s of unmatched)
      console.error(`  - ${bidi(s.title)} (${s.slug})`);
    console.error("");
  }

  // ── 4. Scrape cast from each detail page ──
  const results = [];
  for (const show of matched) {
    const page = await browser.newPage();
    await setupRequestInterception(page);
    try {
      await page.goto(show.url, {
        waitUntil: "networkidle2",
        timeout: 60_000,
      });
      await page.waitForSelector("h1", { timeout: 30_000 });

      // Try ensemble-actors links first
      let cast = await page.evaluate(() => {
        const links = [
          ...document.querySelectorAll('a[href*="/ensemble-actors/"]'),
        ];
        return links
          .map((a) => a.textContent.trim())
          .filter((n) => n.length > 0)
          .join(", ");
      });

      // Fallback: check for inline cast in description text
      if (!cast) {
        cast = await page.evaluate(() => {
          const body = document.body.innerText;
          // Some Khan shows list cast inline as "שחקנים: name, name, ..."
          // or "שחקנים יוצרים: name, name, ..."
          const castMatch = body.match(
            /שחקנים(?:\s+יוצרים)?:\s*([^\n]+(?:\n[^\n]+)?)/,
          );
          if (castMatch) {
            return castMatch[1]
              .replace(/משך ה(?:הצגה|מופע).*$/s, "")
              .replace(/\n/g, ", ")
              .replace(/\s{2,}/g, " ")
              .trim();
          }
          return "";
        });
      }

      results.push({ slug: show.slug, title: show.title, cast: cast || null });
      console.error(
        cast
          ? green(`  ✓ ${bidi(show.title)}: ${bidi(cast)}`)
          : yellow(`  ⚠ ${bidi(show.title)}: no cast found`),
      );
    } catch (err) {
      console.error(red(`  ✗ ${bidi(show.title)}: ${err.message}`));
      results.push({ slug: show.slug, title: show.title, cast: null });
    } finally {
      await page.close();
    }
  }

  await browser.close();

  // ── 5. Generate migration SQL ──
  const withCast = results.filter((r) => r.cast);
  if (withCast.length === 0) {
    console.error(red("\nNo cast data found for any show."));
    return;
  }

  separator();
  console.error(bold(`Migration SQL (${withCast.length} shows)\n`));

  const lines = [
    "-- Backfill actors-only cast data for Khan Theatre (תיאטרון החאן) shows",
    "-- Cast extracted from individual show pages at khan.co.il",
    "-- Format: comma-separated actor names, / for alternates",
    `-- ${withCast.length} shows updated`,
    "",
  ];

  for (const { slug, cast } of withCast) {
    lines.push(
      `UPDATE "Show" SET "cast" = '${escapeSql(cast)}' WHERE "slug" = '${escapeSql(slug)}';`,
    );
  }

  console.log(lines.join("\n"));
}

main().catch((err) => {
  console.error(red(err.message));
  process.exit(1);
});
