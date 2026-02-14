/**
 * Parse a string into a positive integer, or return `null` if it isn't one.
 * Useful for route params that must be a database ID.
 */
export function toPositiveInt(value: string): number | null {
  const n = Number.parseInt(value, 10);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}
