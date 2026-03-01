/**
 * Database helpers — Prisma client creation, show title lookups.
 *
 * Uses dynamic imports for pg / Prisma so scripts don't crash
 * if the dependencies are missing or DATABASE_URL is not set.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXCLUDED_FILE = path.join(__dirname, "..", "data", "excluded-shows.json");

/**
 * Normalise a title for comparison:
 * 1. Unify geresh / apostrophe variants (׳ U+05F3, ' U+2019, ʼ U+02BC) → ASCII '
 * 2. Trim + collapse whitespace.
 * @param {string} title
 * @returns {string}
 */
export function normalise(title) {
  return title
    .replace(/[\u05F3\u2019\u02BC]/g, "'")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Stricter normalisation for fuzzy title matching (e.g. cast backfill).
 * Extends `normalise` with niqqud stripping, ASCII quote unification,
 * and dash normalisation.
 * @param {string} s
 * @returns {string}
 */
export function normaliseForMatch(s) {
  return s
    .replace(/[\u05F3\u2019\u02BC']/g, "'")
    .replace(/[\u05B0-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]/g, "") // strip niqqud
    .replace(/[-–—]/g, "-") // normalise dashes
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Escape a string for use inside a single-quoted SQL literal.
 * @param {string} s
 * @returns {string}
 */
export function escapeSql(s) {
  return s.replace(/'/g, "''");
}

/**
 * Create a Prisma client backed by a pg Pool.
 * Returns `{ prisma, pool }` or `null` if DATABASE_URL is not set.
 *
 * @returns {Promise<{ prisma: import("@prisma/client").PrismaClient, pool: import("pg").Pool } | null>}
 */
export async function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;

  const { Pool } = await import("pg");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const { PrismaClient } = await import("@prisma/client");

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  return { prisma, pool };
}

/**
 * Fetch existing show titles for a given theatre from the database.
 * Returns a Set of normalised titles, or `null` if DB is unavailable.
 *
 * @param {string} theatre — theatre name to filter by (e.g. "תיאטרון הקאמרי")
 * @returns {Promise<Set<string> | null>}
 */
export async function fetchExistingTitles(theatre) {
  const db = await createPrismaClient();
  if (!db) return null;

  try {
    const shows = await db.prisma.show.findMany({
      where: { theatre },
      select: { title: true },
    });
    return new Set(shows.map((s) => normalise(s.title)));
  } finally {
    await db.prisma.$disconnect();
    await db.pool.end();
  }
}

/**
 * Fetch all existing slugs from the database (across all theatres).
 * Returns a Map of slug → theatre name, or `null` if DB is unavailable.
 *
 * @returns {Promise<Map<string, string> | null>}
 */
export async function fetchAllExistingSlugs() {
  const db = await createPrismaClient();
  if (!db) return null;

  try {
    const shows = await db.prisma.show.findMany({
      select: { slug: true, theatre: true },
    });
    const slugMap = new Map();
    for (const s of shows) {
      slugMap.set(s.slug, s.theatre);
    }
    return slugMap;
  } finally {
    await db.prisma.$disconnect();
    await db.pool.end();
  }
}

// ── Excluded shows persistence ──────────────────────────────────

/**
 * Build a composite key for exclusion lookups.
 * @param {string} title — raw title (will be normalised)
 * @param {string} theatre — theatre name
 * @returns {string}
 */
function exclusionKey(title, theatre) {
  return normalise(title) + "||" + theatre;
}

/**
 * Load the set of excluded shows from `scripts/data/excluded-shows.json`.
 * Returns a Set of composite keys (`normalisedTitle||theatre`).
 * Returns an empty Set if the file doesn't exist.
 *
 * @returns {Set<string>}
 */
export function loadExcludedShows() {
  try {
    const raw = fs.readFileSync(EXCLUDED_FILE, "utf-8");
    const entries = JSON.parse(raw);
    return new Set(entries.map((e) => exclusionKey(e.title, e.theatre)));
  } catch {
    return new Set();
  }
}

/**
 * Persist newly excluded shows to `scripts/data/excluded-shows.json`.
 * Merges with existing entries (deduplicates by composite key),
 * then writes back sorted alphabetically by theatre → title.
 *
 * @param {{ title: string, theatre: string }[]} newExclusions
 */
export function saveExcludedShows(newExclusions) {
  if (!newExclusions || newExclusions.length === 0) return;

  let existing = [];
  try {
    const raw = fs.readFileSync(EXCLUDED_FILE, "utf-8");
    existing = JSON.parse(raw);
  } catch {
    // file missing or corrupt — start fresh
  }

  const seen = new Set(existing.map((e) => exclusionKey(e.title, e.theatre)));
  const now = new Date().toISOString();

  for (const { title, theatre } of newExclusions) {
    const key = exclusionKey(title, theatre);
    if (!seen.has(key)) {
      seen.add(key);
      existing.push({ title: normalise(title), theatre, excludedAt: now });
    }
  }

  // Sort by theatre, then title
  existing.sort(
    (a, b) =>
      a.theatre.localeCompare(b.theatre, "he") ||
      a.title.localeCompare(b.title, "he"),
  );

  fs.writeFileSync(
    EXCLUDED_FILE,
    JSON.stringify(existing, null, 2) + "\n",
    "utf-8",
  );
}
