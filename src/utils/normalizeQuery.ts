/** Replace common geresh / apostrophe variants with ASCII apostrophe. */
export function normalizeQuotes(s: string): string {
  return s.replace(/[\u05F3\u2019\u02BC]/g, "'");
}
