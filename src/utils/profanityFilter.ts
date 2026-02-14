import * as filter from "leo-profanity";

// Initialize profanity filter
filter.clearList();
filter.add(filter.getDictionary("en"));

// Add Hebrew profanity words (common ones)
const hebrewProfanity = [
  "זין",
  "כוס",
  "מזדיין",
  "תזדיין",
  "בן זונה",
  "זונה",
  "שרמוטה",
  "מניאק",
  "חרא",
  "לעזאזל",
  "קוקסינל",
  "אידיוט",
  "טמבל",
];

filter.add(hebrewProfanity);

/**
 * Check if text contains profanity
 * @param text - The text to check
 * @returns true if profanity is found, false otherwise
 */
export function containsProfanity(text: string): boolean {
  return filter.check(text);
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
