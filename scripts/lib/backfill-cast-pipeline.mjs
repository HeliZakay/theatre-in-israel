/**
 * Shared pipeline for backfilling cast data across all theatres.
 *
 * Handles the common workflow: query DB for shows missing cast,
 * fetch listing for title→URL mapping, match shows, scrape cast,
 * and generate migration SQL.
 */

import { createPrismaClient, normaliseForMatch, escapeSql } from "./db.mjs";
import {
  bold,
  cyan,
  green,
  red,
  yellow,
  dim,
  bidi,
  separator,
} from "./cli.mjs";

/**
 * Run the cast backfill pipeline for a single theatre.
 *
 * @param {object} config
 * @param {string} config.theatreName   — DB theatre name (e.g. "תיאטרון הקאמרי")
 * @param {string} config.theatreLabel  — Human-readable label for SQL comments
 * @param {string} config.websiteUrl    — Website domain for SQL comments
 * @param {function} config.fetchListing — (browser) => [{title, url}]
 * @param {function} config.scrapeCast  — (browser, url) => string | null
 * @param {function} config.launchBrowser — () => browser instance
 * @returns {Promise<{ withCast: Array, sql: string | null }>}
 */
export async function runCastBackfill({
  theatreName,
  theatreLabel,
  websiteUrl,
  fetchListing,
  scrapeCast,
  launchBrowser,
}) {
  // ── 1. Fetch shows without cast from DB ──
  const db = await createPrismaClient();
  if (!db) {
    console.error(red("DATABASE_URL not set — cannot query shows."));
    process.exit(1);
  }

  let dbShows;
  try {
    dbShows = await db.prisma.show.findMany({
      where: { theatre: theatreName, cast: null },
      select: { slug: true, title: true },
      orderBy: { title: "asc" },
    });
  } finally {
    await db.prisma.$disconnect();
    await db.pool.end();
  }

  if (dbShows.length === 0) {
    console.log(green(`All ${theatreLabel} shows already have cast data.`));
    return { withCast: [], sql: null };
  }

  console.error(
    cyan(`Found ${dbShows.length} ${theatreLabel} shows without cast data.\n`),
  );

  // ── 2. Scrape listing page for title→URL mapping ──
  const browser = await launchBrowser();
  const listings = await fetchListing(browser);

  console.error(dim(`Listing returned ${listings.length} shows.\n`));

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
    return { withCast: [], sql: null };
  }

  console.error(cyan(`Matched ${matched.length} shows. Scraping cast…\n`));

  // ── 4. Scrape cast from each detail page ──
  const results = [];
  for (const show of matched) {
    try {
      const cast = await scrapeCast(browser, show.url);

      results.push({ slug: show.slug, title: show.title, cast: cast || null });
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
    return { withCast: [], sql: null };
  }

  separator();
  console.error(bold(`Migration SQL (${withCast.length} shows)\n`));

  const lines = [
    `-- Backfill actors-only cast data for ${theatreLabel} shows`,
    `-- Cast extracted from individual show pages at ${websiteUrl}`,
    "-- Format: comma-separated actor names, / for alternates",
    `-- ${withCast.length} shows updated`,
    "",
  ];

  for (const { slug, cast } of withCast) {
    lines.push(
      `UPDATE "Show" SET "cast" = '${escapeSql(cast)}' WHERE "slug" = '${escapeSql(slug)}';`,
    );
  }

  const sql = lines.join("\n");
  return { withCast, sql };
}
