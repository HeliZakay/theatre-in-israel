/**
 * Shared date-parsing utilities for theatre event scrapers.
 *
 * All high-level parsers return { date: "YYYY-MM-DD", hour: "HH:MM" | "" }
 * or null when the input doesn't match.
 */

// ── Low-level helpers ────────────────────────────────────────────

/**
 * Infer a full year from a day + month when the source omits the year.
 * If the date has already passed (more than 1 day ago), assumes next year.
 *
 * @param {number} day  — day of month (1-31)
 * @param {number} month — month (1-12)
 * @returns {number} — full year (e.g. 2026)
 */
export function inferYear(day, month) {
  const today = new Date();
  const thisYear = today.getFullYear();
  const candidate = new Date(thisYear, month - 1, day);
  const oneDayMs = 86_400_000;
  return candidate.getTime() < today.getTime() - oneDayMs
    ? thisYear + 1
    : thisYear;
}

/**
 * Convert a 2-digit year string to a full 4-digit year.
 * Years 00-69 → 2000-2069, years 70-99 → 1970-1999.
 *
 * @param {string|number} yy — two-digit year
 * @returns {number} — full year (e.g. 2026)
 */
export function parseShortYear(yy) {
  const n = typeof yy === "string" ? parseInt(yy, 10) : yy;
  return n < 70 ? 2000 + n : 1900 + n;
}

/**
 * Normalize an optional year string: if 2 digits, expand to 4 digits;
 * if 4 digits, return as-is; if empty/missing, infer from day+month.
 *
 * @param {string} yearStr — year string ("26", "2026", or "")
 * @param {number} day — day of month (1-31)
 * @param {number} month — month (1-12)
 * @returns {string} — 4-digit year string (e.g. "2026")
 */
export function normalizeYear(yearStr, day, month) {
  if (yearStr && yearStr.length >= 4) return yearStr;
  if (yearStr && yearStr.length === 2) return String(parseShortYear(yearStr));
  return String(inferYear(day, month));
}

/**
 * Zero-pad day/month and format as "YYYY-MM-DD".
 *
 * @param {number} day
 * @param {number} month
 * @param {number} year
 * @returns {string}
 */
export function formatDate(day, month, year) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Extract the first HH:MM time pattern from text.
 *
 * @param {string} text
 * @returns {string} — "HH:MM" or ""
 */
export function parseTime(text) {
  const m = text.match(/(\d{1,2}:\d{2})/);
  return m ? m[1] : "";
}

// ── Hebrew month map ─────────────────────────────────────────────

/** Hebrew month name → 1-based month number. */
export const HEBREW_MONTHS = {
  "ינואר": 1, "פברואר": 2, "מרס": 3, "מרץ": 3,
  "אפריל": 4, "מאי": 5, "יוני": 6,
  "יולי": 7, "אוגוסט": 8, "ספטמבר": 9,
  "אוקטובר": 10, "נובמבר": 11, "דצמבר": 12,
};

// ── High-level parsers ───────────────────────────────────────────

/**
 * Parse "DD.MM", "DD.MM.YY", or "DD.MM.YYYY" (with optional trailing time).
 * Year is inferred/expanded when missing or 2-digit.
 *
 * @param {string} text
 * @returns {{ date: string, hour: string } | null}
 */
export function parseDotDate(text) {
  const m = text.match(/(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  const year = parseInt(normalizeYear(m[3] || "", day, month), 10);
  return { date: formatDate(day, month, year), hour: parseTime(text) };
}

/**
 * Parse "DD-MM-YYYY" (with optional trailing time).
 *
 * @param {string} text
 * @returns {{ date: string, hour: string } | null}
 */
export function parseDashDate(text) {
  const m = text.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  const year = parseInt(m[3], 10);
  return { date: formatDate(day, month, year), hour: parseTime(text) };
}

/**
 * Parse "DD/MM/YY" or "DD/MM/YYYY" (with optional trailing time).
 * Year is expanded when 2-digit.
 *
 * @param {string} text
 * @returns {{ date: string, hour: string } | null}
 */
export function parseSlashDate(text) {
  const m = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  const year = parseInt(normalizeYear(m[3], day, month), 10);
  return { date: formatDate(day, month, year), hour: parseTime(text) };
}

/**
 * Parse Hebrew date text containing "DD בMonthName YYYY".
 * Handles variants with/without ב prefix and various "בשעה" time patterns.
 *
 * @param {string} text
 * @returns {{ date: string, hour: string } | null}
 */
export function parseHebrewDate(text) {
  const m = text.match(/(\d{1,2})\s+ב?([א-ת]+)\s+(\d{4})/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const month = HEBREW_MONTHS[m[2]];
  if (!month) return null;
  const year = parseInt(m[3], 10);
  return { date: formatDate(day, month, year), hour: parseTime(text) };
}

/**
 * Parse ISO-style datetime: "YYYY-MM-DD HH:MM" or "YYYY-MM-DDTHH:MM:SS".
 *
 * @param {string} text
 * @returns {{ date: string, hour: string } | null}
 */
export function parseISODatetime(text) {
  const m = text.match(/(\d{4}-\d{2}-\d{2})[\sT](\d{2}:\d{2})/);
  if (!m) return null;
  return { date: m[1], hour: m[2] };
}

/**
 * Convert a Unix timestamp (seconds) to Israel-local date/time.
 *
 * @param {number} ts — Unix timestamp in seconds
 * @returns {{ date: string, hour: string }}
 */
export function tsToIsrael(ts) {
  const d = new Date(ts * 1000);
  const parts = new Intl.DateTimeFormat("en-IL", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (type) => parts.find((p) => p.type === type)?.value || "";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    hour: `${get("hour")}:${get("minute")}`,
  };
}
