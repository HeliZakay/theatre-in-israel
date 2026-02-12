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
 * Clean profanity from text by replacing with asterisks
 * @param text - The text to clean
 * @returns Cleaned text with profanity replaced
 */
export function cleanProfanity(text: string): string {
  return filter.clean(text);
}

/**
 * Get a list of profane words found in the text
 * @param text - The text to analyze
 * @returns Array of profane words found
 */
export function listProfanity(text: string): string[] {
  const words = text.split(/\s+/);
  return words.filter((word) => filter.check(word));
}
