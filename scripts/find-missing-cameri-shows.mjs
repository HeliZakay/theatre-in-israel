#!/usr/bin/env node
/**
 * find-missing-cameri-shows.mjs
 *
 * Scrapes the Cameri Theatre schedule, finds shows not yet in the
 * local database, scrapes details, generates AI summaries, downloads
 * images, and generates a Prisma migration file with the new shows.
 *
 * Usage:
 *   node scripts/find-missing-cameri-shows.mjs                # interactive (generates migration)
 *   node scripts/find-missing-cameri-shows.mjs --json          # JSON output
 *   node scripts/find-missing-cameri-shows.mjs --html          # HTML report
 */

import dotenv from "dotenv";
import fs from "fs";
import http from "node:http";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";

// ── Shared modules ──────────────────────────────────────────────
import { generateSlug } from "./lib/slug.mjs";
import { downloadAndConvert } from "./lib/image.mjs";
import {
  CAMERI_THEATRE,
  launchBrowser,
  fetchSchedule,
  scrapeShowDetails,
} from "./lib/cameri.mjs";
import { normalise, fetchExistingTitles } from "./lib/db.mjs";
import { green, red } from "./lib/cli.mjs";

// ── Setup ───────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

dotenv.config({ path: path.join(rootDir, ".env.local") });

const jsonMode = process.argv.includes("--json");
const htmlMode = process.argv.includes("--html");

const POLITE_DELAY = 1500;

// ── AI configuration ────────────────────────────────────────────
const AI_MODEL = "gpt-4o-mini";
const AI_ENDPOINT = "https://models.inference.ai.azure.com";

const EXISTING_GENRES = [
  "מוזיקלי",
  "ישראלי",
  "מרגש",
  "מחזמר",
  "דרמה",
  "קלאסיקה",
  "קומדיה",
  "סאטירה",
  "דרמה קומית",
  "ילדים",
  "פנטזיה",
  "מותחן",
  "קומדיה שחורה",
  "רומנטי",
];

// ── Helpers ─────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── HTML report generator ───────────────────────────────────────

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function generateHtml(results) {
  const now = new Date().toLocaleString("he-IL", {
    dateStyle: "long",
    timeStyle: "short",
  });
  const total = results.length;
  const errorCount = results.filter((r) => r.error).length;
  const validCount = total - errorCount;

  const cards = results
    .map((r, i) => {
      const hasError = !!r.error;
      const genres = (r.genre || []).join(", ");
      return `
      <div class="card${hasError ? " error-card" : ""}" data-index="${i}">
        <div class="card-header">
          ${!hasError ? `<input type="checkbox" class="card-checkbox" checked data-index="${i}">` : ""}
          <span class="card-number">${i + 1}</span>
          <input type="text" class="title-input" value="${esc(r.title)}" data-index="${i}">
        </div>
        <div class="card-body">
          <div class="image-section">
            ${
              r.imageUrl
                ? `<img class="show-image" src="${esc(r.imageUrl)}" alt="${esc(r.title)}">`
                : `<div class="image-placeholder">🎭</div>`
            }
          </div>
          <table class="fields-table">
            <tr>
              <td class="label">slug</td>
              <td><input type="text" class="field-input slug-input" dir="ltr" value="${esc(r.slug)}" data-index="${i}"></td>
            </tr>
            <tr>
              <td class="label">תיאטרון</td>
              <td><input type="text" class="field-input theatre-input" value="${esc(r.theatre)}" data-index="${i}"></td>
            </tr>
            <tr>
              <td class="label">משך (דקות)</td>
              <td><input type="number" class="field-input duration-input" min="1" value="${r.durationMinutes != null ? r.durationMinutes : ""}" data-index="${i}"></td>
            </tr>
            <tr>
              <td class="label">ז'אנרים</td>
              <td><input type="text" class="field-input genres-input" value="${esc(genres)}" data-index="${i}"></td>
            </tr>
            <tr>
              <td class="label">תקציר</td>
              <td><textarea class="field-textarea summary-input" rows="3" data-index="${i}">${esc(r.summary || "")}</textarea></td>
            </tr>
            <tr>
              <td class="label">תיאור</td>
              <td><textarea class="field-textarea description-input" rows="5" data-index="${i}">${esc(r.description || "")}</textarea></td>
            </tr>
            <tr>
              <td class="label">URL</td>
              <td><a href="${esc(r.url)}" target="_blank" class="url-link" dir="ltr">${esc(r.url)}</a></td>
            </tr>
            ${hasError ? `<tr><td class="label">שגיאה</td><td class="error-text">${esc(r.error)}</td></tr>` : ""}
          </table>
          <div class="card-status" data-index="${i}"></div>
        </div>
      </div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>הצגות חסרות - תיאטרון הקאמרי</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      direction: rtl;
      padding-top: 80px;
    }

    /* ── Top bar ────────────────────────────── */
    .top-bar {
      position: fixed; top: 0; right: 0; left: 0; z-index: 100;
      background: #1e293b; border-bottom: 1px solid #334155;
      padding: 0.6rem 1.5rem;
      display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
    }
    .top-bar h1 { font-size: 1.15rem; color: #38bdf8; white-space: nowrap; margin: 0; }
    .top-bar .meta { color: #94a3b8; font-size: 0.8rem; white-space: nowrap; }
    .top-bar .spacer { flex: 1; }
    .toggle-link {
      color: #38bdf8; cursor: pointer; text-decoration: underline;
      font-size: 0.85rem; background: none; border: none; font-family: inherit; padding: 0;
    }
    .toggle-link:hover { color: #7dd3fc; }
    .bulk-btn {
      background: linear-gradient(135deg, #0ea5e9, #6366f1);
      color: #fff; border: none; border-radius: 8px;
      padding: 0.65rem 1.6rem; font-size: 1rem; font-weight: 700;
      cursor: pointer; font-family: inherit; white-space: nowrap;
    }
    .bulk-btn:hover { filter: brightness(1.15); }
    .bulk-btn:disabled { opacity: 0.5; cursor: not-allowed; background: #475569; filter: none; }
    .bulk-status { font-size: 0.85rem; min-height: 1em; }

    /* ── Cards container ────────────────────── */
    .cards-container {
      max-width: 850px; margin: 1.5rem auto; padding: 0 1rem;
      display: flex; flex-direction: column; gap: 1.5rem;
    }

    /* ── Card ────────────────────────────────── */
    .card {
      background: #1e293b; border: 1px solid #334155;
      border-radius: 12px; overflow: hidden; transition: opacity 0.3s;
    }
    .card.inserted { opacity: 0.6; }
    .card.error-card { opacity: 0.7; }
    .card-header {
      background: linear-gradient(135deg, #0ea5e9, #6366f1);
      padding: 0.75rem 1rem;
      display: flex; align-items: center; gap: 0.75rem;
    }
    .card-checkbox {
      width: 18px; height: 18px; cursor: pointer;
      accent-color: #38bdf8; flex-shrink: 0;
    }
    .card-number {
      background: rgba(0,0,0,0.3); color: #fff; font-weight: 700;
      padding: 0.15rem 0.55rem; border-radius: 6px; font-size: 0.85rem; flex-shrink: 0;
    }
    .title-input {
      background: transparent; border: 1px solid transparent;
      color: #fff; font-size: 1.15rem; font-weight: 700;
      font-family: inherit; padding: 0.2rem 0.5rem;
      border-radius: 6px; flex: 1; min-width: 0;
    }
    .title-input:hover { border-color: rgba(255,255,255,0.3); }
    .title-input:focus { border-color: rgba(255,255,255,0.6); outline: none; background: rgba(0,0,0,0.2); }
    .success-badge {
      background: #22c55e; color: #fff; font-size: 0.75rem;
      padding: 0.2rem 0.6rem; border-radius: 12px; font-weight: 700;
      flex-shrink: 0; white-space: nowrap;
    }

    /* ── Card body ───────────────────────────── */
    .card-body { padding: 1rem 1.25rem; }
    .image-section { text-align: center; margin-bottom: 1rem; }
    .show-image {
      max-width: 100%; max-height: 220px; object-fit: cover;
      display: block; border-radius: 8px; margin: 0 auto;
    }
    .image-placeholder { font-size: 4rem; opacity: 0.3; }

    /* ── Fields table ────────────────────────── */
    .fields-table { width: 100%; border-collapse: collapse; }
    .fields-table tr { border-bottom: 1px solid rgba(51,65,85,0.5); }
    .fields-table tr:last-child { border-bottom: none; }
    .fields-table td { padding: 0.45rem 0.6rem; vertical-align: top; }
    .fields-table .label {
      color: #94a3b8; font-weight: 600; white-space: nowrap;
      width: 90px; padding-top: 0.7rem; font-size: 0.85rem;
    }

    /* ── Inputs ──────────────────────────────── */
    .field-input, .field-textarea {
      background: #0f172a; border: 1px solid #334155; color: #e2e8f0;
      border-radius: 6px; padding: 0.5rem; font-family: inherit; font-size: 0.9rem;
    }
    .field-input { width: 100%; }
    .field-textarea { width: 100%; resize: vertical; }
    .field-input:focus, .field-textarea:focus {
      border-color: #38bdf8; outline: none;
      box-shadow: 0 0 0 2px rgba(56,189,248,0.2);
    }

    /* ── Buttons ─────────────────────────────── */
    /* ── Status & misc ───────────────────────── */
    .card-status { text-align: center; margin-top: 0.5rem; font-size: 0.9rem; min-height: 1.2em; }
    .status-success { color: #4ade80; font-weight: 600; }
    .status-skipped { color: #fbbf24; font-weight: 600; }
    .status-error { color: #f87171; font-weight: 600; }
    .url-link { color: #38bdf8; text-decoration: none; word-break: break-all; font-size: 0.85rem; }
    .url-link:hover { text-decoration: underline; }
    .error-text { color: #f87171; font-size: 0.85rem; }
    .tag {
      display: inline-block; background: #334155; color: #38bdf8;
      padding: 0.15rem 0.6rem; border-radius: 999px; font-size: 0.85rem; margin: 0.1rem;
    }
  </style>
</head>
<body>
  <div class="top-bar">
    <h1>🎭 הצגות חסרות - תיאטרון הקאמרי</h1>
    <span class="meta">${esc(now)} · ${total} הצגות (${validCount} תקינות)</span>
    <span class="spacer"></span>
    <button class="toggle-link" onclick="selectAll()">בחר הכל</button>
    <button class="toggle-link" onclick="deselectAll()">בטל הכל</button>
    <button class="bulk-btn" id="bulk-btn" onclick="generateMigration()">צור מיגרציה (${validCount})</button>
    <span class="bulk-status" id="bulk-status"></span>
  </div>

  <div class="cards-container">
    ${cards}
  </div>

  <script>
    var SHOWS = ${JSON.stringify(results).replace(/<\//g, "<\\/")};

    function slugify(title) {
      return title.trim().replace(/\\s+/g, "-");
    }

    function getCardData(idx) {
      var card = document.querySelector(".card[data-index='" + idx + "']");
      var title = card.querySelector(".title-input").value;
      var slug = card.querySelector(".slug-input").value;
      var theatre = card.querySelector(".theatre-input").value;
      var durVal = card.querySelector(".duration-input").value;
      var duration = durVal ? parseInt(durVal, 10) : null;
      var genresStr = card.querySelector(".genres-input").value;
      var genres = genresStr
        ? genresStr.split(",").map(function(g) { return g.trim(); }).filter(Boolean)
        : [];
      var summary = card.querySelector(".summary-input").value;
      var descEl = card.querySelector(".description-input");
      var description = descEl ? descEl.value || null : null;
      return {
        title: title,
        slug: slug,
        theatre: theatre,
        durationMinutes: duration,
        genre: genres,
        summary: summary,
        description: description,
        url: SHOWS[idx].url,
        imageUrl: SHOWS[idx].imageUrl
      };
    }

    function getCheckedIndices() {
      var indices = [];
      document.querySelectorAll(".card-checkbox:checked").forEach(function(cb) {
        var card = cb.closest(".card");
        if (card && !card.classList.contains("inserted")) {
          indices.push(parseInt(card.getAttribute("data-index"), 10));
        }
      });
      return indices;
    }

    function updateBulkCount() {
      var indices = getCheckedIndices();
      var btn = document.getElementById("bulk-btn");
      btn.textContent = "צור מיגרציה (" + indices.length + ")";
      btn.disabled = indices.length === 0;
    }

    function generateMigration() {
      var indices = getCheckedIndices();
      if (indices.length === 0) return;

      var bulkBtn = document.getElementById("bulk-btn");
      var bulkStatus = document.getElementById("bulk-status");
      bulkBtn.disabled = true;
      bulkBtn.textContent = "יוצר מיגרציה...";
      bulkStatus.innerHTML = "";

      var shows = indices.map(function(idx) { return getCardData(idx); });

      fetch("/api/generate-migration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shows: shows })
      })
      .then(function(res) {
        return res.json().then(function(body) { return { ok: res.ok, body: body }; });
      })
      .then(function(result) {
        if (!result.ok) {
          bulkStatus.innerHTML = '<span class="status-error">\\u274c ' + (result.body.error || "שגיאה ביצירת מיגרציה") + "</span>";
          bulkBtn.disabled = false;
          updateBulkCount();
          return;
        }
        // Mark all selected cards as done
        indices.forEach(function(idx) {
          var card = document.querySelector(".card[data-index='" + idx + "']");
          card.classList.add("inserted");
          var cb = card.querySelector(".card-checkbox");
          if (cb) { cb.checked = false; cb.disabled = true; }
          var header = card.querySelector(".card-header");
          if (!header.querySelector(".success-badge")) {
            var badge = document.createElement("span");
            badge.className = "success-badge";
            badge.textContent = "\\u2713 במיגרציה";
            header.appendChild(badge);
          }
        });
        bulkStatus.innerHTML = '<span class="status-success">\\u2705 מיגרציה נוצרה: ' + result.body.filePath + ' (' + result.body.showCount + ' הצגות)</span>';
        bulkBtn.disabled = true;
        bulkBtn.textContent = "מיגרציה נוצרה \\u2713";
        updateBulkCount();
      })
      .catch(function(err) {
        bulkStatus.innerHTML = '<span class="status-error">\\u274c ' + err.message + "</span>";
        bulkBtn.disabled = false;
        updateBulkCount();
      });
    }

    function selectAll() {
      document.querySelectorAll(".card-checkbox").forEach(function(cb) {
        if (!cb.disabled) cb.checked = true;
      });
      updateBulkCount();
    }

    function deselectAll() {
      document.querySelectorAll(".card-checkbox").forEach(function(cb) {
        if (!cb.disabled) cb.checked = false;
      });
      updateBulkCount();
    }

    // Auto-update slug when title changes
    document.addEventListener("input", function(e) {
      if (e.target.classList.contains("title-input")) {
        var idx = e.target.getAttribute("data-index");
        var slugInput = document.querySelector(".card[data-index='" + idx + "'] .slug-input");
        if (slugInput) slugInput.value = slugify(e.target.value);
      }
    });

    // Update bulk count when checkbox changes
    document.addEventListener("change", function(e) {
      if (e.target.classList.contains("card-checkbox")) {
        updateBulkCount();
      }
    });

    // Initial count
    updateBulkCount();
  </script>
</body>
</html>`;
}

// ── AI description processing ───────────────────────────────────

function createAIClient() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;
  return new OpenAI({ baseURL: AI_ENDPOINT, apiKey: token });
}

async function processDescription(aiClient, title, rawDescription) {
  const fallback = { description: rawDescription || null, summary: "" };
  if (!aiClient || !rawDescription) return fallback;

  try {
    const response = await aiClient.chat.completions.create({
      model: AI_MODEL,
      temperature: 0.4,
      max_tokens: 700,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "אתה עורך תיאורי הצגות תיאטרון בעברית. עליך לבצע שתי משימות:",
            "",
            "1. ניקוי תיאור: קיבלת טקסט גולמי שנגרד מאתר אינטרנט ועלול להכיל רעשים.",
            "הסר את כל מה שאינו חלק מתיאור העלילה והתוכן האמנותי של ההצגה:",
            "רשימות משתתפים, שחקנים, יוצרים, צוות, קרדיטים, צילום, עיצוב,",
            "מספרי טלפון, כתובות, מידע על הנגשה, הפקה, תמיכה, פרסים,",
            "הפניות לאתרים, הערות שוליים, וכל טקסט טכני או שיווקי.",
            "שמור רק את הפסקאות שמתארות את העלילה, הנושא והחוויה התיאטרונית.",
            "",
            "2. כתיבת תקציר: כתוב משפט אחד עד שניים (20-40 מילים) שמתאר את ההצגה בסגנון עיתונאי-שיווקי:",
            "תמציתי, מרתק, כולל את הז'אנר, העלילה המרכזית ואלמנט מושך.",
            "אל תשתמש במירכאות בתקציר.",
            "",
            'החזר JSON בפורמט: { "description": "התיאור הנקי", "summary": "התקציר" }',
            "ללא הערות או הסברים נוספים.",
          ].join("\n"),
        },
        {
          role: "user",
          content: `שם ההצגה: ${title}\n\nטקסט גולמי:\n${rawDescription}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) return fallback;

    const parsed = JSON.parse(content);
    return {
      description: parsed.description?.trim() || rawDescription,
      summary: parsed.summary?.trim() || "",
    };
  } catch {
    return fallback;
  }
}

async function classifyGenres(aiClient, results) {
  const validResults = results.filter((r) => !r.error);
  if (!aiClient || validResults.length === 0) return;

  const showList = validResults
    .map(
      (r, i) =>
        `${i + 1}. שם: ${r.title}\n   תקציר: ${r.summary || "(אין)"}\n   תיאור: ${(r.description || "(אין)").slice(0, 300)}`,
    )
    .join("\n\n");

  try {
    const response = await aiClient.chat.completions.create({
      model: AI_MODEL,
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "אתה מסווג ז'אנרים של הצגות תיאטרון בעברית.",
            `הז'אנרים הקיימים במערכת הם: ${EXISTING_GENRES.join(", ")}.`,
            "עבור כל הצגה, בחר 1-3 ז'אנרים מתאימים.",
            "העדף תמיד ז'אנרים מהרשימה הקיימת.",
            "צור ז'אנר חדש רק אם אף ז'אנר קיים לא מתאר את ההצגה בצורה סבירה.",
            "ז'אנר חדש צריך להיות מילה אחת או שתיים בעברית, בסגנון דומה לז'אנרים הקיימים.",
            'החזר JSON בפורמט: { "shows": [ { "title": "שם ההצגה", "genres": ["ז\'אנר1", "ז\'אנר2"] } ] }',
            "אל תוסיף הערות או הסברים — רק את ה-JSON.",
          ].join(" "),
        },
        {
          role: "user",
          content: `סווג את הז'אנרים עבור ההצגות הבאות:\n\n${showList}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) return;

    const parsed = JSON.parse(content);
    const genreMap = new Map();

    if (Array.isArray(parsed.shows)) {
      for (const entry of parsed.shows) {
        if (entry.title && Array.isArray(entry.genres)) {
          genreMap.set(normalise(entry.title), entry.genres);
        }
      }
    }

    for (const r of validResults) {
      const genres = genreMap.get(normalise(r.title));
      if (genres && genres.length > 0) {
        r.genre = genres;
      }
    }
  } catch (err) {
    if (!jsonMode) {
      console.warn(`  ⚠️  Genre classification failed: ${err.message}`);
    }
  }
}

// ── Migration SQL generator ─────────────────────────────────────

function escapeSql(s) {
  if (s == null) return "NULL";
  return "'" + String(s).replace(/'/g, "''") + "'";
}

function generateMigrationSQL(shows) {
  const lines = [
    "-- Migration: Add new Cameri shows",
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
    const duration = show.durationMinutes ?? 0;
    const summary = escapeSql(show.summary);
    const description = show.description ? escapeSql(show.description) : "NULL";
    lines.push(
      `INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) ` +
        `VALUES (${title}, ${slug}, ${theatre}, ${duration}, ${summary}, ${description}) ` +
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

function writeMigrationFile(sql) {
  const now = new Date();
  const ts = now.toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const migrationName = `${ts}_add_cameri_shows`;
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

// ── HTML report output ──────────────────────────────────────────

function saveAndOpenHtml(results) {
  const html = generateHtml(results);
  const outPath = path.join(rootDir, "missing-cameri-shows.html");
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

async function startServer(results) {
  const html = generateHtml(results);

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

        const sql = generateMigrationSQL(shows);
        const { migrationName, filePath } = writeMigrationFile(sql);

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

// ── Main ────────────────────────────────────────────────────────

try {
  // 1. DB lookup
  const existingSet = await fetchExistingTitles(CAMERI_THEATRE);
  const hasDb = existingSet !== null;

  const aiClient = createAIClient();
  if (!aiClient) {
    console.warn("⚠️  GITHUB_TOKEN not set — AI summaries will be skipped\n");
  }
  if (!hasDb) {
    console.warn(
      "⚠️  DATABASE_URL not set — will scrape details for ALL shows\n",
    );
  }

  // 2. Scrape schedule page
  const browser = await launchBrowser();

  let allShows;
  try {
    allShows = await fetchSchedule(browser);
  } catch (err) {
    await browser.close();
    throw err;
  }

  // 3. Filter to missing shows only
  const missingShows = hasDb
    ? allShows.filter((s) => !existingSet.has(normalise(s.title)))
    : allShows;

  if (missingShows.length === 0) {
    if (jsonMode) {
      console.log("[]");
    } else {
      console.log("\n🎭  All Cameri shows are already in the database. ✅\n");
      console.log(
        `   (${allShows.length} scraped · ${existingSet?.size ?? 0} in DB)\n`,
      );
    }
    await browser.close();
    process.exit(0);
  }

  if (!jsonMode) {
    const label = hasDb
      ? `Found ${missingShows.length} missing show(s) (out of ${allShows.length} scraped, ${existingSet.size} in DB)`
      : `Scraping details for ${missingShows.length} show(s)`;
    console.log(`\n🎭  ${label}\n`);
    console.log("   Fetching details for each show…\n");
  }

  // 4. Scrape each missing show's detail page
  const results = [];

  for (let i = 0; i < missingShows.length; i++) {
    const { title, url } = missingShows[i];

    if (!jsonMode) {
      process.stdout.write(`  [${i + 1}/${missingShows.length}]  ${title} … `);
    }

    try {
      const details = await scrapeShowDetails(browser, url);
      const showTitle = details.title || title;
      const { description, summary } = await processDescription(
        aiClient,
        showTitle,
        details.description,
      );

      // Download show image
      let imageUrl = details.imageUrl || null;
      let imageStatus = null;
      if (imageUrl) {
        imageStatus = await downloadAndConvert(showTitle, imageUrl);
      }

      results.push({
        title: showTitle,
        slug: generateSlug(showTitle),
        theatre: CAMERI_THEATRE,
        durationMinutes: details.durationMinutes,
        description: description || null,
        summary,
        genre: [],
        url,
        imageUrl,
        imageStatus,
      });
      if (!jsonMode) console.log("✅");
    } catch (err) {
      results.push({
        title,
        slug: generateSlug(title),
        theatre: CAMERI_THEATRE,
        durationMinutes: null,
        description: null,
        summary: "",
        genre: [],
        url,
        imageUrl: null,
        imageStatus: null,
        error: err.message,
      });
      if (!jsonMode) console.log(`⚠️  ${err.message}`);
    }

    // Be polite — wait between requests (skip after last one)
    if (i < missingShows.length - 1) {
      await sleep(POLITE_DELAY);
    }
  }

  // 4b. Classify genres
  if (aiClient && results.some((r) => !r.error)) {
    if (!jsonMode) {
      process.stdout.write("\n  🏷️  Classifying genres… ");
    }
    await classifyGenres(aiClient, results);
    if (!jsonMode) {
      console.log("✅");
    }
  }

  await browser.close();

  // 5. Output results
  if (jsonMode) {
    console.log(JSON.stringify(results, null, 2));
  } else if (htmlMode) {
    saveAndOpenHtml(results);
  } else {
    // Default: start interactive server for editing + DB insertion
    const ok = results.filter((r) => !r.error).length;
    const errCount = results.filter((r) => r.error).length;
    console.log(
      `Done: ${ok} scraped successfully${errCount ? `, ${errCount} failed` : ""}.\n`,
    );

    await startServer(results);
  }
} catch (err) {
  console.error("❌  Failed:", err.message);
  process.exit(1);
}
