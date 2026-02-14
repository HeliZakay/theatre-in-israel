import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, type AuthenticatedSession } from "@/lib/auth";
import { apiError } from "@/utils/apiResponse";

type RateLimitFn = (
  userId: string,
) =>
  | { isLimited: boolean; remainingTime?: number }
  | Promise<{ isLimited: boolean; remainingTime?: number }>;

type AuthSuccess = { session: AuthenticatedSession; error: undefined };
type AuthFailure = { session: undefined; error: NextResponse };
type AuthResult = AuthSuccess | AuthFailure;

/**
 * Ensure the request comes from an authenticated user.
 * Optionally runs a rate-limit check.
 *
 * @param unauthMessage  – Hebrew 401 message
 * @param rateLimit      – optional rate-limit function + Hebrew 429 template
 */
export async function requireApiAuth(
  unauthMessage: string,
  rateLimit?: {
    check: RateLimitFn;
    message: (remainingTime: number) => string;
  },
): Promise<AuthResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { session: undefined, error: apiError(unauthMessage, 401) };
  }

  if (rateLimit) {
    const result = await rateLimit.check(session.user.id);
    if (result.isLimited) {
      return {
        session: undefined,
        error: apiError(rateLimit.message(result.remainingTime!), 429),
      };
    }
  }

  return { session: session as AuthenticatedSession, error: undefined };
}
