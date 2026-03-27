import { z } from "zod";
import {
  PROFILE_NAME_MIN,
  PROFILE_NAME_MAX,
} from "@/constants/profileValidation";

const nameField = z
  .string()
  .trim()
  .min(PROFILE_NAME_MIN, `שם חייב להכיל לפחות ${PROFILE_NAME_MIN} תווים`)
  .max(PROFILE_NAME_MAX, `שם יכול להכיל עד ${PROFILE_NAME_MAX} תווים`)
  .regex(/^[\p{L}\s'\-]+$/u, "השם יכול להכיל רק אותיות, רווחים, גרשיים ומקפים");

/** Server-side schema for profile update. */
export const updateProfileSchema = z.object({
  name: nameField,
});

/** Client-side schema for the profile form (same shape). */
export const clientProfileSchema = updateProfileSchema;

export { formatZodErrors } from "./zodHelpers";

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
