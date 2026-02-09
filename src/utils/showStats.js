export function getAverageRating(reviews) {
  if (!reviews || !reviews.length) return null;
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return total / reviews.length;
}

export function getLatestReviewDate(reviews) {
  if (!reviews || !reviews.length) return null;
  return reviews.reduce((latest, review) => {
    const reviewDate = new Date(review.date);
    if (Number.isNaN(reviewDate.getTime())) return latest;
    return !latest || reviewDate > latest ? reviewDate : latest;
  }, null);
}

export function getShowStats(show) {
  const reviews = show?.reviews ?? [];
  return {
    reviewCount: reviews.length,
    avgRating: getAverageRating(reviews),
    latestReviewDate: getLatestReviewDate(reviews),
  };
}

export function enrichShow(show) {
  return {
    ...show,
    ...getShowStats(show),
  };
}
