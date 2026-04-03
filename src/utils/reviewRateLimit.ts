import prisma from "@/lib/prisma";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_REVIEWS_PER_WINDOW = 50;

/**
 * Check if user has exceeded the rate limit for creating reviews.
 * Uses a direct Prisma query on the reviews table (not the generic rate-limit utility).
 * @param userId - The user ID to check
 * @returns Object with isLimited (boolean) and remainingTime (minutes until limit resets)
 */
export async function checkReviewRateLimit(
  userId: string,
): Promise<{ isLimited: boolean; remainingTime?: number }> {
  if (!process.env.VERCEL) {
    return { isLimited: false };
  }

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
