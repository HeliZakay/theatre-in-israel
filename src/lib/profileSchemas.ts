import { z } from "zod";
import {
  PROFILE_NAME_MIN,
  PROFILE_NAME_MAX,
} from "@/constants/profileValidation";

const nameField = z
  .string()
  .trim()
  .min(PROFILE_NAME_MIN, `שם חייב להכיל לפחות ${PROFILE_NAME_MIN} תווים`)
  .max(PROFILE_NAME_MAX, `שם יכול להכיל עד ${PROFILE_NAME_MAX} תווים`);

/** Server-side schema for profile update. */
export const updateProfileSchema = z.object({
  name: nameField,
});

/** Client-side schema for the profile form (same shape). */
export const clientProfileSchema = updateProfileSchema;

/**
 * Format Zod validation errors into a single user-facing string.
 */
export function formatZodErrors(err: z.ZodError): string {
  if (!err?.issues) return "נתונים לא תקינים";
  return err.issues.map((i) => i.message).join("; ");
}

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
