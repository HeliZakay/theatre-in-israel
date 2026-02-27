/**
 * Warm up the Neon serverless database before running migrations.
 * Neon suspends idle compute endpoints; the first connection can take
 * several seconds to wake up. Running a simple query here ensures the
 * database is responsive before `prisma migrate deploy` tries to
 * acquire an advisory lock (which has a 10 s timeout).
 *
 * Uses the same URL resolution logic as prisma.config.ts so we warm
 * the exact endpoint Prisma will connect to (direct, not pooler).
 */
const { Pool } = require("pg");

function deriveDirectUrlFromPooler(url) {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("-pooler.")) return undefined;
    parsed.hostname = parsed.hostname.replace("-pooler.", ".");
    return parsed.toString();
  } catch {
    return undefined;
  }
}

const databaseUrl = process.env.DATABASE_URL;
const directDatabaseUrl =
  process.env.DIRECT_DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING;
const derivedDirectDatabaseUrl = deriveDirectUrlFromPooler(databaseUrl);

// Same priority as prisma.config.ts
const url = directDatabaseUrl || derivedDirectDatabaseUrl || databaseUrl;

if (!url) {
  console.log("No DATABASE_URL found – skipping warmup");
  process.exit(0);
}

console.log(
  "Warming up database at:",
  url.replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@"),
);

const pool = new Pool({
  connectionString: url,
  connectionTimeoutMillis: 30000,
});

pool
  .query("SELECT 1")
  .then(() => {
    console.log("Database is warm and responsive");
    // Hold the connection open briefly so the Neon compute stays warm
    // until `prisma migrate deploy` connects in the next build step.
    return new Promise((resolve) => setTimeout(resolve, 2000)).then(() =>
      pool.end(),
    );
  })
  .catch((err) => {
    console.warn("Database warmup failed (non-fatal):", err.message);
    return pool.end().catch(() => {});
  })
  .then(() => process.exit(0));
