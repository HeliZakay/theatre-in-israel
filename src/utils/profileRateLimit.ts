import { checkRateLimit } from "@/utils/rateLimit";

const PROFILE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
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
    return { isLimited: true, remainingTime: 60 };
  }

  return { isLimited: false };
}
