#!/usr/bin/env node
/**
 * Exports the Review table to a JSON file with show slugs and user emails.
 * Used by the nightly backup workflow as a human-readable snapshot of the
 * most precious data, alongside the full pg_dump.
 *
 * Usage: node scripts/export-reviews.mjs <output-path>
 */

import { writeFileSync } from "node:fs";
import { createPrismaClient } from "./lib/db.mjs";

const outPath = process.argv[2];
if (!outPath) {
  console.error("Usage: node scripts/export-reviews.mjs <output-path>");
  process.exit(1);
}

const db = await createPrismaClient();
if (!db) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

try {
  const reviews = await db.prisma.review.findMany({
    include: {
      show: { select: { slug: true, title: true } },
      user: { select: { email: true } },
    },
    orderBy: { id: "asc" },
  });

  const payload = {
    exportedAt: new Date().toISOString(),
    count: reviews.length,
    reviews,
  };

  writeFileSync(outPath, JSON.stringify(payload, null, 2));
  console.log(`Exported ${reviews.length} reviews -> ${outPath}`);
} finally {
  await db.prisma.$disconnect();
  await db.pool.end();
}
