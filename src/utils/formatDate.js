/**
 * Format a date value to Hebrew locale format (DD.MM.YY)
 * @param {string|number|Date} dateValue - The date to format
 * @returns {string} Formatted date string or empty string if invalid
 */
export function formatDate(dateValue) {
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("he-IL", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      });
}
