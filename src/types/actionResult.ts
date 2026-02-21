/**
 * Discriminated union type for server action return values.
 * Replaces the apiError/apiSuccess pattern used in API routes.
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/** Convenience helpers to create ActionResult values. */
export function actionSuccess<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

export function actionError(
  message: string,
  internalError?: unknown,
): ActionResult<never> {
  if (internalError) {
    console.error("[Action Error]", internalError);
  }
  return { success: false, error: message };
}

export const INTERNAL_ERROR_MESSAGE = "שגיאה פנימית, נסו שוב מאוחר יותר";
