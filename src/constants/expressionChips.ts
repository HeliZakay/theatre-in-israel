export const POSITIVE_CHIPS = [
  "משחק מעולה",
  "מרגש",
  "מצחיק",
  "ביצוע מוזיקלי מדהים",
  "תפאורה מרשימה",
  "טקסט חזק",
  "בימוי מבריק",
  "מפתיע",
  "חובה לראות",
  "מומלצת",
  "מרתק",
  "כייפי",
  "מסר חשוב",
  "עיבוד מודרני",
] as const;

export const CRITICAL_CHIPS = [
  "קצת פחות התחברתי",
  "נחמד אבל לא וואו",
  "קצת ארוך",
  "משעמם",
  "צעקני",
] as const;

export const EXPRESSION_CHIPS = [
  ...POSITIVE_CHIPS,
  ...CRITICAL_CHIPS,
] as const;

/** Positive chips that make sense even for low ratings (neutral/craft-focused). */
const NEUTRAL_POSITIVE = new Set([
  "מפתיע",
  "תפאורה מרשימה",
  "טקסט חזק",
  "מסר חשוב",
  "עיבוד מודרני",
]);

/** Critical chips mild enough for high ratings. */
const MILD_CRITICAL = new Set(["קצת ארוך", "נחמד אבל לא וואו"]);

export function getChipsForRating(
  rating: number | null,
): readonly string[] {
  if (rating === null) return EXPRESSION_CHIPS;

  if (rating <= 2) {
    const positive = POSITIVE_CHIPS.filter((c) => NEUTRAL_POSITIVE.has(c));
    return [...CRITICAL_CHIPS, ...positive];
  }

  if (rating >= 4) {
    const critical = CRITICAL_CHIPS.filter((c) => MILD_CRITICAL.has(c));
    return [...POSITIVE_CHIPS, ...critical];
  }

  // Rating 3: show all
  return EXPRESSION_CHIPS;
}
