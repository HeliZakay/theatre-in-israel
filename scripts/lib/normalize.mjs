/**
 * Pure string normalisation functions for title comparison and matching.
 *
 * Extracted from db.mjs so they can be tested independently
 * (db.mjs uses import.meta.url which prevents Jest from loading it).
 */

/**
 * Normalise a title for comparison:
 * 1. Unify geresh / apostrophe variants (׳ U+05F3, ' U+2019, ʼ U+02BC) → ASCII '
 * 2. Trim + collapse whitespace.
 * @param {string} title
 * @returns {string}
 */
export function normalise(title) {
  return title
    .replace(/[\u05F3\u2019\u02BC]/g, "'")
    .replace(/[?!#%&|\\/:*"<>]/g, "")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Stricter normalisation for fuzzy title matching (e.g. cast backfill).
 * Extends `normalise` with niqqud stripping, ASCII quote unification,
 * and dash normalisation.
 * @param {string} s
 * @returns {string}
 */
export function normaliseForMatch(s) {
  return s
    .replace(/[\u05F3\u2019\u02BC']/g, "'")
    .replace(/[\u05B0-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]/g, "") // strip niqqud
    .replace(/[-–—]/g, "-") // normalise dashes
    .replace(/\u05D5{2,}/g, "\u05D5") // collapse repeated vav (וו→ו) for plene/defective variants
    .replace(/\u05D9{2,}/g, "\u05D9") // collapse repeated yod (יי→י)
    .replace(/[?!.,;:]+$/g, "") // strip trailing punctuation (e.g. "מי בעד?" → "מי בעד")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Escape a string for use inside a single-quoted SQL literal.
 * @param {string} s
 * @returns {string}
 */
export function escapeSql(s) {
  return s.replace(/'/g, "''");
}
