import { getServerSession } from "next-auth";
import { authOptions, type AuthenticatedSession } from "@/lib/auth";
import type { ActionResult } from "@/types/actionResult";
import { actionError } from "@/types/actionResult";

type RateLimitFn = (
  key: string,
) =>
  | { isLimited: boolean; remainingTime?: number }
  | Promise<{ isLimited: boolean; remainingTime?: number }>;

/**
 * Ensure the caller is an authenticated user.
 * Optionally runs a rate-limit check.
 *
 * Returns the session on success, or an ActionResult error on failure.
 */
export async function requireActionAuth(
  unauthMessage: string,
  rateLimit?: {
    check: RateLimitFn;
    message: (remainingTime: number) => string;
  },
): Promise<
  | { session: AuthenticatedSession; error?: undefined }
  | { session?: undefined; error: ActionResult<never> }
> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: actionError(unauthMessage) };
  }

  if (rateLimit) {
    const result = await rateLimit.check(session.user.id);
    if (result.isLimited) {
      return {
        error: actionError(rateLimit.message(result.remainingTime!)),
      };
    }
  }

  return { session: session as AuthenticatedSession };
}
