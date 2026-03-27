import type { z } from "zod";

/**
 * Format Zod validation errors into a single user-facing string.
 */
export function formatZodErrors(err: z.ZodError): string {
  if (!err?.issues) return "נתונים לא תקינים";
  return err.issues.map((i) => i.message).join("; ");
}
