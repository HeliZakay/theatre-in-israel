import * as z from "zod";
import {
  REVIEW_TEXT_MAX,
  REVIEW_TEXT_MIN,
  REVIEW_NAME_MAX,
  REVIEW_TITLE_MAX,
  REVIEW_TITLE_MIN,
} from "@/constants/reviewValidation";

/**
 * Rating field shared between create and update schemas.
 */
const ratingField = z.preprocess(
  (v) => (typeof v === "string" ? parseInt(v, 10) : v),
  z.number().int().min(1, "בחר.י דירוג").max(5, "דירוג לא תקין"),
);

/**
 * Title field shared between create and update schemas.
 */
const titleField = z
  .string()
  .trim()
  .min(REVIEW_TITLE_MIN, "הכניס.י כותרת")
  .max(REVIEW_TITLE_MAX, `הכותרת יכולה להכיל עד ${REVIEW_TITLE_MAX} תווים`);

/**
 * Text field shared between create and update schemas.
 */
const textField = z
  .string()
  .trim()
  .min(REVIEW_TEXT_MIN, `תגובה צריכה להכיל לפחות ${REVIEW_TEXT_MIN} תווים`)
  .max(REVIEW_TEXT_MAX, `התגובה יכולה להכיל עד ${REVIEW_TEXT_MAX} תווים`);

/**
 * Schema for creating a new review (API POST /api/reviews).
 * Includes `showId` and optional `name`.
 */
export const createReviewSchema = z.object({
  showId: z.coerce.number().int().positive({ message: "יש לבחור הצגה" }),
  name: z
    .string()
    .trim()
    .max(REVIEW_NAME_MAX, `השם יכול להכיל עד ${REVIEW_NAME_MAX} תווים`)
    .optional(),
  title: titleField,
  rating: ratingField,
  text: textField,
});

/**
 * Schema for updating an existing review (API PATCH /api/reviews/[id]).
 */
export const updateReviewSchema = z.object({
  title: titleField,
  rating: ratingField,
  text: textField,
});

/**
 * Client-side schema for the new-review form.
 * Same as `createReviewSchema` but without `name` (pulled from session).
 */
export const clientReviewSchema = z.object({
  showId: z.string().trim().min(1, "יש לבחור הצגה"),
  title: titleField,
  rating: ratingField,
  text: textField,
});

/**
 * Client-side schema for the edit-review form.
 * Same fields as `updateReviewSchema`.
 */
export const clientEditReviewSchema = updateReviewSchema;

/**
 * Rating dropdown options for select components.
 */
export const ratingOptions = [
  { value: "5", label: "5 - מצוין" },
  { value: "4", label: "4 - טוב מאוד" },
  { value: "3", label: "3 - סביר" },
  { value: "2", label: "2 - פחות" },
  { value: "1", label: "1 - לא מומלץ" },
];

/**
 * Format Zod validation errors into a single user-facing string.
 */
export function formatZodErrors(err: z.ZodError): string {
  if (!err?.issues) return "נתונים לא תקינים";
  return err.issues.map((i) => i.message).join("; ");
}

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
