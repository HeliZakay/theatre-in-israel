import prisma from "@/lib/prisma";

// Rate limit configuration
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_REVIEWS_PER_WINDOW = 3; // Maximum 3 reviews per hour

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
 * Check if user already has a review for a specific show
 * @param userId - The user ID
 * @param showId - The show ID (numeric)
 * @returns true if review exists, false otherwise
 */
export async function hasExistingReview(
  userId: string,
  showId: number,
): Promise<boolean> {
  const existing = await prisma.review.findFirst({
    where: {
      userId,
      showId,
    },
  });

  return existing !== null;
}
