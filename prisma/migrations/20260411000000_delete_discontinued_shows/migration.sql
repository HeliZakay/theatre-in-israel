-- Delete 43 discontinued shows no longer on their theatres' websites.
--
-- Deletion order:
--   1. Review, Watchlist (onDelete: Restrict — must delete before Show)
--   2. Show (onDelete: Cascade auto-deletes: Event, ShowGenre, ShowActor)

-- 1. Delete reviews (Restrict constraint)
DELETE FROM "Review"
WHERE "showId" IN (
  76, 79, 102, 107, 110, 111, 149, 158, 174, 175,
  178, 179, 181, 185, 186, 188, 189, 190, 191, 192,
  193, 197, 203, 204, 205, 210, 213, 216, 217, 219,
  220, 223, 226, 228, 230, 231, 232, 233, 238, 239,
  255, 259, 273
);

-- 2. Delete watchlist entries (Restrict constraint)
DELETE FROM "Watchlist"
WHERE "showId" IN (
  76, 79, 102, 107, 110, 111, 149, 158, 174, 175,
  178, 179, 181, 185, 186, 188, 189, 190, 191, 192,
  193, 197, 203, 204, 205, 210, 213, 216, 217, 219,
  220, 223, 226, 228, 230, 231, 232, 233, 238, 239,
  255, 259, 273
);

-- 3. Delete the 43 shows (cascades: Event, ShowGenre, ShowActor)
DELETE FROM "Show"
WHERE id IN (
  76, 79, 102, 107, 110, 111, 149, 158, 174, 175,
  178, 179, 181, 185, 186, 188, 189, 190, 191, 192,
  193, 197, 203, 204, 205, 210, 213, 216, 217, 219,
  220, 223, 226, 228, 230, 231, 232, 233, 238, 239,
  255, 259, 273
);
