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
