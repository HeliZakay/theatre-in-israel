#!/usr/bin/env node
/**
 * Backfill cast data for Tzavta Theatre (תיאטרון צוותא) shows.
 *
 * Scrapes each show's detail page on tzavta.co.il, extracts actor names
 * from the show_content_insert div, and generates migration SQL.
 *
 * Usage:
 *   node scripts/backfill-tzavta-cast.mjs
 *
 * Outputs UPDATE statements to stdout. Redirect to a file if needed:
 *   node scripts/backfill-tzavta-cast.mjs > migration.sql
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
import {
  TZAVTA_THEATRE,
  TZAVTA_BASE,
  LISTING_URL,
  fetchShows,
} from "./lib/tzavta.mjs";

// ── Helpers ───────────────────────────────────────────────────

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
  // ── 1. Fetch Tzavta shows from DB ──
  const db = await createPrismaClient();
  if (!db) {
    console.error(red("DATABASE_URL not set — cannot query shows."));
    process.exit(1);
  }

  let dbShows;
  try {
    dbShows = await db.prisma.show.findMany({
      where: { theatre: TZAVTA_THEATRE, cast: null },
      select: { slug: true, title: true },
      orderBy: { title: "asc" },
    });
  } finally {
    await db.prisma.$disconnect();
    await db.pool.end();
  }

  if (dbShows.length === 0) {
    console.log(green("All Tzavta shows already have cast data."));
    return;
  }

  console.error(
    cyan(`Found ${dbShows.length} Tzavta shows without cast data.\n`),
  );

  // ── 2. Fetch listing page for title→URL mapping ──
  const browser = await launchBrowser();
  const listings = await fetchShows(browser);

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

      // Extract cast from show_content_insert
      let cast = await page.evaluate(() => {
        const contentDiv = document.querySelector(".show_content_insert");
        if (!contentDiv) return "";
        const text = contentDiv.innerText;

        // Cast markers, ordered by specificity
        const castMarkers = [
          "בכיכובם של:",
          "בכיכובם של",
          "בכיכוב:",
          "שחקנים/ות יוצרים/ות:",
          "שחקנים/ות:",
          "שחקנים יוצרים:",
          "שחקנים:",
          "בהשתתפות:",
          "יוצרים־מבצעים:",
          "יוצרים-מבצעים:",
          "משתתפים:",
        ];

        // Find earliest cast marker
        let castStart = -1;
        let markerLen = 0;
        for (const marker of castMarkers) {
          const idx = text.indexOf(marker);
          if (idx !== -1 && (castStart === -1 || idx < castStart)) {
            castStart = idx;
            markerLen = marker.length;
          }
        }
        if (castStart === -1) return "";

        let castText = text.slice(castStart + markerLen);

        // End-of-cast markers
        const endMarkers = [
          "מאת:",
          "מאת ",
          "בימוי:",
          "בימוי ",
          "לחנים:",
          "לחנים ",
          "עיבוד:",
          "עיבוד ",
          "תאורה:",
          "תפאורה:",
          "הלבשה:",
          "עיצוב ",
          "עיצוב:",
          "כוריאוגרפיה:",
          "סאונד:",
          "הפקה:",
          "להקה:",
          "ניהול מוסיקלי",
          "משך ה",
          "צילום:",
          "תרגום:",
          "נוסח עברי",
          "ע. במאי",
          "עוזר במאי",
          "עוזרת במאי",
          "כתיבה ",
          "הלחנה ",
          "ניהול ",
          "תנועה:",
          "עבודה קולית",
          "מערכונים ",
          "דרמטורג",
          "במאי:",
          "במאי ",
          "כותב:",
          "כותב ",
          "מילים:",
          "מילים ",
          "לחן:",
          "לחן ",
          "מוזיקה:",
          "מוזיקה ",
          "תלבושות:",
          "תלבושות ",
          "ליווי אמנותי",
          "ליווי אומנותי",
          "הביקורות",
          "זוכת פרס",
          "זוכה פרס",
        ];

        let endIdx = castText.length;
        for (const marker of endMarkers) {
          const idx = castText.indexOf(marker);
          if (idx !== -1 && idx < endIdx) endIdx = idx;
        }

        // Also stop at double-newline
        const dblNewline = castText.indexOf("\n\n");
        if (dblNewline !== -1 && dblNewline < endIdx) endIdx = dblNewline;

        castText = castText.slice(0, endIdx).trim();

        // Normalize newlines to ", "
        castText = castText.replace(/\n+/g, ", ");
        // Collapse multiple commas/spaces
        castText = castText.replace(/,\s*,/g, ",");
        castText = castText.replace(/\s{2,}/g, " ");
        castText = castText.trim();
        // Remove trailing comma
        castText = castText.replace(/,\s*$/, "").trim();
        // Remove trailing period or stray punctuation
        castText = castText.replace(/[.\s]+$/, "").trim();

        return castText;
      });

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
    "-- Backfill actors-only cast data for Tzavta Theatre (תיאטרון צוותא) shows",
    "-- Cast extracted from individual show pages at tzavta.co.il",
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
