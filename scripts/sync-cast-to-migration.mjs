#!/usr/bin/env node
/**
 * sync-cast-to-migration.mjs — generates a Prisma migration that sets
 * the `cast` column for every show to match the current local DB state.
 *
 * This ensures production cast data becomes identical to local after deploy.
 *
 * Usage:
 *   node scripts/sync-cast-to-migration.mjs
 */

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createPrismaClient } from "./lib/db.mjs";

dotenv.config({ path: ".env.local", override: true });
dotenv.config({ path: ".env" });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

function escapeSql(s) {
  if (s == null) return "NULL";
  return "'" + String(s).replace(/'/g, "''") + "'";
}

async function main() {
  const db = await createPrismaClient();
  if (!db) {
    console.error("❌ DATABASE_URL not set. Cannot connect to local DB.");
    process.exit(1);
  }
  const { prisma, pool } = db;

  try {
    const shows = await prisma.show.findMany({
      select: { slug: true, cast: true },
      orderBy: { slug: "asc" },
    });

    const withCast = shows.filter((s) => s.cast != null);
    const withoutCast = shows.filter((s) => s.cast == null);

    console.log(`Total shows: ${shows.length}`);
    console.log(`  With cast: ${withCast.length}`);
    console.log(`  Without cast (NULL): ${withoutCast.length}`);

    if (withCast.length === 0) {
      console.log(
        "\n⚠️  No shows with cast data found in local DB. Nothing to sync.",
      );
      return;
    }

    // Build migration SQL
    const sqlLines = [
      "-- Sync cast data from local DB to production",
      "-- This migration sets cast for every show to match the local DB state.",
      `-- Generated on ${new Date().toISOString()}`,
      `-- Shows with cast: ${withCast.length}, Shows with NULL cast: ${withoutCast.length}`,
      "",
    ];

    // UPDATE every show that has cast data
    for (const show of withCast) {
      sqlLines.push(
        `UPDATE "Show" SET "cast" = ${escapeSql(show.cast)} WHERE "slug" = ${escapeSql(show.slug)};`,
      );
    }

    // Also NULL out shows that should have no cast (ensures prod matches local exactly)
    if (withoutCast.length > 0) {
      sqlLines.push("");
      sqlLines.push("-- Nullify cast for shows that have no cast in local DB");
      for (const show of withoutCast) {
        sqlLines.push(
          `UPDATE "Show" SET "cast" = NULL WHERE "slug" = ${escapeSql(show.slug)};`,
        );
      }
    }

    const sqlContent = sqlLines.join("\n") + "\n";

    // Write migration file
    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:]/g, "")
      .slice(0, 14);
    const migrationName = `${timestamp}_sync_cast_data`;
    const migrationDir = path.join(
      rootDir,
      "prisma",
      "migrations",
      migrationName,
    );
    fs.mkdirSync(migrationDir, { recursive: true });

    const sqlPath = path.join(migrationDir, "migration.sql");
    fs.writeFileSync(sqlPath, sqlContent, "utf-8");

    const relPath = path.relative(rootDir, sqlPath);
    console.log(`\n✅ Migration written to: ${relPath}`);
    console.log(
      `   ${withCast.length} shows with cast + ${withoutCast.length} NULLed.`,
    );
    console.log(`\n   Next steps:`);
    console.log(`   1. Review the SQL: cat ${relPath}`);
    console.log(
      `   2. Commit and push — Vercel will apply the migration on deploy.`,
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
