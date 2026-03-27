/**
 * ai.mjs — AI-powered description processing and genre classification.
 *
 * Exports:
 *   createAIClient()
 *   processDescriptions(aiClient, results, opts)
 *   classifyGenres(aiClient, results, opts)
 */

import OpenAI from "openai";
import { normalise } from "./db.mjs";

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

export function createAIClient() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;
  return new OpenAI({ baseURL: AI_ENDPOINT, apiKey: token });
}

export async function processDescriptions(
  aiClient,
  results,
  { quiet = false } = {},
) {
  const BATCH_SIZE = 7;
  const validResults = results.filter((r) => !r.error && r.rawDescription);
  if (!aiClient || validResults.length === 0) return;

  // Process in batches of BATCH_SIZE
  for (let start = 0; start < validResults.length; start += BATCH_SIZE) {
    const batch = validResults.slice(start, start + BATCH_SIZE);

    const showList = batch
      .map(
        (r, i) =>
          `${i + 1}. שם: ${r.title}\n   טקסט גולמי:\n${r.rawDescription.slice(0, 1500)}`,
      )
      .join("\n\n");

    try {
      const response = await aiClient.chat.completions.create({
        model: AI_MODEL,
        temperature: 0.4,
        max_tokens: 5000,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: [
              "אתה עורך תיאורי הצגות תיאטרון בעברית. עבור כל הצגה, בצע שתי משימות:",
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
              'החזר JSON בפורמט: { "shows": [{ "title": "שם ההצגה", "description": "התיאור הנקי", "summary": "התקציר" }] }',
              "ללא הערות או הסברים נוספים.",
            ].join("\n"),
          },
          {
            role: "user",
            content: `עבד את התיאורים עבור ההצגות הבאות:\n\n${showList}`,
          },
        ],
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) continue;

      const parsed = JSON.parse(content);
      const descMap = new Map();

      if (Array.isArray(parsed.shows)) {
        for (const entry of parsed.shows) {
          if (entry.title) {
            descMap.set(normalise(entry.title), {
              description: entry.description?.trim() || null,
              summary: entry.summary?.trim() || "",
            });
          }
        }
      }

      for (const r of batch) {
        const match = descMap.get(normalise(r.title));
        if (match) {
          r.description = match.description || r.rawDescription;
          r.summary = match.summary;
        }
      }
    } catch (err) {
      if (!quiet) {
        console.warn(`  ⚠️  Description processing failed: ${err.message}`);
      }
    }
  }
}

export async function classifyGenres(
  aiClient,
  results,
  { quiet = false } = {},
) {
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
    if (!quiet) {
      console.warn(`  ⚠️  Genre classification failed: ${err.message}`);
    }
  }
}
