import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/utils/rateLimit";
import { ONE_HOUR_MS } from "@/constants/rateLimits";

const PROFILE_WINDOW_MS = ONE_HOUR_MS;
const MAX_PROFILE_UPDATES = 5;

/**
 * Check if user has exceeded the rate limit for profile updates.
 */
export async function checkProfileRateLimit(
  userId: string,
): Promise<{ isLimited: boolean; remainingTime?: number }> {
  const result = await checkRateLimit(
    `user:${userId}`,
    "profileUpdate",
    MAX_PROFILE_UPDATES,
    PROFILE_WINDOW_MS,
  );

  if (!result.allowed) {
    const windowStart = new Date(Date.now() - PROFILE_WINDOW_MS);
    const oldestAttempt = await prisma.rateLimitAttempt.findFirst({
      where: {
        key: `user:${userId}`,
        action: "profileUpdate",
        createdAt: { gte: windowStart },
      },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });

    let remainingTime = 1;
    if (oldestAttempt) {
      const windowExpiry =
        oldestAttempt.createdAt.getTime() + PROFILE_WINDOW_MS;
      remainingTime = Math.max(
        1,
        Math.ceil((windowExpiry - Date.now()) / (1000 * 60)),
      );
    }

    return { isLimited: true, remainingTime };
  }

  return { isLimited: false };
}
