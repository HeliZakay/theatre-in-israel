/**
 * Format a date value to Hebrew locale format (DD.MM.YY)
 * @param {string|number|Date} dateValue - The date to format
 * @returns {string} Formatted date string or empty string if invalid
 */
export function formatDate(dateValue: string | number | Date): string {
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("he-IL", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      });
}

/**
 * Format a date as a relative Hebrew string ("היום", "אתמול", "לפני 3 ימים").
 * Falls back to absolute DD.MM.YY for dates older than ~30 days.
 */
export function formatRelativeDate(dateValue: string | number | Date): string {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "היום";
  if (diffDays === 1) return "אתמול";
  if (diffDays < 7) return `לפני ${diffDays} ימים`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? "לפני שבוע" : `לפני ${weeks} שבועות`;
  }
  return formatDate(dateValue);
}
