#!/usr/bin/env node
/**
 * set-featured-show.mjs — update the homepage featured show.
 *
 * Looks up a show by slug or partial title in the database, then rewrites
 * FEATURED_SHOW_SLUG in src/constants/featuredShow.ts.
 *
 * Usage:
 *   node scripts/set-featured-show.mjs "איפה לורה"        # partial title match
 *   node scripts/set-featured-show.mjs --slug איפה-לורה   # exact slug
 *   node scripts/set-featured-show.mjs --none             # clear override (use top-rated)
 *
 * Deploy after running for the change to go live.
 */

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { createPrismaClient } from "./lib/db.mjs";
import { green, red, cyan, bold } from "./lib/cli.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");
const CONSTANT_FILE = path.join(rootDir, "src", "constants", "featuredShow.ts");

dotenv.config({ path: path.join(rootDir, ".env.local") });

// ── Parse CLI flags ─────────────────────────────────────────────

const args = process.argv.slice(2);

function fail(msg) {
  console.error(red(msg));
  process.exit(1);
}

/** Rewrite the FEATURED_SHOW_SLUG line in the constant file. */
function writeFeaturedSlug(value) {
  const source = fs.readFileSync(CONSTANT_FILE, "utf-8");
  const replacement =
    value === null
      ? "export const FEATURED_SHOW_SLUG: string | null = null;"
      : `export const FEATURED_SHOW_SLUG: string | null = ${JSON.stringify(value)};`;
  const pattern = /export const FEATURED_SHOW_SLUG: string \| null = .*;/;
  if (!pattern.test(source)) {
    fail("Could not find FEATURED_SHOW_SLUG declaration to replace.");
  }
  fs.writeFileSync(CONSTANT_FILE, source.replace(pattern, replacement), "utf-8");
}

if (args.includes("--none")) {
  writeFeaturedSlug(null);
  console.log(green("Featured show cleared — homepage will use the top-rated show."));
  process.exit(0);
}

const slugIdx = args.indexOf("--slug");
const isSlug = slugIdx !== -1;
const query = isSlug ? args[slugIdx + 1] : args[0];

if (!query) {
  fail(
    'Usage: node scripts/set-featured-show.mjs "<partial title>" | --slug <slug> | --none',
  );
}

const db = await createPrismaClient();
if (!db) fail("DATABASE_URL not set — cannot look up the show.");

try {
  const matches = await db.prisma.show.findMany({
    where: isSlug
      ? { slug: query }
      : { title: { contains: query, mode: "insensitive" } },
    select: { slug: true, title: true, theatre: true },
  });

  if (matches.length === 0) {
    fail(`No show found matching ${cyan(query)}.`);
  }
  if (matches.length > 1) {
    console.error(red(`Multiple shows match ${cyan(query)} — be more specific:`));
    for (const m of matches) {
      console.error(`  ${m.title}  (${m.slug})  — ${m.theatre}`);
    }
    process.exit(1);
  }

  const show = matches[0];
  writeFeaturedSlug(show.slug);
  console.log(
    green(`Featured show set to ${bold(show.title)} `) +
      cyan(`(${show.slug})`) +
      green(` — ${show.theatre}`),
  );
  console.log("Commit src/constants/featuredShow.ts and deploy to go live.");
} finally {
  await db.prisma.$disconnect();
  await db.pool.end();
}
