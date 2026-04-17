#!/usr/bin/env node
/**
 * db-sync.mjs
 *
 * Refreshes the local dev database from the production Neon DB.
 *
 * Safety guarantees:
 *   - Prod URL must match *.neon.tech — otherwise abort.
 *   - Local URL must point at 127.0.0.1 / localhost — otherwise abort.
 *   - Prod URL is never written to process.env.DATABASE_URL.
 *   - pg_dump is the only tool that touches prod (read-only).
 *   - TRUNCATE runs only against the local DB.
 *   - Interactive y/N confirmation before any data is modified.
 *
 * Prereqs: pg_dump and psql on PATH.
 */

import { spawn, spawnSync } from "node:child_process";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Transform } from "node:stream";
import dotenv from "dotenv";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");

const PROD_ENV_FILE = path.join(REPO_ROOT, ".env.production.local");
const LOCAL_ENV_FILE = path.join(REPO_ROOT, ".env.local");

function resolvePgBinaries() {
  if (process.env.PG_BIN) {
    return {
      pgDump: path.join(process.env.PG_BIN, "pg_dump"),
      psql: path.join(process.env.PG_BIN, "psql"),
    };
  }
  const brewRoot = "/opt/homebrew/opt";
  if (fs.existsSync(brewRoot)) {
    const versions = fs
      .readdirSync(brewRoot)
      .filter((d) => /^postgresql@\d+$/.test(d))
      .map((d) => ({ name: d, v: parseInt(d.split("@")[1], 10) }))
      .sort((a, b) => b.v - a.v);
    for (const { name } of versions) {
      const bin = path.join(brewRoot, name, "bin");
      if (
        fs.existsSync(path.join(bin, "pg_dump")) &&
        fs.existsSync(path.join(bin, "psql"))
      ) {
        return { pgDump: path.join(bin, "pg_dump"), psql: path.join(bin, "psql") };
      }
    }
  }
  return { pgDump: "pg_dump", psql: "psql" };
}

const { pgDump: PG_DUMP, psql: PSQL } = resolvePgBinaries();

function getBinaryMajorVersion(bin) {
  const res = spawnSync(bin, ["--version"], { encoding: "utf-8" });
  if (res.status !== 0) return null;
  const m = res.stdout.match(/(\d+)\./);
  return m ? parseInt(m[1], 10) : null;
}

async function getServerMajorVersion(url) {
  const out = await runPsqlCapture(url, "SHOW server_version;");
  const m = out.match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`Env file not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return dotenv.parse(raw);
}

function fail(msg) {
  console.error(`\n❌  ${msg}\n`);
  process.exit(1);
}

function redactUrl(url) {
  try {
    const u = new URL(url);
    if (u.password) u.password = "***";
    return u.toString();
  } catch {
    return "<unparseable>";
  }
}

function assertProdUrl(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    fail("Prod DATABASE_URL is not a valid URL.");
  }
  if (!/\.neon\.tech$/i.test(u.hostname)) {
    fail(
      `Refusing to dump from a non-Neon host. Got: ${u.hostname}\n` +
        `   Source URL must end in .neon.tech to proceed.`,
    );
  }
}

function assertLocalUrl(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    fail("Local DATABASE_URL is not a valid URL.");
  }
  if (u.hostname !== "127.0.0.1" && u.hostname !== "localhost") {
    fail(
      `Refusing to restore into a non-local host. Got: ${u.hostname}\n` +
        `   Target must be 127.0.0.1 or localhost to proceed.`,
    );
  }
}

function prompt(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function runPsqlCapture(url, sql) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      PSQL,
      [url, "-v", "ON_ERROR_STOP=1", "-At", "-c", sql],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`psql exited ${code}: ${stderr.trim()}`));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

async function getLocalUserTables(localUrl) {
  const sql = `
    SELECT quote_ident(tablename)
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations'
    ORDER BY tablename;
  `;
  const out = await runPsqlCapture(localUrl, sql);
  if (!out) return [];
  return out.split("\n").filter(Boolean);
}

async function getProdRowCount(prodUrl, table) {
  try {
    const out = await runPsqlCapture(
      prodUrl,
      `SELECT count(*) FROM "${table}";`,
    );
    return parseInt(out, 10);
  } catch (err) {
    console.error(`     (error counting ${table}: ${err.message})`);
    return null;
  }
}

/**
 * Filter out SET commands that newer servers emit but older servers reject.
 * pg_dump 17 emits `SET transaction_timeout = 0;` which pg <17 does not
 * recognize. We drop such lines while streaming the dump to psql.
 */
function makeCompatFilter() {
  const BLOCKED = [/^\s*SET\s+transaction_timeout\s*=/i];
  let buffer = "";
  return new Transform({
    transform(chunk, _enc, cb) {
      buffer += chunk.toString("utf8");
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      const kept = lines.filter((line) => !BLOCKED.some((re) => re.test(line)));
      cb(null, kept.join("\n") + (kept.length ? "\n" : ""));
    },
    flush(cb) {
      if (buffer && !BLOCKED.some((re) => re.test(buffer))) {
        cb(null, buffer);
      } else {
        cb();
      }
    },
  });
}

function pipeDumpToPsql(prodUrl, localUrl) {
  return new Promise((resolve, reject) => {
    const dump = spawn(
      PG_DUMP,
      [
        prodUrl,
        "--data-only",
        "--no-owner",
        "--no-acl",
        "--disable-triggers",
        "--schema=public",
        "--exclude-table-data=_prisma_migrations",
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );

    const psql = spawn(
      PSQL,
      [localUrl, "-v", "ON_ERROR_STOP=1", "--single-transaction"],
      { stdio: ["pipe", "inherit", "pipe"] },
    );

    let dumpErr = "";
    let psqlErr = "";
    dump.stderr.on("data", (d) => (dumpErr += d.toString()));
    psql.stderr.on("data", (d) => {
      const s = d.toString();
      psqlErr += s;
      process.stderr.write(s);
    });

    const filter = makeCompatFilter();
    dump.stdout.pipe(filter).pipe(psql.stdin);

    dump.on("error", reject);
    psql.on("error", reject);

    let dumpClosed = false;
    let psqlClosed = false;
    let dumpCode = null;
    let psqlCode = null;

    const maybeDone = () => {
      if (!dumpClosed || !psqlClosed) return;
      if (dumpCode !== 0) {
        reject(
          new Error(`pg_dump exited ${dumpCode}: ${dumpErr.trim()}`),
        );
        return;
      }
      if (psqlCode !== 0) {
        reject(new Error(`psql exited ${psqlCode}: ${psqlErr.trim()}`));
        return;
      }
      resolve();
    };

    dump.on("close", (code) => {
      dumpClosed = true;
      dumpCode = code;
      maybeDone();
    });
    psql.on("close", (code) => {
      psqlClosed = true;
      psqlCode = code;
      maybeDone();
    });
  });
}

async function main() {
  console.log("🔄  db-sync — refresh local DB from production\n");

  const prodEnv = loadEnvFile(PROD_ENV_FILE);
  const localEnv = loadEnvFile(LOCAL_ENV_FILE);

  const prodUrl = prodEnv.DATABASE_URL;
  const localUrl = localEnv.DATABASE_URL;

  if (!prodUrl) fail(`DATABASE_URL missing from ${PROD_ENV_FILE}`);
  if (!localUrl) fail(`DATABASE_URL missing from ${LOCAL_ENV_FILE}`);

  assertProdUrl(prodUrl);
  assertLocalUrl(localUrl);

  console.log(`   Source (read-only): ${redactUrl(prodUrl)}`);
  console.log(`   Target (local):     ${redactUrl(localUrl)}`);
  console.log(`   Using: ${PG_DUMP}\n`);

  const dumpMajor = getBinaryMajorVersion(PG_DUMP);
  if (dumpMajor == null) {
    fail(`Could not run ${PG_DUMP} --version. Is Postgres installed?`);
  }
  const serverMajor = await getServerMajorVersion(prodUrl);
  if (serverMajor == null) {
    fail("Could not query prod server_version.");
  }
  if (dumpMajor < serverMajor) {
    fail(
      `pg_dump (v${dumpMajor}) is older than prod server (v${serverMajor}).\n` +
        `   Install matching client tools: brew install postgresql@${serverMajor}\n` +
        `   Or set PG_BIN=/path/to/postgres/bin before running.`,
    );
  }

  console.log("   Sampling prod row counts…");
  const sampleTables = ["Show", "Event", "Review"];
  for (const t of sampleTables) {
    const n = await getProdRowCount(prodUrl, t);
    console.log(`     ${t.padEnd(8)} ${n ?? "?"}`);
  }
  console.log();

  console.log("   Discovering local tables to truncate…");
  const tables = await getLocalUserTables(localUrl);
  if (tables.length === 0) {
    fail(
      "No user tables found in local DB. Run `prisma migrate dev` first so the schema exists.",
    );
  }
  console.log(`     ${tables.length} tables (excluding _prisma_migrations)\n`);

  const answer = await prompt(
    "⚠️   Local data will be TRUNCATED and replaced. Continue? [y/N] ",
  );
  if (answer.trim().toLowerCase() !== "y") {
    console.log("\nAborted.\n");
    process.exit(0);
  }

  console.log("\n   Truncating local tables…");
  const truncateSql = `TRUNCATE TABLE ${tables.join(", ")} RESTART IDENTITY CASCADE;`;
  await runPsqlCapture(localUrl, truncateSql);

  console.log("   Streaming pg_dump → psql …");
  await pipeDumpToPsql(prodUrl, localUrl);

  console.log("\n   Verifying local row counts…");
  for (const t of sampleTables) {
    try {
      const out = await runPsqlCapture(localUrl, `SELECT count(*) FROM "${t}";`);
      console.log(`     ${t.padEnd(8)} ${out}`);
    } catch {
      console.log(`     ${t.padEnd(8)} ?`);
    }
  }

  console.log("\n✅  Sync complete.\n");
}

main().catch((err) => {
  console.error(`\n❌  ${err.message}\n`);
  process.exit(1);
});
