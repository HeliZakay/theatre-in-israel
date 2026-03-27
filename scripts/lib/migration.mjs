/**
 * migration.mjs — SQL migration generation for new theatre shows.
 *
 * Exports:
 *   generateMigrationSQL(shows, theatreId)
 *   writeMigrationFile(sql, theatreId)
 *   validateShowsForMigration(shows)
 *   escapeSql(s)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..", "..");

function validateShowsForMigration(shows) {
  const errors = [];
  const slugs = new Set();

  for (let i = 0; i < shows.length; i++) {
    const show = shows[i];
    const num = i + 1;

    if (!show.title || !show.title.trim()) {
      errors.push(`Show #${num}: missing title`);
    }
    if (!show.slug || !show.slug.trim()) {
      errors.push(`Show #${num}: missing slug`);
    } else if (/\s/.test(show.slug)) {
      errors.push(`Show #${num}: slug contains whitespace`);
    } else if (slugs.has(show.slug)) {
      errors.push(`Show #${num}: duplicate slug "${show.slug}"`);
    } else {
      slugs.add(show.slug);
    }
    if (!show.theatre || !show.theatre.trim()) {
      errors.push(`Show #${num}: missing theatre`);
    }
    if (
      show.durationMinutes == null ||
      isNaN(show.durationMinutes) ||
      show.durationMinutes <= 0
    ) {
      errors.push(
        `Show #${num} ("${show.title || "?"}"): invalid duration (${show.durationMinutes})`,
      );
    }
    if (!show.summary || !show.summary.trim()) {
      errors.push(`Show #${num} ("${show.title || "?"}"): missing summary`);
    }
  }

  return errors;
}

function escapeSql(s) {
  if (s == null) return "NULL";
  return "'" + String(s).replace(/'/g, "''") + "'";
}

export function generateMigrationSQL(shows, theatreId) {
  const lines = [
    `-- Migration: Add new ${theatreId} shows`,
    `-- Generated on ${new Date().toISOString()}`,
    "-- This migration is idempotent (uses ON CONFLICT DO NOTHING).",
    "",
  ];

  // 1. Insert genres
  const allGenres = new Set();
  for (const show of shows) {
    for (const g of show.genre || []) {
      if (g) allGenres.add(g);
    }
  }

  if (allGenres.size > 0) {
    lines.push(
      "-- ============================================================",
    );
    lines.push("-- 1. Insert Genres");
    lines.push(
      "-- ============================================================",
    );
    for (const name of [...allGenres].sort()) {
      lines.push(
        `INSERT INTO "Genre" (name) VALUES (${escapeSql(name)}) ON CONFLICT (name) DO NOTHING;`,
      );
    }
    lines.push("");
  }

  // 2. Insert shows (no explicit id — let autoincrement handle it)
  lines.push("-- ============================================================");
  lines.push("-- 2. Insert Shows");
  lines.push("-- ============================================================");
  for (const show of shows) {
    const title = escapeSql(show.title);
    const slug = escapeSql(show.slug);
    const theatre = escapeSql(show.theatre);
    const duration = show.durationMinutes;
    const summary = escapeSql(show.summary);
    const description = show.description ? escapeSql(show.description) : "NULL";
    const cast = show.cast ? escapeSql(show.cast) : "NULL";
    lines.push(
      `INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") ` +
        `VALUES (${title}, ${slug}, ${theatre}, ${duration}, ${summary}, ${description}, ${cast}) ` +
        `ON CONFLICT (slug) DO NOTHING;`,
    );
  }
  lines.push("");

  // 3. Insert ShowGenre join records (resolve IDs via subselects)
  const hasGenreLinks = shows.some((s) => (s.genre || []).length > 0);
  if (hasGenreLinks) {
    lines.push(
      "-- ============================================================",
    );
    lines.push("-- 3. Insert ShowGenre join records");
    lines.push(
      "-- ============================================================",
    );
    for (const show of shows) {
      for (const genre of show.genre || []) {
        const slug = escapeSql(show.slug);
        const genreName = escapeSql(genre);
        lines.push(
          `INSERT INTO "ShowGenre" ("showId", "genreId") ` +
            `SELECT s.id, g.id FROM "Show" s, "Genre" g ` +
            `WHERE s.slug = ${slug} AND g.name = ${genreName} ` +
            `ON CONFLICT DO NOTHING;`,
        );
      }
    }
    lines.push("");
  }

  // 4. Reset sequences
  lines.push("-- ============================================================");
  lines.push("-- 4. Reset sequences");
  lines.push("-- ============================================================");
  lines.push(
    `SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));`,
  );
  lines.push(
    `SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));`,
  );
  lines.push("");

  return lines.join("\n");
}

export function writeMigrationFile(sql, theatreId) {
  const now = new Date();
  const ts = now.toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const migrationName = `${ts}_add_${theatreId}_shows`;
  const migrationDir = path.join(
    rootDir,
    "prisma",
    "migrations",
    migrationName,
  );
  fs.mkdirSync(migrationDir, { recursive: true });
  const filePath = path.join(migrationDir, "migration.sql");
  fs.writeFileSync(filePath, sql, "utf-8");
  return { migrationName, filePath: path.relative(rootDir, filePath) };
}

export { validateShowsForMigration, escapeSql };
