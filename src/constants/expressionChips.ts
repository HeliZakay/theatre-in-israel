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
