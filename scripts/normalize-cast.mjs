#!/usr/bin/env node
/**
 * normalize-cast.mjs — transforms the `cast` column so it contains
 * ONLY actor/performer names in the format:
 *   name1/name2, name3, name4/name5, name6
 * where "/" means "name2 replaces name1".
 *
 * All technical/creative credits (director, set design, lighting, etc.)
 * are stripped. Character-name labels are stripped. Noise (footer text,
 * acknowledgments, photo credits) is removed.
 *
 * Usage:
 *   node scripts/normalize-cast.mjs                   # dry-run preview (default)
 *   node scripts/normalize-cast.mjs --generate-sql    # write SQL migration file
 *   node scripts/normalize-cast.mjs --apply           # apply directly to DB
 */

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createPrismaClient } from "./lib/db.mjs";

dotenv.config({ path: ".env.local", override: true });
dotenv.config({ path: ".env" });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

// ═══════════════════════════════════════════════════════════════
// NON-ACTOR ROLE LABELS (Hebrew)
// Any line whose label (text before ":") matches one of these
// is considered a technical/creative credit and will be SKIPPED.
// ═══════════════════════════════════════════════════════════════

const NON_ACTOR_LABELS = new Set([
  // Writing / authorship
  "מאת",
  "מחזה מאת",
  "מחזה",
  "על פי ספרו של",
  "על פי ספרם של",
  "על פי",
  "עיבוד",
  "גרסה",
  'ע"פ ספרו של',
  'ע"פ',
  "על פי הספר",
  "כתיבה",

  // Direction
  "בימוי",
  "מאת ובבימוי",
  "עיבוד ובימוי",
  "בימוי הגרסה מחודשת",
  "במאי",
  "במאית",
  "במאית משנה",
  "במאי משנה",

  // Set / space design
  "תפאורה",
  "עיצוב תפאורה",
  "עיצוב חלל",
  "עיצוב חלל ותלבושות",
  "עיצוב חלל ותאורה",
  "תפאורה בפועל",
  "עיצוב במה",
  "עיצוב חלל, תאורה ותלבושות",
  "עיצוב תפאורה ותלבושות",
  "תפאורה ותלבושות",
  "תפאורה, תלבושות, מסכת אריה",
  "עיצוב במה ותלבושות",

  // Lighting
  "תאורה",
  "עיצוב תאורה",
  "עיצוב אור",
  "תכנות תאורה",

  // Costumes
  "תלבושות",
  "עיצוב תלבושות",
  "הלבשה וסטיילינג",
  "הלבשה",
  "סטיילינג",
  "ע. תלבושות ותפאורה",
  "ע. מעצבת תלבושות",
  "ע. מעצב תפאורה",
  "עוזרת למעצבת",

  // Music / sound
  "מוסיקה",
  "מוזיקה",
  "מוסיקה מקורית",
  "מוזיקה מקורית",
  "הלחנה",
  "מלחין",
  "לחנים",
  "עריכה מוסיקלית",
  "עריכת מוסיקה",
  "ניהול מוסיקלי",
  "ניהול מוזיקלי",
  "ניהול מוסיקלי ועיבודים",
  "ניהול מוסיקאלי ועיבודים",
  "ניהול מוזיקלי ומשחק",
  "עיצוב סאונד",
  "סאונד",
  "לחנים ופסנתר",
  "עיצוב מוזיקאלי",
  "ניהול מוסיקלי ומנצח",
  "ניהול מוסיקאלי ועיבודים",
  "ייעוץ מוזיקלי",
  "ייעוץ מוסיקלי",

  // Movement / choreography
  "כוריאוגרפיה",
  "תנועה",
  "עיצוב תנועה",
  "ע. כוריאוגרף",

  // Translation
  "תרגום",
  "נוסח עברי",
  "תרגום ועריכה מוזיקלית",
  "תרגום ועריכה",

  // Dramaturgy / artistic guidance
  "דרמטורגיה",
  "ליווי אמנותי",
  "ליווי אומנותי",
  "ליווי וניהול אומנותי",
  "ליווי וניהול אמנותי",
  "ליווי כתיבה",
  "ייעוץ",
  "ייעוץ כתיבה",
  "ייעוץ קונספט",
  "ייעוץ סאונד",
  "ייעוץ תאורה",
  "ייעוץ עיצוב תלבושות",
  "יעוץ עיצוב תלבושות",

  // Assistant director
  "ע. במאי",
  "ע. במאית",
  "עוזרת במאי",
  "עוזר במאי",
  "עוזרת במאית",
  "ע. בימאית",
  "ע. במאי וניהול הצגה",

  // Video
  "עיצוב וידאו",
  "וידאו ארט",
  "וידאו",
  "עיצוב ועריכת וידאו",

  // Photography / poster
  "צילום",
  "צילום תמונה",
  "צילום תמונות",
  "צילום סטילס",
  "צילום ועריכת פוסטר",
  "צילום פוסטר",
  "עיצוב פוסטר",
  "עיצוב גרפי",
  "גרפיקה",

  // Props / wigs
  "פאות",
  "ייצור אביזרים",
  "עיצוב אביזרים, ביגוד וייעוץ אמנותי",
  "עיצוב אביזרים",
  "יצור אביזרים ובמה",

  // Production / stage management
  "מפיק",
  "מפיק בפועל",
  "מפיקה אמנותית",
  "ניהול הצגה",
  "מנהלות הצגה",
  "מנהל אומנותי",

  // Other technical
  "קורפיטיציה",
  "קורפטיציה",
  "קרבות במה",
  "יועץ קסמים ואפקטים",
  "שפה ודיבור",
  "הדרכת טקסט",
  "הדרכה קולית",
  "הדרכת שחקנים",
  "כתוביות",
  "תודות",
  "ע. תלבושות",
  "יועץ לענייני יידיש - תרבות ושפה",
  "עיצוב מזוודה",
  "בימוי ועיבוד",
  "עיצוב תאורה, חלל ותלבושות",
  "תלבושות על פי העיצוב של גלינה ליולי",
  "כוראוגרפיה",
  "פזמונים",
  "מילים לשירים",
  "ניהול מזיקלי ועיבודים",

  // Lessin junk labels
  "לצפייה בתוכניה",
  "להורדת התכנייה",

  // Hebrew Theatre prefix
  "יוצרים",
  "כתיבה ובימוי",
  "כתיבה בימוי וכוראוגרפיה",
  "קלאסיקה ישראלית בבימויו של נתן דטנר",

  // Music-related compound non-actor
  "מוזיקאים Dreamboysudan",
  "מוזיקאים",

  // Beer Sheva no-colon variants
  "מעצבת תלבושות ותפאורה",
  "מעצב תלבושות ותפאורה",
  "מעצב תאורה",
  "מעצבת תאורה",
  "מעצב תנועה",
  "מעצבת תנועה",
  "וידיאו ארט",
  'עפ"י ספרה רב-המכר של',
]);

// ═══════════════════════════════════════════════════════════════
// ACTOR LABELS — lines with these labels contain actor names
// ═══════════════════════════════════════════════════════════════

const ACTOR_LABELS = new Set([
  "שחקנים",
  "בהשתתפות",
  "משתתפים",
  "משחק",
  "בכיכוב",
  "בכיכובם של",
  "בביצוע",
  "שחקנים יוצרים",
  "מבצעות",
  "מבצעים",
  "זמרת",
  "זמר",
  "אנסמבל",
  "מחליפים.ות",
  "מחליף",
  "מחליפה",
  "חברי הלהקה",
  "סווינג",
]);

// ═══════════════════════════════════════════════════════════════
// COMPOUND LABELS — contain both actor AND non-actor roles
// If the label contains one of these actor keywords, include it.
// ═══════════════════════════════════════════════════════════════

const COMPOUND_ACTOR_KEYWORDS = ["משחק", "ביצוע", "כיכוב"];

// ═══════════════════════════════════════════════════════════════
// NOISE PATTERNS — lines matching these are dropped entirely
// ═══════════════════════════════════════════════════════════════

const NOISE_PATTERNS = [
  /^רוצים לראות עוד/,
  /^להורדת התכנייה/,
  /^לצפייה בתוכניה/,
  /^צרו קשר/,
  /^להזמנת מנוי/,
  /^Call Now Button/i,
  /^Created by/i,
  /^Direction:/i,
  /^Cast:/i,
  /^Visual [Ll]anguage/,
  /^Lighting Design/i,
  /^Set & Props/i,
  /^Music:/i,
  /^Photography:/i,
  /^Assistant Director/i,
  /^Stage Management/i,
  /^The (play|performance|show)/i,
  /^It is both/i,
  /^A loving woman/i,
  /^\* בתמיכת/,
  /^בתמיכת/,
  /^בהפקת /,
  /^תודות/,
  /^ההצגה עולה בתמיכת/,
  /^קישור לאלבום/,
  /^https?:\/\//,
  /^יוצרים$/,
  /^יוצרים ושחקנים$/,
  /^יוצרים ומשתתפים$/,
  /^שחקנים$/,
  /^צוות ושחקנים$/,
  /^שחקנים ויוצרים$/,
  /^1-800-/,
  /^0[0-9]-/, // Israeli phone numbers
  /^טלפון/,
  /^\s*$/,
  /^\d{2,}/, // phone numbers, zip codes etc.
  /^לפרטים נוספים/,
  /^[\*⁠]/, // asterisks, zero-width chars
  // Lessin website navigation junk
  /^איך מגיעים/,
  /^שאלות ותשובות/,
  /^תקנון$/,
  /^תנאי שימוש/,
  /^מדיניות פרטיות/,
  /^הצהרת נגישות/,
  /^ארכיון$/,
  /^הצטרפו אלינו/,
  /^כל הזכויות שמורות/,
  /^רכישת מנוי/,
  /^דיזנגוף/,
  /^הכניסה מרח/,
  // Show title patterns in Lessin footer (show listings)
  /^סיפור הפרברים/,
  /^סיור מאחורי/,
  // Long promotional text
  /^"[^"]{40,}"/, // Quoted review text
  // English sentences (not credits)
  /^[A-Z][a-z]{3,}.*[a-z]{4,}/,
  // Music artist names in Latin script that are not Hebrew names
  /^Pan Sonic/,
  /^Pye Corner/,
  /^Mika Vainio/,
  /^Alessandro/,
  /^Hiro Kone/,
  /^Studio Moo/,
  // Tmuna promo/review junk
  /^פנטזיה/,
  /^טור בטיים/,
  /^כתבה על/,
  /^מרב יודילביץ/,
  /^שי בר/,
  /^אנסמבל/,
  /^מומלץ לגילאי/,
  /^כ\d+ ד'/, // duration like "כשעה ורבע"
  /^\d+ ד'/, // "55 ד'"
  /^כשעה/,
  /^הפקת ההצגה/,
  /^המופע נתמך/,
  /^אגודת/,
];

// ═══════════════════════════════════════════════════════════════
// LESSIN NAVIGATION SHOW TITLES — these appear in the scraped
// footer as navigation links and must be filtered OUT of actor names
// ═══════════════════════════════════════════════════════════════

const LESSIN_NAV_TITLES = new Set([
  "בחורים טובים",
  "מלכת היופי של ירושלים",
  "חנאל ומכבית",
  "ליסין צעיר",
  "שוחט בעקבות אמדאוס",
  "סיפור הפרברים – המחזמר",
  "סיפור הפרברים - המחזמר",
  "הכל אודות איב",
  "דתילונים",
  "משחקים בחצר האחורית",
  "קיר זכוכית",
  "שונאים סיפור אהבה",
  "קרנפים",
  "החברות של אלוהים",
  "אור לגויים",
  "אמדאוס",
  "אפס ביחסי אנוש",
  "סיור מאחורי הקלעים",
  "לילה ברומא",
  "אף מילה לאמא",
  "לילה – סיפורה של לילה מוראד",
  "לילה - סיפורה של לילה מוראד",
  "בין קודש לחולון",
  "אמא",
  "שונאים סיפור אהבה",
]);

// ═══════════════════════════════════════════════════════════════
// PARSING HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Split a raw cast string into individual "entries" (one per credit line).
 * Handles all three known formats: newline, //, and |.
 */
function splitIntoEntries(raw) {
  // Normalise line endings
  let text = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // ── Lessin footer cutoff ──
  // Lessin pages include website navigation and footer after the cast data.
  // Cut at the first known footer marker to avoid including junk.
  const lessinCutMarkers = [
    "\nלצפייה בתוכניה",
    "\nלצפייה בתוכנייה",
    "\nתוכנייה",
    "\nצרו קשר",
    "\nלהזמנת מנוי",
    "\nקופה וכרטיסים",
    "\nכל הזכויות שמורות",
    "\nCall Now Button",
    "\nאיך מגיעים אלינו",
    "\nשאלות ותשובות",
    "\nתנאי שימוש",
    "\nמדיניות פרטיות",
    "\nהצהרת נגישות",
  ];
  for (const marker of lessinCutMarkers) {
    const idx = text.indexOf(marker);
    if (idx !== -1) {
      text = text.substring(0, idx);
    }
  }

  // ── Cameri footer cutoff ──
  const cameriFoot = text.indexOf("\nרוצים לראות עוד?");
  if (cameriFoot !== -1) text = text.substring(0, cameriFoot);
  const cameriDownload = text.indexOf("\nלהורדת התכנייה");
  if (cameriDownload !== -1) text = text.substring(0, cameriDownload);

  // ── Tmuna/general junk cutoff ──
  const todot = text.indexOf("\nתודות:");
  if (todot !== -1) text = text.substring(0, todot);
  const todotNoColon = text.indexOf("\nתודות ");
  if (todotNoColon !== -1) text = text.substring(0, todotNoColon);

  // Hebrew Theatre format: "יוצרים: ... \n משתתפים: ..."
  // The "יוצרים:" line uses | between credits, but "משתתפים:" line uses commas
  const hebrewTheatreMatch = text.match(
    /^יוצרים:\s*(.*?)(?:\n|\r|$)\s*(?:משתתפים:\s*(.*))?$/s,
  );
  // Hebrew Theatre יוצרים: line may have labels without colons (e.g., "כתיבה ובימוי גדי צדקה")
  // In the creators line, try to strip known non-actor labels even without colons
  if (hebrewTheatreMatch) {
    // For entries from the creators line that have no colon,
    // check if they start with a known label followed by a name
    const filtered = [];
    for (const entry of [...creatorEntries, ...participantLine]) {
      // Skip noise first
      if (isNoise(entry)) continue;
      filtered.push(entry);
    }
    return filtered;
  }

  // Check if it's a //-separated format (Tmuna style)
  if (text.includes("//")) {
    // Split on // but also handle any \n within segments (e.g., credits + \n + junk)
    const segments = text
      .split("//")
      .map((s) => s.trim())
      .filter(Boolean);
    // Each segment might still have \n — flatten by splitting further
    const result = [];
    for (const seg of segments) {
      // If the segment has newlines, the first line is the credit, rest may be junk
      const subLines = seg
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      // First line is always the credit entry
      if (subLines.length > 0) result.push(subLines[0]);
      // Remaining lines: only include if they look like names (short, Hebrew, no label)
      for (let i = 1; i < subLines.length; i++) {
        // Extra lines after // credits are typically junk (acknowledgments, English, promo)
        // Only add them if they are very short (possible name continuation)
        if (subLines[i].length < 60 && /[\u0590-\u05FF]/.test(subLines[i])) {
          result.push(subLines[i]);
        }
      }
    }
    return result;
  }

  const lines = text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  // Merge multi-line label/value pairs (Lessin format: label on one line, value on next)
  const mergedLines = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // If a line ends with ":" and next line exists and doesn't contain ":",
    // merge them (Lessin multi-line labels)
    if (
      line.endsWith(":") &&
      i + 1 < lines.length &&
      !lines[i + 1].includes(":")
    ) {
      mergedLines.push(`${line} ${lines[i + 1]}`);
      i++; // skip next line
    } else {
      mergedLines.push(line);
    }
  }

  return mergedLines;
}

/**
 * Extract the label from an entry (text before the first colon or dash separator).
 * Returns { label, value } or null if no label found.
 */
function extractLabel(entry) {
  // Try colon-separated first: "label: value"
  const colonMatch = entry.match(/^([^:]+?):\s*(.*)/s);
  if (colonMatch) {
    const label = colonMatch[1].trim();
    const value = colonMatch[2].trim();
    return { label, value };
  }

  // Hebrew Theatre uses dash separator: "בימוי- גדי צדקה"
  const dashMatch = entry.match(
    /^([\u0590-\u05FF][\u0590-\u05FF\s."']+)-\s+(.*)/s,
  );
  if (dashMatch) {
    const label = dashMatch[1].trim();
    const value = dashMatch[2].trim();
    return { label, value };
  }

  // Beer Sheva style: no colon, label is a known prefix followed by space + name
  // e.g., "מחזה מאת איתן ענר", "בימוי תמר קינן"
  const beerShevaMatch = entry.match(
    /^(מחזה מאת|מחזה|מאת ובבימוי|מאת|בימוי|עיצוב תפאורה|עיצוב תלבושות|עיצוב תאורה|עיצוב תנועה|עיצוב סאונד|ליווי אמנותי|מוסיקה|מוזיקה|תפאורה|תלבושות|תאורה|כוריאוגרפיה|תנועה|תרגום|דרמטורגיה|עוזרת במאי|עוזר במאי|צילום|מפיק|ניהול הצגה|מעצבת תלבושות ותפאורה|מעצב תלבושות|מעצב תאורה|מעצבת תאורה|מעצב תנועה|מעצבת תנועה|ידיאו ארט|ע\. במאי|ע\. במאית|סאונד|נגנים|בהשתתפות|משתתפים|שחקנים|משחק)\s+(?!:)(.+)$/s,
  );
  if (beerShevaMatch) {
    const label = beerShevaMatch[1].trim();
    const value = beerShevaMatch[2].trim();
    return { label, value };
  }

  return null;
}

/**
 * Normalise a label for matching: strip quotes, trim.
 */
function normaliseLabel(label) {
  return label
    .replace(/[""״]/g, '"')
    .replace(/[\u05F3\u2019\u02BC]/g, "'")
    .trim();
}

/**
 * Determine if a label is a known non-actor technical credit.
 */
function isNonActorLabel(label) {
  const norm = normaliseLabel(label);
  if (NON_ACTOR_LABELS.has(norm)) return true;

  // Strip parenthetical qualifiers and check again: "מחזה (בהשראת ש. אנ-סקי)" → "מחזה"
  const withoutParens = norm.replace(/\s*\([^)]*\)/g, "").trim();
  if (withoutParens !== norm && NON_ACTOR_LABELS.has(withoutParens))
    return true;

  // Check common patterns
  if (norm.startsWith("ע.")) return true; // Assistant roles (ע. במאי etc.)
  if (norm.startsWith("ע'")) return true;
  if (norm.includes("צילום")) return true;
  if (norm.includes("עיצוב פוסטר")) return true;
  if (norm.includes("עיצוב גרפי")) return true;
  if (norm.includes("תודות")) return true;
  if (norm.includes("תפאורה")) return true;
  if (
    norm.includes("תלבושות") &&
    !norm.includes("משחק") &&
    !norm.includes("ביצוע")
  )
    return true;
  if (
    norm.includes("תאורה") &&
    !norm.includes("משחק") &&
    !norm.includes("ביצוע")
  )
    return true;
  if (norm.includes("מוסיקה") || norm.includes("מוזיקה")) return true;
  if (norm.includes("סאונד")) return true;
  if (norm.includes("וידאו")) return true;
  if (
    norm.includes("בימוי") &&
    !norm.includes("משחק") &&
    !norm.includes("ביצוע") &&
    !norm.includes("כיכוב")
  )
    return true;
  if (norm.includes("מאת") && !norm.includes("משחק") && !norm.includes("ביצוע"))
    return true;
  if (norm.includes("כוריאוגרפיה") || norm.includes("כוראוגרפיה")) return true;
  if (norm.includes("דרמטורגיה")) return true;
  if (norm.includes("תרגום")) return true;
  if (norm.includes("ניהול מוסיק") || norm.includes("ניהול מוזיק")) return true;
  if (norm.includes("עריכה מוסיק") || norm.includes("עריכה מוזיק")) return true;
  if (norm.includes("מעצב") || norm.includes("מעצבת")) return true;
  if (norm.includes("ידיאו")) return true; // typo variant of "וידאו"
  if (norm.includes("קריאייטיב") || norm.includes("קרייאטיב")) return true;
  if (norm.includes("הלחנה") || norm.includes("לחנים")) return true;
  if (norm.includes("ניצוח")) return true; // Musical conducting
  if (
    norm.includes("קלידים") ||
    norm.includes("פסנתר") ||
    norm.includes("גיטרה")
  )
    return true;
  if (norm.includes("מנצח")) return true;
  if (norm.includes("ייעוץ") || norm.includes("יעוץ")) return true;
  if (norm.includes("ליווי")) return true;
  if (norm.includes("הדרכ")) return true; // הדרכת, הדרכה
  if (
    norm.includes("עיבוד") &&
    !norm.includes("משחק") &&
    !norm.includes("ביצוע")
  )
    return true;
  if (norm.startsWith("מפיק") || norm.startsWith("הפקה")) return true;
  if (
    norm === "פסנתר" ||
    norm === "גיטרה" ||
    norm === "כינור" ||
    norm === "תופים"
  )
    return true;
  if (norm.includes("נוסח עברי")) return true;
  if (norm.includes("טקסט") && norm.includes("עיבוד")) return true;
  // "כתיבה ובימוי" without actor keywords
  if (
    norm.startsWith("כתיבה") &&
    !norm.includes("משחק") &&
    !norm.includes("ביצוע")
  )
    return true;
  // "מאת ובבימוי של" — authorship
  if (norm.includes("מאת ובבימוי")) return true;
  // "קלאסיקה ישראלית בבימויו של"
  if (norm.includes("בבימויו")) return true;
  // Gesher broken multi-line: naked names under a non-actor section
  // "על פי"
  if (norm.startsWith("על פי")) return true;
  // "שפה חזותית" (visual language)
  if (norm.includes("שפה חזותית") || norm.includes("תאטרון בובות")) return true;
  // "⁠טקסטים" (with zero-width)
  if (norm.includes("טקסטים")) return true;

  return false;
}

/**
 * Determine if a label indicates actors/performers.
 */
function isActorLabel(label) {
  const norm = normaliseLabel(label);
  if (ACTOR_LABELS.has(norm)) return true;

  // Compound labels containing actor keywords
  for (const kw of COMPOUND_ACTOR_KEYWORDS) {
    if (norm.includes(kw)) return true;
  }

  // "בהשתתפות" anywhere in the label
  if (norm.includes("בהשתתפות")) return true;

  return false;
}

/**
 * Check if an entry is noise (footer, junk, header).
 */
function isNoise(entry) {
  const trimmed = entry.trim();
  if (!trimmed) return true;
  for (const pattern of NOISE_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }
  // Very short entries that are just punctuation or whitespace
  if (trimmed.length <= 2) return true;
  return false;
}

/**
 * Clean actor names from a value string:
 * - Strip parenthetical text: (אור), (בתפקיד הרשל)
 * - Strip character-name dash prefix: "דולב מזרחי- אריאל יגן" → "אריאל יגן"
 * - Normalise "/" spacing → no spaces around /
 * - Split on commas, trim
 */
function cleanActorNames(value) {
  if (!value || !value.trim()) return [];

  // Haifa uses | between actor names inside בהשתתפות blocks
  // Replace | with , for uniform processing
  let text = value.replace(/\|/g, ",");

  // Remove "בהשתתפות :" or "בהשתתפות:" prefix that sometimes appears
  // in Hebrew Theatre's "משתתפים: בהשתתפות : ..." format
  text = text.replace(/^\s*בהשתתפות\s*:?\s*/i, "");

  // Remove "בכיכובם של" prefix
  text = text.replace(/^\s*בכיכובם של\s*:?\s*/i, "");
  text = text.replace(/^\s*בכיכובו של\s*/i, "");
  text = text.replace(/^\s*בכיכוב\s*:?\s*/i, "");

  // Split on commas first
  const rawNames = text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const cleaned = [];

  for (let name of rawNames) {
    // Remove parenthetical content (character names, role descriptions)
    name = name.replace(/\s*\([^)]*\)/g, "").trim();

    // Handle character-name dash: "CharName- ActorName" → "ActorName"
    // But be careful not to strip hyphenated names like "לב-ארי"
    // Pattern: a dash followed by a space or end (not preceded by letter)
    if (name.includes("- ")) {
      // If the part before "- " looks like a character (contains space or is short),
      // take the part after
      const dashParts = name.split("- ");
      if (dashParts.length === 2) {
        // Keep the actor name (after dash)
        name = dashParts[1].trim();
      }
    }

    // Normalise "/" (replacement actors): remove spaces around "/"
    name = name.replace(/\s*\/\s*/g, "/");

    // Drop "ו" ("and") prefix ONLY when it's a conjunction glue:
    // "ואברום הורוביץ" → "אברום הורוביץ"
    // But NOT when "ו" is part of the actual name (e.g., "ורדי מוסקוביץ")
    // Heuristic: only strip if it's before a common name pattern AND
    // the resulting name has at least 2 space-separated parts
    // Actually, simpler: don't strip "ו" at all — it's too risky.
    // Some names genuinely start with ו (ורדי, ורד, ולן, ואדים)
    // The "ו" prefix is cosmetic and not harmful in the output.

    // Strip any leftover labels that slipped through
    if (name.includes(":")) {
      // If there's a colon, it might be a missed label — skip
      continue;
    }

    // Remove trailing dots/periods
    name = name.replace(/\.\s*$/, "").trim();

    // Remove leading dots or special chars
    name = name.replace(/^[.\s⁠]+/, "").trim();

    // Filter out known Lessin navigation show titles
    if (LESSIN_NAV_TITLES.has(name)) continue;

    // Filter out generic junk words
    if (/^\d{2,3}-\d+$/.test(name)) continue; // phone numbers like "03-7255333"
    if (/^x$/.test(name)) continue;

    // Filter out entries that look like descriptions, not names
    // Names are typically 2-5 Hebrew words; descriptions are longer
    if (name.length > 50 && !name.includes("/")) continue;

    // Filter out orchestra/band entries
    if (/תזמורת|אנסמבל הוירטואוזים|התזמורת הקאמרית/.test(name)) continue;

    // Filter out entries starting with English words (Studio, etc.)
    if (/^[A-Z][a-z]/.test(name) && name.length > 3) continue;

    if (name.length > 1) {
      cleaned.push(name);
    }
  }

  return cleaned;
}

/**
 * Main transformation: raw cast string → cleaned actor-only string
 * Returns the cleaned string, or null if no actors found.
 */
function normalizeCast(raw) {
  if (!raw || !raw.trim()) return null;

  const entries = splitIntoEntries(raw);
  const allActorNames = [];

  for (const entry of entries) {
    // Skip noise
    if (isNoise(entry)) continue;

    const parsed = extractLabel(entry);

    if (parsed) {
      const { label, value } = parsed;

      // Skip non-actor labels
      if (isNonActorLabel(label)) continue;

      // If it's an actor label, extract names from value
      if (isActorLabel(label)) {
        const names = cleanActorNames(value);
        allActorNames.push(...names);
        continue;
      }

      // Unknown label — could be a character name (e.g., "אלה:", "ליאור:")
      // Only include if the label is short-ish (character names are typically 1-3 words)
      // and the value looks like actor names
      if (label.length <= 40) {
        const names = cleanActorNames(value);
        allActorNames.push(...names);
      }
      // Otherwise skip — it's probably an unrecognized technical credit
    } else {
      // No colon — bare names or junk
      const trimmed = entry.trim();

      // Skip if it looks like junk (very long text without commas, promo text)
      if (
        trimmed.length > 80 &&
        !trimmed.includes(",") &&
        !trimmed.includes("/")
      ) {
        continue;
      }

      // Skip English text blocks (more than 3 consecutive Latin chars)
      if (/[a-zA-Z]{4,}/.test(trimmed) && !/[\u0590-\u05FF]/.test(trimmed)) {
        continue;
      }

      // Skip lines that look like navigation/footer (website junk)
      // e.g., show titles, website sections, phone numbers
      if (trimmed.length < 5) continue; // too short to be a name
      if (trimmed.length > 60 && !trimmed.includes(",")) continue; // long non-list text

      // Skip entries that match noise
      if (isNoise(trimmed)) continue;

      // Could be a continuation of names from multi-line format
      const names = cleanActorNames(trimmed);
      allActorNames.push(...names);
    }
  }

  if (allActorNames.length === 0) return null;

  // Deduplicate while preserving order
  const seen = new Set();
  const unique = [];
  for (const name of allActorNames) {
    // Normalise for dedup: lowercase slash groups
    const key = name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(name);
    }
  }

  return unique.join(", ");
}

// ═══════════════════════════════════════════════════════════════
// SQL HELPERS
// ═══════════════════════════════════════════════════════════════

function escapeSql(s) {
  if (s == null) return "NULL";
  return "'" + String(s).replace(/'/g, "''") + "'";
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);
  const generateSql = args.includes("--generate-sql");
  const applyDirect = args.includes("--apply");

  console.log("🎭 Normalize Cast Data");
  console.log("═".repeat(60));

  const db = await createPrismaClient();
  if (!db) {
    console.error("DATABASE_URL not set. Cannot connect.");
    process.exit(1);
  }
  const { prisma, pool } = db;

  try {
    const shows = await prisma.show.findMany({
      where: { cast: { not: null } },
      select: { id: true, slug: true, cast: true, theatre: true },
      orderBy: { theatre: "asc" },
    });

    console.log(`Found ${shows.length} shows with cast data.\n`);

    const changes = [];
    const noActors = [];
    const unchanged = [];

    for (const show of shows) {
      const newCast = normalizeCast(show.cast);
      const oldCast = show.cast;

      if (newCast === oldCast) {
        unchanged.push(show);
        continue;
      }

      if (newCast === null) {
        noActors.push(show);
      }

      changes.push({
        id: show.id,
        slug: show.slug,
        theatre: show.theatre,
        oldCast,
        newCast,
      });
    }

    // ── Preview output ──
    console.log(`\n📊 Summary:`);
    console.log(`  Total shows with cast: ${shows.length}`);
    console.log(`  Will change: ${changes.length}`);
    console.log(`  Unchanged: ${unchanged.length}`);
    console.log(`  No actors found (will set NULL): ${noActors.length}`);

    if (noActors.length > 0) {
      console.log(`\n⚠️  Shows with no extractable actors:`);
      for (const show of noActors) {
        console.log(`  - [${show.theatre}] ${show.slug}`);
      }
    }

    console.log(`\n${"─".repeat(60)}`);
    console.log("DETAILED CHANGES:");
    console.log("─".repeat(60));

    for (const change of changes) {
      const oldTrunc =
        change.oldCast && change.oldCast.length > 120
          ? change.oldCast.substring(0, 120) + "..."
          : change.oldCast;
      console.log(`\n[${change.theatre}] ${change.slug}`);
      console.log(`  OLD: ${oldTrunc}`);
      console.log(`  NEW: ${change.newCast ?? "(NULL)"}`);
    }

    // ── Generate SQL migration ──
    if (generateSql) {
      const timestamp = new Date()
        .toISOString()
        .replace(/[-T:]/g, "")
        .slice(0, 14);
      const migrationName = `${timestamp}_normalize_cast_data`;
      const migrationDir = path.join(
        rootDir,
        "prisma",
        "migrations",
        migrationName,
      );
      fs.mkdirSync(migrationDir, { recursive: true });

      const sqlLines = [
        "-- Normalize cast field: extract only actor/performer names",
        `-- Format: name1/name2, name3, name4/name5 (where / = replacement)`,
        `-- Generated on ${new Date().toISOString()}`,
        "",
      ];

      for (const change of changes) {
        sqlLines.push(
          `UPDATE "Show" SET "cast" = ${escapeSql(change.newCast)} WHERE "slug" = ${escapeSql(change.slug)};`,
        );
      }

      const sqlContent = sqlLines.join("\n") + "\n";
      const sqlPath = path.join(migrationDir, "migration.sql");
      fs.writeFileSync(sqlPath, sqlContent, "utf-8");
      console.log(`\n✅ SQL migration written to: ${sqlPath}`);
      console.log(`   ${changes.length} UPDATE statements.`);
      console.log(
        `\n   To apply: npx prisma db execute --file ${path.relative(rootDir, sqlPath)}`,
      );
    }

    // ── Apply directly ──
    if (applyDirect) {
      console.log(`\n🔄 Applying ${changes.length} changes directly...`);
      let applied = 0;
      for (const change of changes) {
        await prisma.show.update({
          where: { slug: change.slug },
          data: { cast: change.newCast },
        });
        applied++;
        if (applied % 20 === 0) {
          console.log(`   Applied ${applied}/${changes.length}...`);
        }
      }
      console.log(`✅ Applied ${applied} changes.`);
    }

    if (!generateSql && !applyDirect) {
      console.log(
        "\n💡 This was a dry run. Use --generate-sql or --apply to make changes.",
      );
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
