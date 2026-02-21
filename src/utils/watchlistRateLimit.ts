import { checkRateLimit } from "@/utils/rateLimit";

const WATCHLIST_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const WATCHLIST_MAX_ATTEMPTS = 30;

interface RateLimitResult {
  isLimited: boolean;
  remainingTime?: number;
}

export async function checkWatchlistRateLimit(
  userId: string,
): Promise<RateLimitResult> {
  const result = await checkRateLimit(
    userId,
    "watchlist_modify",
    WATCHLIST_MAX_ATTEMPTS,
    WATCHLIST_WINDOW_MS,
  );

  if (!result.allowed) {
    return { isLimited: true, remainingTime: 60 };
  }

  return { isLimited: false };
}
