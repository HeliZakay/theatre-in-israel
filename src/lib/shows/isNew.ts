import {
  NEW_SHOW_MAX_REVIEWS,
  NEW_SHOW_WINDOW_DAYS,
} from "@/constants/newShows";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// "New" means: the Show row was created in our DB within NEW_SHOW_WINDOW_DAYS
// and still has fewer than NEW_SHOW_MAX_REVIEWS reviews. The badge retires
// once the show earns its own ratings — it exists to soften the empty-rating
// state for freshly added shows, not as a permanent recency tag.
//
// Note: createdAt reflects when the row entered our DB, not when the
// production opened. Revivals/restagings of an existing slug won't be flagged.
export function isShowNew(show: {
  createdAt: Date;
  reviewCount: number;
}): boolean {
  if (show.reviewCount >= NEW_SHOW_MAX_REVIEWS) return false;
  const ageMs = Date.now() - show.createdAt.getTime();
  return ageMs <= NEW_SHOW_WINDOW_DAYS * MS_PER_DAY;
}

export function getNewShowCutoffDate(): Date {
  return new Date(Date.now() - NEW_SHOW_WINDOW_DAYS * MS_PER_DAY);
}
