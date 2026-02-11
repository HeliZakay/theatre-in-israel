export function normalize(value: unknown): string {
  return value?.toString().trim().toLowerCase() ?? "";
}
