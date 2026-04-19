#!/usr/bin/env node
/**
 * Find anonymous reviews from today, grouped by IP address.
 *
 * Usage:
 *   node scripts/find-anon-reviews-by-ip.mjs
 *   node scripts/find-anon-reviews-by-ip.mjs --date 2026-04-19
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createPrismaClient } from "./lib/db.mjs";
import { bold, green, yellow, cyan, dim, bidi, separator, thinSeparator, printField } from "./lib/cli.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.join(rootDir, ".env.local") });
  if (!process.env.DATABASE_URL) {
    dotenv.config({ path: path.join(rootDir, ".env") });
  }
}

function getArg(flag) {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 && idx + 1 < process.argv.length ? process.argv[idx + 1] : null;
}

const dateArg = getArg("--date") || new Date().toISOString().slice(0, 10);

async function main() {
  const db = await createPrismaClient();
  if (!db) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  const { prisma, pool } = db;

  try {
    const dayStart = new Date(`${dateArg}T00:00:00.000Z`);
    const dayEnd = new Date(`${dateArg}T23:59:59.999Z`);

    separator();
    console.log(bold(`Anonymous reviews on ${dateArg}, grouped by IP`));
    separator();

    const reviews = await prisma.review.findMany({
      where: {
        userId: null,
        createdAt: { gte: dayStart, lte: dayEnd },
      },
      include: {
        show: { select: { title: true, slug: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    if (reviews.length === 0) {
      console.log(yellow("\nNo anonymous reviews found for this date.\n"));
      return;
    }

    const byIp = new Map();
    for (const r of reviews) {
      const ip = r.ip || "unknown";
      if (!byIp.has(ip)) byIp.set(ip, []);
      byIp.get(ip).push(r);
    }

    const sortedIps = [...byIp.entries()].sort((a, b) => b[1].length - a[1].length);

    for (const [ip, group] of sortedIps) {
      console.log();
      console.log(cyan(bold(`IP: ${ip}  (${group.length} review${group.length > 1 ? "s" : ""})`)));
      thinSeparator();
      for (const r of group) {
        const time = r.createdAt.toISOString().slice(11, 16);
        console.log(
          `  ${dim(`#${r.id}`)}  ${dim("★")}${r.rating}  ${dim(time)}  ${bidi(r.author)}  ${bidi(r.show.title)}`
        );
      }
    }

    console.log();
    separator();
    console.log(`Total: ${bold(reviews.length)} anonymous review${reviews.length > 1 ? "s" : ""} from ${bold(byIp.size)} IP${byIp.size > 1 ? "s" : ""}`);
    separator();
    console.log();
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
