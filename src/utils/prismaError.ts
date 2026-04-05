/**
 * Type guard for Prisma client-known errors (e.g. P2002, P2003).
 * Narrows `unknown` catch variables so `.code` is accessible without `as any`.
 */
export function isPrismaError(err: unknown): err is { code: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as Record<string, unknown>).code === "string"
  );
}
