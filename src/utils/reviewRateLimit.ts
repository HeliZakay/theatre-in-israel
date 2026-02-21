import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/utils/rateLimit";

// Rate limit configuration
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_REVIEWS_PER_WINDOW = 10; // Maximum 10 reviews per hour
const MAX_EDITS_PER_WINDOW = 10; // Maximum 10 edits/deletes per hour

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
 * Uses a DB-backed sliding window via the shared rate-limit utility.
 */
export async function checkEditDeleteRateLimit(userId: string): Promise<{
  isLimited: boolean;
  remainingTime?: number;
}> {
  const result = await checkRateLimit(
    `user:${userId}`,
    "editDelete",
    MAX_EDITS_PER_WINDOW,
    RATE_LIMIT_WINDOW_MS,
  );

  if (!result.allowed) {
    return { isLimited: true, remainingTime: 60 };
  }

  return { isLimited: false };
}
