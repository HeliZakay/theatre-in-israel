/** Single Hebrew profanity words. */
export const HEBREW_PROFANITY_WORDS: string[] = [
  "זין",
  "זיון",
  "זיין",
  "כוס",
  "כוסית",
  "כוסאמק",
  "כוסאומק",
  "מזדיין",
  "מזדיינת",
  "תזדיין",
  "תזדייני",
  "זונה",
  "זונות",
  "שרמוטה",
  "שרמוטות",
  "מניאק",
  "מניאקית",
  "חרא",
  "חארא",
  "לעזאזל",
  "קוקסינל",
  "אידיוט",
  "אידיוטית",
  "טמבל",
  "טמבלית",
];

/** Multi-word Hebrew profanity phrases. */
export const HEBREW_PROFANITY_PHRASES: string[] = [
  "בן זונה",
  "בת זונה",
  "יא זונה",
  "יא מניאק",
  "יא חמור",
  "יא אידיוט",
];

/**
 * Common Hebrew bound prefixes to strip before matching.
 * Ordered longest-first so longer prefixes match before shorter ones.
 */
export const HEBREW_PREFIXES: string[] = [
  "כש",
  "מה",
  "של",
  "בה",
  "לה",
  "וה",
  "שה",
  "מב",
  "וב",
  "ול",
  "ומ",
  "ה",
  "ב",
  "ל",
  "מ",
  "ו",
  "ש",
  "כ",
];
