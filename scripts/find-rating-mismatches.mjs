#!/usr/bin/env node
/**
 * find-rating-mismatches.mjs — read-only audit of Show.avgRating / Show.reviewCount
 * vs. aggregates computed from the Review table.
 *
 * Usage:
 *   # local DB (uses .env.local / .env)
 *   node scripts/find-rating-mismatches.mjs
 *
 *   # production DB
 *   dotenv -e .env.production.local -- node scripts/find-rating-mismatches.mjs
 *   # or: DATABASE_URL="postgres://..." node scripts/find-rating-mismatches.mjs
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import { createPrismaClient } from "./lib/db.mjs";
import { red, green, cyan, bold } from "./lib/cli.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

// Load env unless DATABASE_URL is already set (e.g. via dotenv-cli)
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.join(rootDir, ".env.local") });
  if (!process.env.DATABASE_URL) {
    dotenv.config({ path: path.join(rootDir, ".env") });
  }
}

const EPSILON = 0.005; // tolerate sub-rounding differences

const db = await createPrismaClient();
if (!db) {
  console.error(red("DATABASE_URL not set."));
  process.exit(1);
}

const { prisma, pool } = db;

try {
  const rows = await prisma.$queryRaw`
    SELECT
      s.id,
      s.slug,
      s.title,
      s.theatre,
      s."reviewCount"                   AS stored_count,
      COALESCE(r.cnt, 0)::int           AS actual_count,
      s."avgRating"                     AS stored_avg,
      r.avg                             AS actual_avg
    FROM "Show" s
    LEFT JOIN (
      SELECT "showId", COUNT(*) AS cnt, AVG(rating)::float AS avg
      FROM "Review"
      GROUP BY "showId"
    ) r ON r."showId" = s.id
    ORDER BY s.theatre, s.title
  `;

  const mismatches = rows.filter((row) => {
    const countMismatch = (row.stored_count ?? 0) !== (row.actual_count ?? 0);
    const storedAvg = row.stored_avg;
    const actualAvg = row.actual_avg;
    let avgMismatch = false;
    if (actualAvg === null) {
      avgMismatch = storedAvg !== null;
    } else if (storedAvg === null) {
      avgMismatch = true;
    } else {
      avgMismatch = Math.abs(storedAvg - actualAvg) > EPSILON;
    }
    return countMismatch || avgMismatch;
  });

  console.log(bold(`\nScanned ${rows.length} shows.`));
  if (mismatches.length === 0) {
    console.log(green("✓ No mismatches found — Show table is consistent with Review aggregates."));
  } else {
    console.log(red(`✗ Found ${mismatches.length} show(s) with stale denormalized fields:\n`));
    for (const m of mismatches) {
      const fmt = (v) => (v === null || v === undefined ? "null" : typeof v === "number" ? v.toFixed(3) : String(v));
      console.log(
        `  ${cyan(m.slug)}  [${m.theatre}]  ${m.title}\n` +
          `    reviewCount: stored=${m.stored_count}  actual=${m.actual_count}\n` +
          `    avgRating:   stored=${fmt(m.stored_avg)}  actual=${fmt(m.actual_avg)}`,
      );
    }
  }
} finally {
  await prisma.$disconnect();
  await pool.end();
}
