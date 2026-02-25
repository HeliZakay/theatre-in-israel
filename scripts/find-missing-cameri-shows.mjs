#!/usr/bin/env node
/**
 * find-missing-cameri-shows.mjs
 *
 * Combines list-cameri-shows.mjs & get-cameri-show.mjs to:
 *   1. Scrape the Cameri Theatre schedule page for all show titles + URLs
 *   2. Filter out shows already in the database
 *   3. Scrape each missing show's detail page for title, duration & description
 *   4. Generate a one-sentence Hebrew summary using AI (GitHub Models)
 *   5. Output the extracted details
 *
 * Usage:
 *   node scripts/find-missing-cameri-shows.mjs                # interactive: scrape, approve & insert
 *   node scripts/find-missing-cameri-shows.mjs --json          # JSON output
 *   node scripts/find-missing-cameri-shows.mjs --db            # DB-ready JSON (matches schema)
 *   node scripts/find-missing-cameri-shows.mjs --html          # HTML report (opens in browser)
 *   node scripts/find-missing-cameri-shows.mjs --env=.env.production.local
 */

import dotenv from "dotenv";
import fs from "fs";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";
import OpenAI from "openai";
import sharp from "sharp";
import { writeFile, access } from "fs/promises";
import { checkbox, confirm } from "@inquirer/prompts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");
const PUBLIC_DIR = path.join(rootDir, "public");

// ── CLI flags ───────────────────────────────────────────────────
const envFlag = process.argv.find((a) => a.startsWith("--env="));
const envFile = envFlag ? envFlag.split("=")[1] : ".env.local";
dotenv.config({ path: path.join(rootDir, envFile) });

const jsonMode = process.argv.includes("--json");
const dbMode = process.argv.includes("--db");
const htmlMode = process.argv.includes("--html");

const CAMERI_THEATRE = "תיאטרון הקאמרי";
const CAMERI_BASE = "https://www.cameri.co.il";
const SCHEDULE_URL =
  "https://www.cameri.co.il/%D7%9C%D7%95%D7%97_%D7%94%D7%A6%D7%92%D7%95%D7%AA_%D7%9E%D7%9C%D7%90";

// Small delay between scraping individual show pages (ms)
const POLITE_DELAY = 1500;

// ── AI configuration ────────────────────────────────────────────
const AI_MODEL = "gpt-4o-mini";
const AI_ENDPOINT = "https://models.inference.ai.azure.com";

// Known genres from the existing dataset — AI should prefer these
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

// ── helpers ─────────────────────────────────────────────────────

/** Normalise a title for comparison: trim + collapse whitespace */
function normalise(title) {
  return title.trim().replace(/\s+/g, " ");
}

function generateSlug(title) {
  return title
    .trim()
    .replace(/\s+/g, "-")
    .replace(/'/g, "\u05F3")
    .replace(/[?#%|\\/:*"<>]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Download an image from a URL, convert to .webp, and save to public/.
 * Never overwrites existing images. Returns "success" | "skipped" | "failed".
 */
async function downloadAndConvert(title, url) {
  const slug = generateSlug(title);
  const outPath = path.join(PUBLIC_DIR, `${slug}.webp`);

  if (await fileExists(outPath)) {
    return "skipped";
  }

  try {
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Referer: "https://www.cameri.co.il/",
    };

    const res = await fetch(url, { headers });
    if (!res.ok) return "failed";

    const buffer = Buffer.from(await res.arrayBuffer());
    const webpBuffer = await sharp(buffer).webp({ quality: 80 }).toBuffer();
    await writeFile(outPath, webpBuffer);
    return "success";
  } catch {
    return "failed";
  }
}

// ── Display helpers ──────────────────────────────────────────────
// Uses Unicode bidi isolates (RLI / PDI) to ensure Hebrew text
// renders correctly in terminals despite surrounding ANSI/LTR context.

const SEP_W = 60;

// Unicode bidi isolates — wrapping Hebrew in these tells the terminal
// to render the enclosed text as RTL without affecting the rest of the line.
const RLI = "\u2067"; // Right-to-Left Isolate
const PDI = "\u2069"; // Pop Directional Isolate

/** Wrap a string in RTL isolate if it contains Hebrew characters. */
function bidi(s) {
  if (!s) return s;
  const str = String(s);
  // Check if the string contains Hebrew characters (Unicode block \u0590-\u05FF)
  if (/[\u0590-\u05FF]/.test(str)) {
    return `${RLI}${str}${PDI}`;
  }
  return str;
}

// ANSI helpers
const bold = (s) => `\x1b[1m${s}\x1b[22m`;
const dim = (s) => `\x1b[2m${s}\x1b[22m`;
const cyan = (s) => `\x1b[36m${s}\x1b[39m`;
const yellow = (s) => `\x1b[33m${s}\x1b[39m`;
const green = (s) => `\x1b[32m${s}\x1b[39m`;
const red = (s) => `\x1b[31m${s}\x1b[39m`;
const bgCyan = (s) => `\x1b[46m\x1b[30m ${s} \x1b[0m`;

function printField(label, value) {
  if (!value && value !== 0) return;
  console.log(`  ${yellow(label)}  ${bidi(value)}`);
}

function printMultiLine(label, text) {
  if (!text) return;
  console.log(`  ${yellow(label)}`);
  for (const line of String(text).split("\n")) {
    if (line.trim()) console.log(`    ${bidi(line.trim())}`);
  }
}

function printResultsTable(results) {
  for (let i = 0; i < results.length; i++) {
    const show = results[i];
    const dur = show.durationMinutes
      ? show.durationMinutes + " minutes"
      : "N/A";
    const genres =
      show.genre && show.genre.length > 0 ? bidi(show.genre.join(", ")) : "N/A";

    console.log();
    console.log(dim("=".repeat(SEP_W)));
    console.log(bgCyan(`#${i + 1}`) + "  " + bold(bidi(show.title)));
    console.log(dim("=".repeat(SEP_W)));
    printField("slug", show.slug);
    printField("theatre", show.theatre);
    printField("duration", dur);
    printField("genres", genres);
    console.log(dim("-".repeat(SEP_W)));
    if (show.summary) {
      printField("summary", show.summary);
      console.log(dim("-".repeat(SEP_W)));
    }
    if (show.description) {
      printMultiLine("description", show.description);
      console.log(dim("-".repeat(SEP_W)));
    }
    printField("URL", dim(show.url));
    if (show.imageUrl) {
      const statusIcon =
        show.imageStatus === "success"
          ? "✅"
          : show.imageStatus === "skipped"
            ? "⏭️"
            : "❌";
      printField("image", `${statusIcon}  ${dim(show.imageUrl)}`);
    } else {
      printField("image", red("not found"));
    }
    if (show.error) {
      console.log(`  ${red("ERROR:")}  ${show.error}`);
    }
  }
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
  const cards = results
    .map((show, i) => {
      const dur = show.durationMinutes
        ? `${show.durationMinutes} דקות`
        : "לא צוין";
      const genres =
        show.genre && show.genre.length > 0
          ? show.genre
              .map((g) => `<span class="tag">${esc(g)}</span>`)
              .join(" ")
          : "—";
      const desc = show.description
        ? esc(show.description).replace(/\n/g, "<br>")
        : "—";
      const errorRow = show.error
        ? `<tr><td class="label">שגיאה</td><td class="error">${esc(show.error)}</td></tr>`
        : "";

      const imgHtml = show.imageUrl
        ? `<img class="card-img" src="${esc(show.imageUrl)}" alt="${esc(show.title)}" />`
        : `<div class="card-img card-img-placeholder">🎭</div>`;

      return `
      <div class="card">
        <div class="card-header">
          <span class="num">#${i + 1}</span>
          <span class="title">${esc(show.title)}</span>
        </div>
        ${imgHtml}
        <table>
          <tr><td class="label">slug</td><td dir="ltr" class="ltr">${esc(show.slug)}</td></tr>
          <tr><td class="label">תיאטרון</td><td>${esc(show.theatre)}</td></tr>
          <tr><td class="label">משך</td><td>${esc(dur)}</td></tr>
          <tr><td class="label">ז'אנרים</td><td>${genres}</td></tr>
          <tr><td class="label">תקציר</td><td>${esc(show.summary || "—")}</td></tr>
          <tr><td class="label">תיאור</td><td class="desc">${desc}</td></tr>
          <tr><td class="label">URL</td><td dir="ltr" class="ltr"><a href="${esc(show.url)}" target="_blank">${esc(show.url)}</a></td></tr>
          ${errorRow}
        </table>
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
      padding: 2rem;
      direction: rtl;
    }
    h1 {
      text-align: center;
      font-size: 1.8rem;
      margin-bottom: 0.3rem;
      color: #38bdf8;
    }
    .subtitle {
      text-align: center;
      color: #64748b;
      margin-bottom: 2rem;
      font-size: 0.9rem;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      margin-bottom: 1.5rem;
      overflow: hidden;
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
    }
    .card-header {
      background: linear-gradient(135deg, #0ea5e9, #6366f1);
      padding: 1rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .num {
      background: rgba(0,0,0,0.3);
      color: #fff;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
      font-size: 0.85rem;
    }
    .title {
      font-size: 1.3rem;
      font-weight: 700;
      color: #fff;
    }
    .card-img {
      width: 100%;
      max-height: 300px;
      object-fit: cover;
      display: block;
    }
    .card-img-placeholder {
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 3rem;
      background: #0f172a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    tr { border-bottom: 1px solid #334155; }
    tr:last-child { border-bottom: none; }
    td { padding: 0.7rem 1.5rem; vertical-align: top; }
    td.label {
      width: 100px;
      color: #94a3b8;
      font-weight: 600;
      white-space: nowrap;
    }
    td.ltr { direction: ltr; text-align: left; word-break: break-all; }
    td.desc { line-height: 1.7; }
    td.error { color: #f87171; }
    .tag {
      display: inline-block;
      background: #334155;
      color: #38bdf8;
      padding: 0.15rem 0.6rem;
      border-radius: 999px;
      font-size: 0.85rem;
      margin: 0.1rem;
    }
    a { color: #38bdf8; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>🎭 הצגות חסרות - תיאטרון הקאמרי</h1>
  <p class="subtitle">${esc(now)} &middot; ${results.length} הצגות</p>
  ${cards}
</body>
</html>`;
}

// ── schedule page scraper ───────────────────────────────────────

/**
 * Scrape the Cameri schedule page.
 * Returns an array of { title, url } with deduplicated titles,
 * sorted alphabetically in Hebrew.
 */
async function fetchShowList(browser) {
  const page = await browser.newPage();

  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const type = req.resourceType();
    if (["image", "stylesheet", "font", "media"].includes(type)) {
      req.abort();
    } else {
      req.continue();
    }
  });

  await page.goto(SCHEDULE_URL, { waitUntil: "networkidle2", timeout: 30_000 });
  await page.waitForSelector('a[href*="show_"]', { timeout: 15_000 });

  const shows = await page.evaluate((base) => {
    const map = new Map(); // title → url (dedup by title)
    document.querySelectorAll('a[href*="/show_"]').forEach((a) => {
      let text = a.textContent.trim();
      if (!text) return;
      if (text.includes("לפרטים ותאריכים")) return;
      text = text.replace(/^חדש\s+/, "");

      if (!map.has(text)) {
        // Build absolute URL
        const href = a.getAttribute("href") || "";
        const url = href.startsWith("http") ? href : `${base}${href}`;
        map.set(text, url);
      }
    });
    return [...map.entries()].map(([title, url]) => ({ title, url }));
  }, CAMERI_BASE);

  await page.close();

  // Sort alphabetically in Hebrew
  return shows.sort((a, b) => a.title.localeCompare(b.title, "he"));
}

// ── detail page scraper ─────────────────────────────────────────

/**
 * Scrape a single Cameri show detail page.
 * Returns { title, durationMinutes, description }.
 */
async function scrapeShowDetails(browser, url) {
  const page = await browser.newPage();

  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const type = req.resourceType();
    if (["stylesheet", "font", "media"].includes(type)) {
      req.abort();
    } else {
      req.continue();
    }
  });

  await page.goto(url, { waitUntil: "networkidle2", timeout: 30_000 });
  await page.waitForSelector("h1", { timeout: 15_000 });

  const data = await page.evaluate(() => {
    // ── Title ──
    const h1 = document.querySelector("h1");
    let title = h1 ? h1.textContent.trim() : "";
    title = title.replace(/^חדש\s+/, "");

    // ── Duration ──
    let durationMinutes = null;
    const body = document.body.innerText;
    const durationMatch = body.match(/משך ההצגה:\s*(\d+)\s*דקות/);
    if (durationMatch) {
      durationMinutes = parseInt(durationMatch[1], 10);
    }

    // ── Description ──
    let description = "";
    const aboutMarker = "על ההצגה";
    const stopMarkers = ["צוות ושחקנים", "משך ההצגה", "גלריית תמונות"];
    const aboutIdx = body.indexOf(aboutMarker);
    if (aboutIdx !== -1) {
      let rest = body.slice(aboutIdx + aboutMarker.length).trim();
      let endIdx = rest.length;
      for (const marker of stopMarkers) {
        const idx = rest.indexOf(marker);
        if (idx !== -1 && idx < endIdx) endIdx = idx;
      }
      description = rest
        .slice(0, endIdx)
        .trim()
        .replace(/\n{3,}/g, "\n\n")
        .replace(/\*צילום:.*$/gm, "")
        .replace(/^\*[^\n]*$/gm, "")
        .replace(/תכניה/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    }

    // ── Image URL ──
    let imageUrl = null;

    // Strategy 1: og:image meta tag
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) {
      const content = ogImage.getAttribute("content");
      if (content) imageUrl = content;
    }

    // Strategy 2: twitter:image meta tag
    if (!imageUrl) {
      const twitterImage = document.querySelector('meta[name="twitter:image"]');
      if (twitterImage) {
        const content = twitterImage.getAttribute("content");
        if (content) imageUrl = content;
      }
    }

    // Strategy 3: prdPics images (Cameri CDN pattern)
    if (!imageUrl) {
      const imgs = Array.from(document.querySelectorAll("img"));
      for (const img of imgs) {
        const src = img.src || img.dataset?.src || "";
        if (src.includes("prdPics")) {
          imageUrl = src;
          break;
        }
      }
    }

    // Strategy 4: First large visible image (skip logos/icons)
    if (!imageUrl) {
      const imgs = Array.from(document.querySelectorAll("img"));
      for (const img of imgs) {
        const src = img.src || img.dataset?.src || "";
        if (
          !src ||
          src.includes("logo") ||
          src.includes("icon") ||
          src.includes("facebook") ||
          src.includes("instagram")
        )
          continue;
        const rect = img.getBoundingClientRect();
        if (rect.width > 200 && rect.height > 100) {
          imageUrl = src;
          break;
        }
      }
    }

    // Strategy 5: Background image in hero/banner section
    if (!imageUrl) {
      const heroSelectors = [
        ".hero",
        ".show-hero",
        ".banner",
        ".header-image",
        '[class*="hero"]',
        '[class*="banner"]',
      ];
      for (const selector of heroSelectors) {
        const el = document.querySelector(selector);
        if (el) {
          const bg = getComputedStyle(el).backgroundImage;
          const match = bg.match(/url\(["']?(.*?)["']?\)/);
          if (match) {
            imageUrl = match[1];
            break;
          }
        }
      }
    }

    return { title, durationMinutes, description, imageUrl };
  });

  // Fix double-protocol URLs
  if (data.imageUrl) {
    const doubleProtoIdx = data.imageUrl.indexOf("https://", 8);
    if (doubleProtoIdx > 0) {
      data.imageUrl = data.imageUrl.substring(doubleProtoIdx);
    }
  }

  await page.close();
  return data;
}

// ── AI description processing ───────────────────────────────────

/**
 * Create an OpenAI client pointed at GitHub Models.
 * Returns null if GITHUB_TOKEN is not set.
 */
function createAIClient() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;
  return new OpenAI({ baseURL: AI_ENDPOINT, apiKey: token });
}

/**
 * Clean a scraped description and generate a summary in a single AI call.
 * Returns { description, summary }.
 * Falls back to { description: rawDescription, summary: "" } on failure.
 */
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
  } catch (err) {
    return fallback;
  }
}

/**
 * Classify genres for all scraped shows in a single batch AI call.
 * Prefers existing genres but can create new ones when appropriate.
 * Mutates `results` in-place, adding a `genre` array to each entry.
 */
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

    // Apply genres to results
    for (const r of validResults) {
      const genres = genreMap.get(normalise(r.title));
      if (genres && genres.length > 0) {
        r.genre = genres;
      }
    }
  } catch (err) {
    // Silently fall back — genres remain unset (will default to [])
    if (!jsonMode && !dbMode) {
      console.warn(`  ⚠️  Genre classification failed: ${err.message}`);
    }
  }
}

// ── DB lookup ───────────────────────────────────────────────────

/**
 * Fetch existing Cameri show titles from the database.
 * Returns a Set of normalised titles, or null if DB is unavailable.
 */
async function fetchExistingTitles() {
  const db = await createPrismaClient();
  if (!db) return null;

  try {
    const shows = await db.prisma.show.findMany({
      where: { theatre: CAMERI_THEATRE },
      select: { title: true },
    });
    return new Set(shows.map((s) => normalise(s.title)));
  } finally {
    await db.prisma.$disconnect();
    await db.pool.end();
  }
}

async function createPrismaClient() {
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

async function insertShowsToDB(selectedShows) {
  const db = await createPrismaClient();
  if (!db) {
    console.error(red("  ✗ DATABASE_URL not set — cannot insert shows."));
    return { added: 0, skipped: 0, failed: 0 };
  }

  const { prisma, pool } = db;
  let added = 0;
  let skipped = 0;
  let failed = 0;

  try {
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
        console.log(green(`  ✓ Added: `) + bidi(show.title));
      } catch (err) {
        if (err.code === "P2002") {
          skipped++;
          console.log(
            yellow(`  ⏭ Skipped (already exists): `) + bidi(show.title),
          );
        } else {
          failed++;
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

  return { added, skipped, failed };
}

// ── main ────────────────────────────────────────────────────────

try {
  // 1. DB lookup (in parallel with nothing — starts early)
  const existingSet = await fetchExistingTitles();
  const hasDb = existingSet !== null;

  // AI client for summary generation
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
  const browser = await puppeteer.launch({ headless: true });

  let allShows;
  try {
    allShows = await fetchShowList(browser);
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

  // 4b. Classify genres for all shows in a single batch AI call
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
    // DB-ready format: matches Prisma Show model + genre array
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
    const html = generateHtml(results);
    const outPath = path.join(rootDir, "missing-cameri-shows.html");
    fs.writeFileSync(outPath, html, "utf-8");
    console.log(`\n📄  Report saved to ${outPath}`);
    // Open in default browser
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
  } else {
    // Always generate and open HTML report (Hebrew renders poorly in terminal)
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

    const ok = results.filter((r) => !r.error).length;
    const errCount = results.filter((r) => r.error).length;
    console.log(
      `Done: ${ok} scraped successfully${errCount ? `, ${errCount} failed` : ""}.\n`,
    );

    // Interactive approval + DB insertion
    const validResults = results.filter((r) => !r.error);
    if (validResults.length > 0 && hasDb && process.stdout.isTTY) {
      const selected = await checkbox({
        message: "Select shows to insert into the database:",
        choices: validResults.map((show) => ({
          name: `${show.title}  ${dim("(" + (show.genre || []).join(", ") + ")")}`,
          value: show,
          checked: true,
        })),
      });

      if (selected.length === 0) {
        console.log(dim("\n  No shows selected — skipping insertion.\n"));
      } else {
        const proceed = await confirm({
          message: `Insert ${selected.length} show(s) into the database?`,
          default: true,
        });

        if (proceed) {
          console.log();
          const { added, skipped, failed } = await insertShowsToDB(selected);
          console.log(
            `\n  📊  Summary: ${green(added + " added")}${skipped ? ", " + yellow(skipped + " skipped") : ""}${failed ? ", " + red(failed + " failed") : ""}\n`,
          );
        } else {
          console.log(dim("\n  Cancelled — no shows inserted.\n"));
        }
      }
    }
  }
} catch (err) {
  console.error("❌  Failed:", err.message);
  process.exit(1);
}
