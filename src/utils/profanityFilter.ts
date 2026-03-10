import * as filter from "leo-profanity";
import {
  HEBREW_PROFANITY_WORDS,
  HEBREW_PROFANITY_PHRASES,
  HEBREW_PREFIXES,
} from "@/constants/profanityWords";

// ---------------------------------------------------------------------------
// Initialize leo-profanity for English detection only
// ---------------------------------------------------------------------------
filter.clearList();
filter.add(filter.getDictionary("en"));

// ---------------------------------------------------------------------------
// Pre-computed structures for fast Hebrew lookups
// ---------------------------------------------------------------------------

/** O(1) lookup set for single Hebrew profanity words */
const hebrewWordSet = new Set(HEBREW_PROFANITY_WORDS);

// ---------------------------------------------------------------------------
// Hebrew profanity detection
// ---------------------------------------------------------------------------

/**
 * Check if text contains Hebrew profanity.
 *
 * Strategy:
 * 1. Normalize — convert whitespace to spaces, keep only Hebrew letters
 *    (\u05D0-\u05EA), spaces, and basic Latin letters; strip everything else.
 * 2. Check multi-word phrases as substrings of the normalized text.
 * 3. Tokenize by spaces and, for each token:
 *    a. Check bare word against the word set.
 *    b. Iteratively strip Hebrew prefixes (longest-first, up to 4 layers)
 *       and check the remainder after each layer.
 *
 * @param text - The text to check
 * @returns true if Hebrew profanity is found, false otherwise
 */
export function containsHebrewProfanity(text: string): boolean {
  // Step 1 – Normalize: convert all whitespace to spaces, then keep only
  // Hebrew letters, spaces, and Latin letters
  const normalized = text
    .replace(/[\s]+/g, " ")
    .replace(/[^\u05D0-\u05EAa-zA-Z ]/g, "")
    .replace(/ {2,}/g, " ")
    .trim();

  if (normalized.length === 0) return false;

  // Step 2 – Multi-word phrase check (substring match)
  for (const phrase of HEBREW_PROFANITY_PHRASES) {
    if (normalized.includes(phrase)) return true;
  }

  // Step 3 – Token-level checks
  const tokens = normalized.split(" ");

  for (const token of tokens) {
    if (token.length === 0) continue;

    // 3a – Bare word match
    if (hebrewWordSet.has(token)) return true;

    // 3b – Iteratively strip Hebrew prefixes (longest-first, up to 4 layers)
    let remainder = token;
    for (let depth = 0; depth < 4; depth++) {
      let stripped = false;
      for (const prefix of HEBREW_PREFIXES) {
        if (remainder.startsWith(prefix) && remainder.length > prefix.length) {
          remainder = remainder.slice(prefix.length);
          if (hebrewWordSet.has(remainder)) return true;
          stripped = true;
          break; // restart prefix search on the new, shorter remainder
        }
      }
      if (!stripped) break; // no prefix matched — stop
    }
  }

  return false;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check if text contains profanity (English via leo-profanity, Hebrew via
 * custom logic).
 * @param text - The text to check
 * @returns true if profanity is found, false otherwise
 */
export function containsProfanity(text: string): boolean {
  return filter.check(text) || containsHebrewProfanity(text);
}

/**
 * Check multiple named fields for profanity.
 * @returns the name of the first offending field, or `null` if all clean.
 */
export function checkFieldsForProfanity(
  fields: Record<string, string | null | undefined>,
): string | null {
  for (const [fieldName, value] of Object.entries(fields)) {
    if (value && containsProfanity(value)) return fieldName;
  }
  return null;
}
