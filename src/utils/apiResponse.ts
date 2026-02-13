import { NextResponse } from "next/server";

/**
 * Return a JSON error response with a consistent shape.
 * In production, internal errors are masked with a generic Hebrew message.
 */
export function apiError(
  message: string,
  status: number,
  internalError?: unknown,
): NextResponse {
  if (internalError) {
    console.error("[API Error]", internalError);
  }
  return NextResponse.json({ error: message }, { status });
}

/**
 * Return a JSON success response with a consistent shape.
 */
export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/** Generic Hebrew 500 message for end users. */
export const INTERNAL_ERROR_MESSAGE = "שגיאה פנימית, נסו שוב מאוחר יותר";
