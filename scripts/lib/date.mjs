/**
 * Shared date-parsing utilities for theatre event scrapers.
 */

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
