/**
 * html-server.mjs — HTTP server and file output for the review/approval UI.
 *
 * Exports:
 *   saveAndOpenHtml(title, theatreId, groupsOrResults)
 *   startServer(title, theatreId, groupsOrResults)
 */

import fs from "fs";
import http from "node:http";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

import { saveExcludedShows } from "./db.mjs";
import { green, red } from "./cli.mjs";
import { generateHtml } from "./html-generator.mjs";
import {
  generateMigrationSQL,
  writeMigrationFile,
  validateShowsForMigration,
} from "./migration.mjs";

// ── Setup ───────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..", "..");

// ── HTML report output ──────────────────────────────────────────

export function saveAndOpenHtml(title, theatreId, groupsOrResults) {
  // Backward compat: plain results array → wrap in single group
  const groups =
    Array.isArray(groupsOrResults) &&
    groupsOrResults.length > 0 &&
    Array.isArray(groupsOrResults[0]?.results)
      ? groupsOrResults
      : [{ theatreName: title, results: groupsOrResults || [] }];

  const html = generateHtml(title, groups);
  const outPath = path.join(rootDir, `missing-${theatreId}-shows.html`);
  fs.writeFileSync(outPath, html, "utf-8");
  console.log(`\n📄  Report saved to ${outPath}`);

  try {
    const openCmd =
      process.platform === "darwin"
        ? "open"
        : process.platform === "win32"
          ? "start"
          : "xdg-open";
    execSync(`${openCmd} "${outPath}"`);
    console.log("🌐  Opened in browser.\n");
  } catch {
    console.log("    Open the file manually in your browser.\n");
  }
}

// ── Interactive server ──────────────────────────────────────────

export async function startServer(title, theatreId, groupsOrResults) {
  // Backward compat: plain results array → wrap in single group
  const groups =
    Array.isArray(groupsOrResults) &&
    groupsOrResults.length > 0 &&
    Array.isArray(groupsOrResults[0]?.results)
      ? groupsOrResults
      : [{ theatreName: title, results: groupsOrResults || [] }];

  const html = generateHtml(title, groups);

  const server = http.createServer(async (req, res) => {
    // ── GET / — serve the interactive HTML page ──
    if (req.method === "GET" && req.url === "/") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
      return;
    }

    // ── CORS preflight ──
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      res.end();
      return;
    }

    // ── POST /api/save-exclusions — save excluded shows without migration ──
    if (req.method === "POST" && req.url === "/api/save-exclusions") {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Content-Type", "application/json; charset=utf-8");

      try {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const body = JSON.parse(Buffer.concat(chunks).toString());

        if (
          !Array.isArray(body.excludedShows) ||
          body.excludedShows.length === 0
        ) {
          res.writeHead(400);
          res.end(
            JSON.stringify({ error: "Missing or empty 'excludedShows' array" }),
          );
          return;
        }

        saveExcludedShows(body.excludedShows);
        console.log(
          green(
            `  ✓ ${body.excludedShows.length} show(s) added to exclusion list`,
          ),
        );

        res.writeHead(200);
        res.end(JSON.stringify({ count: body.excludedShows.length }));
      } catch (err) {
        console.error(red("  ✗ API error: ") + err.message);
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    // ── POST /api/generate-migration — generate a Prisma migration file ──
    if (req.method === "POST" && req.url === "/api/generate-migration") {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Content-Type", "application/json; charset=utf-8");

      try {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const body = JSON.parse(Buffer.concat(chunks).toString());
        const shows = body.shows;

        if (!Array.isArray(shows) || shows.length === 0) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Missing or empty 'shows' array" }));
          return;
        }

        const validationErrors = validateShowsForMigration(shows);
        if (validationErrors.length > 0) {
          res.writeHead(400);
          res.end(
            JSON.stringify({
              error: "Validation failed:\n" + validationErrors.join("\n"),
            }),
          );
          return;
        }

        const sql = generateMigrationSQL(shows, theatreId);
        const { migrationName, filePath } = writeMigrationFile(sql, theatreId);

        // Persist unchecked shows to exclusion list
        if (
          Array.isArray(body.excludedShows) &&
          body.excludedShows.length > 0
        ) {
          saveExcludedShows(body.excludedShows);
          console.log(
            green(
              `  ✓ ${body.excludedShows.length} show(s) added to exclusion list`,
            ),
          );
        }

        console.log(green(`  ✓ Migration created: `) + filePath);

        res.writeHead(200);
        res.end(
          JSON.stringify({ migrationName, filePath, showCount: shows.length }),
        );
      } catch (err) {
        console.error(red("  ✗ API error: ") + err.message);
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    // ── Serve images from public/ ──
    if (req.method === "GET" && req.url.endsWith(".webp")) {
      const safeName = path.basename(decodeURIComponent(req.url));
      const imgPath = path.join(rootDir, "public", "images", "shows", safeName);
      try {
        const data = fs.readFileSync(imgPath);
        res.writeHead(200, { "Content-Type": "image/webp" });
        res.end(data);
        return;
      } catch {
        // fall through to 404
      }
    }

    // ── 404 — everything else ──
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  });

  // Try port 3456, increment if busy
  const port = await new Promise((resolve, reject) => {
    let p = 3456;
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        p++;
        server.listen(p);
      } else {
        reject(err);
      }
    });
    server.on("listening", () => resolve(p));
    server.listen(p);
  });

  const url = `http://localhost:${port}`;
  console.log(
    `\n🌐  Server running at ${url}` +
      `\n📝  Edit shows and click "Generate Migration" to create a Prisma migration file.` +
      `\n⏹  Press Ctrl+C to stop.\n`,
  );

  // Open in browser
  try {
    const openCmd =
      process.platform === "darwin"
        ? "open"
        : process.platform === "win32"
          ? "start"
          : "xdg-open";
    execSync(`${openCmd} ${url}`);
  } catch {
    // Ignore — user can open manually
  }

  // Keep the server running until process exit
  return new Promise(() => {});
}
