#!/usr/bin/env node
/**
 * Backfill cast data for Beit Lessin Theatre (תיאטרון בית ליסין) shows.
 *
 * Scrapes each show's detail page on lessin.co.il, extracts actor names
 * from the "יוצרים ושחקנים" section, and generates migration SQL.
 *
 * Usage:
 *   node scripts/backfill-lessin-cast.mjs
 *
 * Outputs UPDATE statements to stdout. Redirect to a file if needed:
 *   node scripts/backfill-lessin-cast.mjs > migration.sql
 */

import { launchBrowser } from "./lib/browser.mjs";
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
import {
  LESSIN_THEATRE,
  fetchShows,
  scrapeShowDetails,
} from "./lib/lessin.mjs";

// ── Helpers ────────────────────────────────────────────────────

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

// ── Main ───────────────────────────────────────────────────────

async function main() {
  // ── 1. Fetch Lessin shows without cast from DB ──
  const db = await createPrismaClient();
  if (!db) {
    console.error(red("DATABASE_URL not set — cannot query shows."));
    process.exit(1);
  }

  let dbShows;
  try {
    dbShows = await db.prisma.show.findMany({
      where: { theatre: LESSIN_THEATRE, cast: null },
      select: { slug: true, title: true },
      orderBy: { title: "asc" },
    });
  } finally {
    await db.prisma.$disconnect();
    await db.pool.end();
  }

  if (dbShows.length === 0) {
    console.log(green("All Beit Lessin shows already have cast data."));
    return;
  }

  console.error(
    cyan(`Found ${dbShows.length} Beit Lessin shows without cast data.\n`),
  );

  // ── 2. Scrape listing page for title→URL mapping ──
  const browser = await launchBrowser();
  const listings = await fetchShows(browser);

  console.error(dim(`Listing page returned ${listings.length} shows.\n`));

  // Build normalised title → URL map
  const listingMap = new Map();
  for (const { title, url } of listings) {
    listingMap.set(normaliseForMatch(title), url);
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

  if (matched.length === 0) {
    console.error(red("No shows matched — nothing to scrape."));
    await browser.close();
    return;
  }

  console.error(cyan(`Matched ${matched.length} shows. Scraping cast…\n`));

  // ── 4. Scrape cast from each detail page ──
  const results = [];
  for (const show of matched) {
    try {
      const details = await scrapeShowDetails(browser, show.url);
      const cast = details.cast || null;

      results.push({ slug: show.slug, title: show.title, cast });
      console.error(
        cast
          ? green(`  ✓ ${bidi(show.title)}: ${bidi(cast)}`)
          : yellow(`  ⚠ ${bidi(show.title)}: no cast found`),
      );
    } catch (err) {
      console.error(red(`  ✗ ${bidi(show.title)}: ${err.message}`));
      results.push({ slug: show.slug, title: show.title, cast: null });
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
    "-- Backfill actors-only cast data for Beit Lessin Theatre (תיאטרון בית ליסין) shows",
    "-- Cast extracted from individual show pages at lessin.co.il",
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
