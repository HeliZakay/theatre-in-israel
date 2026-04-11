/** Replace common geresh / apostrophe variants with ASCII apostrophe. */
export function normalizeQuotes(s: string): string {
  return s.replace(/[\u05F3\u2019\u02BC]/g, "'");
}

/** Return both ASCII-apostrophe and Hebrew-geresh variants of a string. */
export function quoteVariants(s: string): string[] {
  const ascii = normalizeQuotes(s);
  const geresh = ascii.replace(/'/g, "\u05F3");
  if (ascii === geresh) return [ascii];
  return [ascii, geresh];
}
