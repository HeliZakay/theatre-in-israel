/**
 * Venue-title matching utility — matches raw titles from venue websites
 * (e.g. "הלויתן – הקאמרי") to shows in the database.
 *
 * Used by venue scrapers to identify which DB show a venue listing refers to.
 */

import { normaliseForMatch, createPrismaClient } from "./db.mjs";

// ── Theatre hint map ─────────────────────────────────────────────
// Maps informal/short theatre names (as they appear on venue sites)
// to the canonical DB theatre name. Longer keys first to avoid
// partial matches (e.g. "בית ליסין" before "ליסין").

const THEATRE_HINTS = new Map([
  ["תיאטרון הקאמרי", "תיאטרון הקאמרי"],
  ["תיאטרון הבימה", "תיאטרון הבימה"],
  ["תיאטרון בית ליסין", "תיאטרון בית ליסין"],
  ["התיאטרון העברי", "התיאטרון העברי"],
  ["תיאטרון גשר", "תיאטרון גשר"],
  ["תיאטרון החאן", "תיאטרון החאן"],
  ["תיאטרון חיפה", "תיאטרון חיפה"],
  ["תיאטרון באר שבע", "תיאטרון באר שבע"],
  ["תיאטרון תמונע", "תיאטרון תמונע"],
  ["תיאטרון צוותא", "תיאטרון צוותא"],
  // Short/informal variants
  ["בית ליסין", "תיאטרון בית ליסין"],
  ["הקאמרי", "תיאטרון הקאמרי"],
  ["קאמרי", "תיאטרון הקאמרי"],
  ["הבימה", "תיאטרון הבימה"],
  ["בימה", "תיאטרון הבימה"],
  ["גשר", "תיאטרון גשר"],
  ["החאן", "תיאטרון החאן"],
  ["חאן", "תיאטרון החאן"],
  ["ליסין", "תיאטרון בית ליסין"],
  ["העברי", "התיאטרון העברי"],
  ["תמונע", "תיאטרון תמונע"],
  ["צוותא", "תיאטרון צוותא"],
  ["באר שבע", "תיאטרון באר שבע"],
  ["חיפה", "תיאטרון חיפה"],
]);

// Separators to try, in order (em-dash/en-dash first to avoid breaking
// hyphenated show titles like "מיס-בלתי-אפשרי – הקאמרי").
const SEPARATORS = ["–", "—", " - ", "- ", " -", "|", ":"];

// ── DB fetching ──────────────────────────────────────────────────

/**
 * Fetch all shows from the database (across all theatres).
 * Returns an array of { id, slug, title, theatre }, or null if DB is unavailable.
 */
export async function fetchAllDbShows() {
  const db = await createPrismaClient();
  if (!db) return null;

  try {
    return await db.prisma.show.findMany({
      select: { id: true, slug: true, title: true, theatre: true },
    });
  } finally {
    await db.prisma.$disconnect();
    await db.pool.end();
  }
}

// ── Internal helpers ─────────────────────────────────────────────

/**
 * Try to resolve a theatre hint from a string.
 * Returns the canonical DB theatre name or null.
 */
function resolveTheatreHint(text) {
  const trimmed = text.trim();
  for (const [hint, canonical] of THEATRE_HINTS) {
    if (trimmed === hint || trimmed.includes(hint)) {
      return canonical;
    }
  }
  return null;
}

/**
 * Find shows matching a candidate title string.
 * Tries exact normalised match first, then substring containment.
 * @param {string} candidate — raw candidate title
 * @param {{ id: number, slug: string, title: string, theatre: string }[]} shows
 * @param {{ exactOnly?: boolean }} [opts]
 * @returns {{ id: number, slug: string, title: string, theatre: string }[]}
 */
function findMatches(candidate, shows, { exactOnly = false } = {}) {
  const norm = normaliseForMatch(candidate);
  if (!norm) return [];

  // Exact match (works for any length, including short titles like "אמא")
  const exact = shows.filter((s) => normaliseForMatch(s.title) === norm);
  if (exact.length > 0) return exact;

  if (exactOnly) return [];

  // Substring: DB title contained in candidate, or candidate contained in DB title.
  // Require minimum 5 chars to avoid short titles matching unrelated text.
  // Also require the matched title to be at least 40% of the longer string to avoid
  // tiny titles matching inside long unrelated titles.
  const MIN_SUBSTRING_LEN = 5;
  return shows.filter((s) => {
    const sNorm = normaliseForMatch(s.title);
    if (sNorm.length < MIN_SUBSTRING_LEN || norm.length < MIN_SUBSTRING_LEN) return false;
    if (!norm.includes(sNorm) && !sNorm.includes(norm)) return false;
    const shorter = Math.min(sNorm.length, norm.length);
    const longer = Math.max(sNorm.length, norm.length);
    return shorter / longer >= 0.4;
  });
}

// ── Main matching function ───────────────────────────────────────

/**
 * Match a raw venue-page title to a DB show.
 *
 * Three-phase algorithm:
 * 1. Split on separators, identify theatre hint, match show name within that theatre
 * 2. Broad fuzzy match against all DB shows (no separator / no hint)
 * 3. Split parts without hint — try each part against all shows
 *
 * @param {string} rawTitle — e.g. "הלויתן – הקאמרי"
 * @param {{ id: number, slug: string, title: string, theatre: string }[]} allDbShows
 * @returns {{ showId: number, showSlug: string, theatre: string } | null}
 */
export function matchVenueTitle(rawTitle, allDbShows) {
  const title = rawTitle.trim();
  if (!title) return null;

  // Phase 1: Separator parsing + theatre hint
  for (const sep of SEPARATORS) {
    if (!title.includes(sep)) continue;

    const parts = title.split(sep).map((p) => p.trim()).filter(Boolean);
    if (parts.length < 2) continue;

    // Try each part as a theatre hint (typically last part)
    for (let i = parts.length - 1; i >= 0; i--) {
      const theatre = resolveTheatreHint(parts[i]);
      if (!theatre) continue;

      // Remaining parts form the show name candidate
      const showParts = parts.filter((_, j) => j !== i);
      const candidate = showParts.join(" ").trim();

      const theatreShows = allDbShows.filter((s) => s.theatre === theatre);
      const matches = findMatches(candidate, theatreShows);

      if (matches.length === 1) {
        return { showId: matches[0].id, showSlug: matches[0].slug, theatre: matches[0].theatre };
      }
      if (matches.length > 1) {
        console.warn(
          `  ⚠ Ambiguous match for "${title}": ${matches.map((m) => `"${m.title}" (${m.theatre})`).join(", ")}`,
        );
        return null;
      }
      // No match within this theatre — continue trying other parts/separators
    }
  }

  // Phase 2: Broad fuzzy match (no separator or no hint found)
  const broadMatches = findMatches(title, allDbShows);
  if (broadMatches.length === 1) {
    return { showId: broadMatches[0].id, showSlug: broadMatches[0].slug, theatre: broadMatches[0].theatre };
  }
  if (broadMatches.length > 1) {
    console.warn(
      `  ⚠ Ambiguous broad match for "${title}": ${broadMatches.map((m) => `"${m.title}" (${m.theatre})`).join(", ")}`,
    );
    return null;
  }

  // Phase 3: Separator split without hint — try each part individually.
  // Use exactOnly to avoid false positives (e.g. "לאונרד כהן" matching DB show "לאונרד").
  for (const sep of SEPARATORS) {
    if (!title.includes(sep)) continue;

    const parts = title.split(sep).map((p) => p.trim()).filter(Boolean);
    for (const part of parts) {
      const matches = findMatches(part, allDbShows, { exactOnly: true });
      if (matches.length === 1) {
        return { showId: matches[0].id, showSlug: matches[0].slug, theatre: matches[0].theatre };
      }
    }
  }

  return null;
}
