#!/usr/bin/env node
/**
 * Backfill cast data for Beer Sheva Theatre (תיאטרון באר שבע) shows.
 *
 * Scrapes each show's detail page on b7t.co.il, extracts actor names
 * from the "משתתפים" section, and generates migration SQL.
 *
 * Usage:
 *   node scripts/backfill-beer-sheva-cast.mjs
 *
 * Outputs UPDATE statements to stdout. Redirect to a file if needed:
 *   node scripts/backfill-beer-sheva-cast.mjs > migration.sql
 */

import { launchBrowser, setupRequestInterception } from "./lib/browser.mjs";
import { createPrismaClient } from "./lib/db.mjs";
import { bold, cyan, green, red, yellow, dim, bidi } from "./lib/cli.mjs";
import {
  BEER_SHEVA_THEATRE,
  BEER_SHEVA_BASE,
  SHOWS_URL,
} from "./lib/beer-sheva.mjs";

function normaliseForMatch(s) {
  return s
    .replace(/[\u05F3\u2019\u02BC']/g, "'")
    .replace(/[\u05B0-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]/g, "") // strip niqqud
    .replace(/[-–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeSql(s) {
  return s.replace(/'/g, "''");
}

async function main() {
  // ── 1. Fetch Beer Sheva shows from DB ──
  const db = await createPrismaClient();
  if (!db) {
    console.error(red("DATABASE_URL not set — cannot query shows."));
    process.exit(1);
  }

  let dbShows;
  try {
    dbShows = await db.prisma.show.findMany({
      where: { theatre: BEER_SHEVA_THEATRE, cast: null },
      select: { slug: true, title: true },
      orderBy: { title: "asc" },
    });
  } finally {
    await db.prisma.$disconnect();
    await db.pool.end();
  }

  if (dbShows.length === 0) {
    console.log(green("All Beer Sheva shows already have cast data."));
    return;
  }

  console.error(
    cyan(`Found ${dbShows.length} Beer Sheva shows without cast data.\n`),
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
    const blocklist = ["סיור מאחורי הקלעים"];

    // Pattern A: direct link scraping from h2 headings
    document
      .querySelectorAll('h2.elementor-heading-title a[href*="/shows/"]')
      .forEach((a) => {
        let title = a.textContent.trim().replace(/\s+/g, " ");
        if (!title || title.length < 2) return;
        if (blocklist.some((b) => title.includes(b))) return;
        const href = a.getAttribute("href") || "";
        if (!href.includes("/shows/")) return;
        const url = href.startsWith("http") ? href : `${base}${href}`;
        if (!map.has(title)) map.set(title, url);
      });

    // Fallback: plain a[href*="/shows/"] with nearby heading
    const existingUrls = new Set([...map.values()]);
    document.querySelectorAll('a[href*="/shows/"]').forEach((a) => {
      const href = a.getAttribute("href") || "";
      if (!href.includes("/shows/")) return;
      const url = href.startsWith("http") ? href : `${base}${href}`;
      if (existingUrls.has(url)) return;

      let container = a.parentElement;
      let heading = null;
      for (let i = 0; i < 5 && container; i++) {
        heading =
          container.querySelector("h2.elementor-heading-title") ||
          container.querySelector("h2") ||
          container.querySelector("h3");
        if (heading) break;
        container = container.parentElement;
      }
      if (heading) {
        let title = heading.textContent.trim().replace(/\s+/g, " ");
        if (
          title &&
          title.length >= 2 &&
          !map.has(title) &&
          !blocklist.some((b) => title.includes(b))
        ) {
          map.set(title, url);
        }
      }
    });

    return [...map.entries()].map(([title, url]) => ({ title, url }));
  }, BEER_SHEVA_BASE);
  await listingPage.close();

  // Build title→URL map
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

      // Extract cast from the "משתתפים" section in body text
      const cast = await page.evaluate(() => {
        const body = document.body.innerText;
        const marker = "משתתפים";
        const idx = body.indexOf(marker);
        if (idx === -1) return "";

        let rest = body.slice(idx + marker.length).trim();

        // Stop at common section boundaries / footer content
        const stopMarkers = [
          "תוכניית ההצגה",
          "רכישת כרטיסים",
          "טריילר",
          "גלרייה",
          "מנוי לתיאטרון",
          "סיור מאחורי",
          "כל הזכויות",
          "הפרטיות שלכם",
          "Created by",
          "Powered by",
          "Facebook",
          "צור קשר",
          "הצהרת נגישות",
        ];
        let end = rest.length;
        for (const m of stopMarkers) {
          const i = rest.indexOf(m);
          if (i !== -1 && i < end) end = i;
        }
        rest = rest.slice(0, end).trim();

        // Collapse whitespace into single-line comma-separated names
        return rest
          .replace(/\n+/g, " ")
          .replace(/\s{2,}/g, " ")
          .trim();
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
      await new Promise((r) => setTimeout(r, 1500));
    }
  }

  await browser.close();

  // ── 5. Generate migration SQL ──
  const withCast = results.filter((r) => r.cast);
  if (withCast.length === 0) {
    console.error(red("\nNo cast data found for any show."));
    return;
  }

  console.error(dim("=".repeat(60)));
  console.error(bold(`Migration SQL (${withCast.length} shows)\n`));

  const lines = [
    "-- Backfill actors-only cast data for Beer Sheva Theatre (תיאטרון באר שבע) shows",
    "-- Cast extracted from individual show pages at b7t.co.il",
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
