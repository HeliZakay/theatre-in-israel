/**
 * Database helpers — Prisma client creation, show title lookups.
 *
 * Uses dynamic imports for pg / Prisma so scripts don't crash
 * if the dependencies are missing or DATABASE_URL is not set.
 */

/**
 * Normalise a title for comparison: trim + collapse whitespace.
 * @param {string} title
 * @returns {string}
 */
export function normalise(title) {
  return title.trim().replace(/\s+/g, " ");
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
