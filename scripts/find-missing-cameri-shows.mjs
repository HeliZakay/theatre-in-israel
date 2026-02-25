#!/usr/bin/env node
/**
 * find-missing-cameri-shows.mjs
 *
 * Scrapes the Cameri Theatre schedule, finds shows not yet in the
 * database, scrapes details, generates AI summaries, downloads images,
 * and optionally inserts approved shows into the DB.
 *
 * Usage:
 *   node scripts/find-missing-cameri-shows.mjs                # interactive
 *   node scripts/find-missing-cameri-shows.mjs --json          # JSON output
 *   node scripts/find-missing-cameri-shows.mjs --db            # DB-ready JSON
 *   node scripts/find-missing-cameri-shows.mjs --html          # HTML report
 *   node scripts/find-missing-cameri-shows.mjs --env=.env.production.local
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
import {
  normalise,
  createPrismaClient,
  fetchExistingTitles,
} from "./lib/db.mjs";
import { bidi, yellow, green, red } from "./lib/cli.mjs";

// ── Setup ───────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

const envFlag = process.argv.find((a) => a.startsWith("--env="));
const envFile = envFlag ? envFlag.split("=")[1] : ".env.local";
dotenv.config({ path: path.join(rootDir, envFile) });

const jsonMode = process.argv.includes("--json");
const dbMode = process.argv.includes("--db");
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
          ${!hasError ? `<button class="insert-btn" onclick="insertShow(${i})">הוסף למסד נתונים</button>` : ""}
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
    .insert-btn {
      background: linear-gradient(135deg, #0ea5e9, #6366f1);
      color: #fff; border: none; border-radius: 8px;
      padding: 0.6rem 1.5rem; font-size: 0.95rem; font-weight: 700;
      cursor: pointer; display: block; margin: 0.75rem auto 0; font-family: inherit;
    }
    .insert-btn:hover { filter: brightness(1.15); }
    .insert-btn:disabled { opacity: 0.5; cursor: not-allowed; background: #475569; filter: none; }

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
    <button class="bulk-btn" id="bulk-btn" onclick="insertBulk()">הוסף נבחרים (${validCount})</button>
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
      btn.textContent = "הוסף נבחרים (" + indices.length + ")";
      btn.disabled = indices.length === 0;
    }

    function markInserted(idx) {
      var card = document.querySelector(".card[data-index='" + idx + "']");
      card.classList.add("inserted");
      var btn = card.querySelector(".insert-btn");
      if (btn) { btn.disabled = true; }
      var cb = card.querySelector(".card-checkbox");
      if (cb) { cb.checked = false; cb.disabled = true; }
      var header = card.querySelector(".card-header");
      if (!header.querySelector(".success-badge")) {
        var badge = document.createElement("span");
        badge.className = "success-badge";
        badge.textContent = "\\u2713 נוסף";
        header.appendChild(badge);
      }
      updateBulkCount();
    }

    function insertShow(idx) {
      var card = document.querySelector(".card[data-index='" + idx + "']");
      var btn = card.querySelector(".insert-btn");
      var statusEl = card.querySelector(".card-status");
      btn.disabled = true;
      btn.textContent = "מוסיף...";
      statusEl.innerHTML = "";

      var data = getCardData(idx);

      fetch("/api/insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shows: [data] })
      })
      .then(function(res) {
        return res.json().then(function(body) { return { ok: res.ok, body: body }; });
      })
      .then(function(result) {
        if (!result.ok) {
          statusEl.innerHTML = '<span class="status-error">\\u274c ' + (result.body.error || "שגיאה בהוספה") + "</span>";
          btn.disabled = false;
          btn.textContent = "הוסף למסד נתונים";
          return;
        }
        var r = result.body.results ? result.body.results[0] : result.body;
        if (r.status === "skipped") {
          statusEl.innerHTML = '<span class="status-skipped">\\u23ed כבר קיים</span>';
          markInserted(idx);
        } else {
          statusEl.innerHTML = '<span class="status-success">\\u2705 נוסף בהצלחה</span>';
          markInserted(idx);
        }
      })
      .catch(function(err) {
        statusEl.innerHTML = '<span class="status-error">\\u274c ' + err.message + "</span>";
        btn.disabled = false;
        btn.textContent = "הוסף למסד נתונים";
      });
    }

    function insertBulk() {
      var indices = getCheckedIndices();
      if (indices.length === 0) return;

      var bulkBtn = document.getElementById("bulk-btn");
      var bulkStatus = document.getElementById("bulk-status");
      bulkBtn.disabled = true;
      bulkBtn.textContent = "מוסיף...";
      bulkStatus.innerHTML = "";

      var shows = indices.map(function(idx) { return getCardData(idx); });

      fetch("/api/insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shows: shows })
      })
      .then(function(res) {
        return res.json().then(function(body) { return { ok: res.ok, body: body }; });
      })
      .then(function(result) {
        if (!result.ok) {
          bulkStatus.innerHTML = '<span class="status-error">\\u274c ' + (result.body.error || "שגיאה בהוספה") + "</span>";
          bulkBtn.disabled = false;
          updateBulkCount();
          return;
        }
        var results = result.body.results || [];
        var added = 0, skipped = 0, failed = 0;
        results.forEach(function(r, i) {
          var idx = indices[i];
          var card = document.querySelector(".card[data-index='" + idx + "']");
          var statusEl = card.querySelector(".card-status");
          if (r.status === "skipped") {
            statusEl.innerHTML = '<span class="status-skipped">\\u23ed כבר קיים</span>';
            markInserted(idx);
            skipped++;
          } else if (r.status === "failed") {
            statusEl.innerHTML = '<span class="status-error">\\u274c ' + (r.error || "שגיאה") + "</span>";
            failed++;
          } else {
            statusEl.innerHTML = '<span class="status-success">\\u2705 נוסף בהצלחה</span>';
            markInserted(idx);
            added++;
          }
        });
        var summary = "";
        if (added) summary += '<span class="status-success">' + added + " נוספו</span> ";
        if (skipped) summary += '<span class="status-skipped">' + skipped + " כבר קיימים</span> ";
        if (failed) summary += '<span class="status-error">' + failed + " נכשלו</span>";
        bulkStatus.innerHTML = summary;
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
    if (!jsonMode && !dbMode) {
      console.warn(`  ⚠️  Genre classification failed: ${err.message}`);
    }
  }
}

// ── DB insertion ────────────────────────────────────────────────

async function insertShowsToDB(selectedShows) {
  const db = await createPrismaClient();
  if (!db) {
    console.error(red("  ✗ DATABASE_URL not set — cannot insert shows."));
    return { added: 0, skipped: 0, failed: 0, details: [] };
  }

  const { prisma, pool } = db;
  let added = 0;
  let skipped = 0;
  let failed = 0;
  const details = [];

  try {
    // Normalise genre: accept comma-separated strings from the HTML form
    for (const show of selectedShows) {
      if (typeof show.genre === "string") {
        show.genre = show.genre
          .split(",")
          .map((g) => g.trim())
          .filter(Boolean);
      }
    }

    // Upsert all genres first
    const genreNames = new Set();
    for (const show of selectedShows) {
      for (const g of show.genre || []) {
        if (g) genreNames.add(g);
      }
    }

    const genreMap = new Map();
    for (const name of genreNames) {
      const genre = await prisma.genre.upsert({
        where: { name },
        update: {},
        create: { name },
      });
      genreMap.set(name, genre.id);
    }

    // Insert each show
    for (const show of selectedShows) {
      const genreCreates = (show.genre || [])
        .map((name) => genreMap.get(name))
        .filter(Boolean)
        .map((genreId) => ({ genre: { connect: { id: genreId } } }));

      try {
        await prisma.show.create({
          data: {
            title: show.title,
            slug: show.slug,
            theatre: show.theatre,
            durationMinutes: show.durationMinutes ?? 0,
            summary: show.summary,
            description: show.description ?? null,
            genres: { create: genreCreates },
          },
        });
        added++;
        details.push({ title: show.title, status: "added" });
        console.log(green(`  ✓ Added: `) + bidi(show.title));
      } catch (err) {
        if (err.code === "P2002") {
          skipped++;
          details.push({ title: show.title, status: "skipped" });
          console.log(
            yellow(`  ⏭ Skipped (already exists): `) + bidi(show.title),
          );
        } else {
          failed++;
          details.push({
            title: show.title,
            status: "failed",
            error: err.message,
          });
          console.log(
            red(`  ✗ Failed: `) + bidi(show.title) + ` — ${err.message}`,
          );
        }
      }
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }

  return { added, skipped, failed, details };
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

async function startServer(results, hasDb) {
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

    // ── POST /api/insert — insert shows into the DB ──
    if (req.method === "POST" && req.url === "/api/insert") {
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

        if (!hasDb) {
          res.writeHead(503);
          res.end(JSON.stringify({ error: "DATABASE_URL not configured" }));
          return;
        }

        const { added, skipped, failed, details } =
          await insertShowsToDB(shows);

        res.writeHead(200);
        res.end(JSON.stringify({ added, skipped, failed, results: details }));
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
      `\n📝  Edit shows and click "Insert" to add them to the database.` +
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
    if (jsonMode || dbMode) {
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

  if (!jsonMode && !dbMode) {
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

    if (!jsonMode && !dbMode) {
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
      if (!jsonMode && !dbMode) console.log("✅");
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
      if (!jsonMode && !dbMode) console.log(`⚠️  ${err.message}`);
    }

    // Be polite — wait between requests (skip after last one)
    if (i < missingShows.length - 1) {
      await sleep(POLITE_DELAY);
    }
  }

  // 4b. Classify genres
  if (aiClient && results.some((r) => !r.error)) {
    if (!jsonMode && !dbMode) {
      process.stdout.write("\n  🏷️  Classifying genres… ");
    }
    await classifyGenres(aiClient, results);
    if (!jsonMode && !dbMode) {
      console.log("✅");
    }
  }

  await browser.close();

  // 5. Output results
  if (dbMode) {
    const dbResults = results
      .filter((r) => !r.error)
      .map((r) => ({
        title: r.title,
        slug: r.slug,
        theatre: r.theatre,
        durationMinutes: r.durationMinutes ?? 0,
        summary: r.summary,
        description: r.description ?? null,
        genre: r.genre || [],
      }));
    console.log(JSON.stringify(dbResults, null, 2));
  } else if (jsonMode) {
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

    await startServer(results, hasDb);
  }
} catch (err) {
  console.error("❌  Failed:", err.message);
  process.exit(1);
}
