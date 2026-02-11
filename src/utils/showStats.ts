import type { Review, Show, EnrichedShow } from "@/types";

export function getAverageRating(
  reviews: Review[] | undefined | null,
): number | null {
  if (!reviews || !reviews.length) return null;
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return total / reviews.length;
}

export function getLatestReviewDate(
  reviews: Review[] | undefined | null,
): Date | null {
  if (!reviews || !reviews.length) return null;
  return reviews.reduce<Date | null>((latest, review) => {
    const reviewDate = new Date(review.date);
    if (Number.isNaN(reviewDate.getTime())) return latest;
    return !latest || reviewDate > latest ? reviewDate : latest;
  }, null);
}

export function getShowStats(show: Show | null | undefined): {
  reviewCount: number;
  avgRating: number | null;
  latestReviewDate: Date | null;
} {
  const reviews = show?.reviews ?? [];
  return {
    reviewCount: reviews.length,
    avgRating: getAverageRating(reviews),
    latestReviewDate: getLatestReviewDate(reviews),
  };
}

export function enrichShow(show: Show): EnrichedShow {
  return {
    ...show,
    ...getShowStats(show),
  };
}
