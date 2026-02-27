/**
 * Warm up the Neon serverless database before running migrations.
 * Neon suspends idle compute endpoints; the first connection can take
 * several seconds to wake up. Running a simple query here ensures the
 * database is responsive before `prisma migrate deploy` tries to
 * acquire an advisory lock (which has a 10 s timeout).
 */
const { Pool } = require("pg");

const url =
  process.env.DIRECT_DATABASE_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL;

if (!url) {
  console.log("No DATABASE_URL found – skipping warmup");
  process.exit(0);
}

const pool = new Pool({ connectionString: url, connectionTimeoutMillis: 30000 });

pool
  .query("SELECT 1")
  .then(() => {
    console.log("Database is warm and responsive");
    return pool.end();
  })
  .catch((err) => {
    console.warn("Database warmup failed (non-fatal):", err.message);
    return pool.end().catch(() => {});
  })
  .then(() => process.exit(0));
