/**
 * Parse a Hebrew textual duration string into minutes.
 *
 * Handles both numeric forms ("90 דקות") and textual forms
 * ("כשעה וחצי", "שעה ו-25 דקות", "כשעתיים", etc.).
 *
 * IMPORTANT: hour-based forms are checked FIRST so that strings like
 * "כשעה ו-15 דקות" correctly return 75, not 15.
 *
 * @param {string | null} text  Raw text after "משך ההצגה:"
 * @returns {number | null}     Duration in minutes, or null if unparsable
 */
function parseLessinDuration(text) {
  if (!text) return null;

  // Textual minute words → numeric values
  const wordToMinutes = {
    עשר: 10,
    עשרים: 20,
    חצי: 30,
    שלושים: 30,
    רבע: 15,
    ארבעים: 40,
    חמישים: 50,
  };

  // ── 1. Detect hour base first ──
  // Must check שעתיים before שעה (שעתיים contains שעה)
  let hours = 0;
  if (/שעתיים/.test(text)) {
    hours = 2;
  } else if (/שעה/.test(text)) {
    hours = 1;
  }

  if (hours > 0) {
    let minutes = hours * 60;

    // Check for added minutes after the hour word
    // e.g. "כשעה וחצי", "כשעה ורבע", "כשעה ו-15 דקות"
    const afterHour = text.replace(/.*שעתיים|.*שעה/, "").trim();

    if (afterHour && afterHour !== text) {
      // Try numeric addition: "ו-15 דקות" / "ו25 דקות"
      const addedNumeric = afterHour.match(/(\d+)/);
      if (addedNumeric) {
        return minutes + parseInt(addedNumeric[1], 10);
      }

      // Try textual addition: "וחצי", "ורבע", etc.
      // Check longer words first so "עשרים" matches before "עשר"
      const sortedWords = Object.entries(wordToMinutes).sort(
        (a, b) => b[0].length - a[0].length,
      );
      for (const [word, value] of sortedWords) {
        if (afterHour.includes(word)) {
          return minutes + value;
        }
      }
    }

    // Hour base only (no parsable addition)
    return minutes;
  }

  // ── 2. No hour base — try plain numeric form: "90 דקות" / "120 דקות" ──
  const numericMatch = text.match(/(\d+)\s*דקות/);
  if (numericMatch) {
    return parseInt(numericMatch[1], 10);
  }

  return null;
}

export { parseLessinDuration };
