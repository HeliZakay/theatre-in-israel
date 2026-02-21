import prisma from "./prisma";

/**
 * Recalculate and persist avgRating + reviewCount for a single show.
 * Call this after any review is created, updated, or deleted.
 */
export async function refreshShowStats(showId: number): Promise<void> {
  const stats = await prisma.review.aggregate({
    where: { showId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.show.update({
    where: { id: showId },
    data: {
      avgRating: stats._avg.rating,
      reviewCount: stats._count.rating,
    },
  });
}
