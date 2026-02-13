import prisma from "@/lib/prisma";

// Rate limit configuration
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_REVIEWS_PER_WINDOW = 3; // Maximum 3 reviews per hour
const MAX_EDITS_PER_WINDOW = 10; // Maximum 10 edits/deletes per hour

// In-memory store for edit/delete rate limiting
const editDeleteAttempts = new Map<string, number[]>();

/**
 * Check if user has exceeded the rate limit for creating reviews
 * @param userId - The user ID to check
 * @returns Object with isLimited (boolean) and remainingTime (minutes until limit resets)
 */
export async function checkReviewRateLimit(
  userId: string,
): Promise<{ isLimited: boolean; remainingTime?: number }> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);

  const recentReviews = await prisma.review.findMany({
    where: {
      userId,
      createdAt: {
        gte: windowStart,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      createdAt: true,
    },
  });

  if (recentReviews.length >= MAX_REVIEWS_PER_WINDOW) {
    // Calculate when the oldest review in the window will expire
    const oldestReviewTime = recentReviews[0].createdAt.getTime();
    const resetTime = oldestReviewTime + RATE_LIMIT_WINDOW_MS;
    const remainingMs = resetTime - Date.now();
    const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));

    return {
      isLimited: true,
      remainingTime: remainingMinutes,
    };
  }

  return {
    isLimited: false,
  };
}

/**
 * Check if user has exceeded the rate limit for editing/deleting reviews.
 * Uses an in-memory sliding window (resets on server restart).
 */
export function checkEditDeleteRateLimit(userId: string): {
  isLimited: boolean;
  remainingTime?: number;
} {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  const attempts = editDeleteAttempts.get(userId) ?? [];
  // Remove expired entries
  const recent = attempts.filter((t) => t > windowStart);

  if (recent.length >= MAX_EDITS_PER_WINDOW) {
    const oldest = recent[0];
    const resetTime = oldest + RATE_LIMIT_WINDOW_MS;
    const remainingMs = resetTime - now;
    const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));

    editDeleteAttempts.set(userId, recent);
    return { isLimited: true, remainingTime: remainingMinutes };
  }

  recent.push(now);
  editDeleteAttempts.set(userId, recent);
  return { isLimited: false };
}
