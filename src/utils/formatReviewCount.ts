/**
 * Format a review count as a social-proof string rounded down to the nearest
 * hundred with a "+" suffix.  Counts under 100 are returned as-is.
 *
 * Examples: 1047 → "1,000+", 1389 → "1,300+", 250 → "200+"
 */
export function formatReviewMilestone(count: number): string {
  if (count < 100) return String(count);
  const rounded = Math.floor(count / 100) * 100;
  return `${rounded.toLocaleString("he-IL")}+`;
}
