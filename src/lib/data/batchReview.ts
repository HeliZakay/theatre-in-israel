import { unstable_cache } from "next/cache";
import prisma from "../prisma";

export interface BatchShowItem {
  id: number;
  slug: string;
  title: string;
  theatre: string;
  reviewCount: number;
  avgRating: number | null;
}

/**
 * Interleave "needs reviews" shows (0-2 reviews) every 5th position
 * among the popular shows, to avoid a rich-get-richer effect.
 */
function interleaveNeedsReviews(shows: BatchShowItem[]): BatchShowItem[] {
  const popular: BatchShowItem[] = [];
  const needsReviews: BatchShowItem[] = [];

  for (const show of shows) {
    if (show.reviewCount <= 2) {
      needsReviews.push(show);
    } else {
      popular.push(show);
    }
  }

  // Shuffle the needs-reviews pool so they aren't always in the same order
  for (let i = needsReviews.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [needsReviews[i], needsReviews[j]] = [needsReviews[j], needsReviews[i]];
  }

  const result: BatchShowItem[] = [];
  let popularIdx = 0;
  let needsIdx = 0;

  while (popularIdx < popular.length || needsIdx < needsReviews.length) {
    // Every 5th position (0-indexed: 4, 9, 14, ...) insert a needs-reviews show
    if ((result.length + 1) % 5 === 0 && needsIdx < needsReviews.length) {
      result.push(needsReviews[needsIdx++]);
    } else if (popularIdx < popular.length) {
      result.push(popular[popularIdx++]);
    } else if (needsIdx < needsReviews.length) {
      result.push(needsReviews[needsIdx++]);
    }
  }

  return result;
}

async function fetchBatchShows(): Promise<BatchShowItem[]> {
  const shows = await prisma.show.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      theatre: true,
      reviewCount: true,
      avgRating: true,
    },
    orderBy: [{ reviewCount: "desc" }, { id: "asc" }],
  });
  return interleaveNeedsReviews(shows);
}

export const getBatchShows = unstable_cache(
  fetchBatchShows,
  ["batch-shows"],
  { revalidate: 60, tags: ["shows-list"] },
);

export async function getReviewedShowIds(userId: string): Promise<number[]> {
  const reviews = await prisma.review.findMany({
    where: { userId },
    select: { showId: true },
  });
  return reviews.map((r) => r.showId);
}

export async function getAnonymousReviewedShowIds(
  ip: string,
): Promise<number[]> {
  const reviews = await prisma.review.findMany({
    where: { ip, userId: null },
    select: { showId: true },
  });
  return reviews.map((r) => r.showId);
}
