-- Remove duplicate "אחינועם ואני" from Tzavta theatre.
-- The show belongs to Incubator theatre (slug: אחינועם-ואני-תיאטרון-האינקובטור).
-- The Tzavta copy (slug: אחינועם-ואני) was created in error.
--
-- Strategy:
--   1. Migrate any reviews/watchlist entries to the Incubator show (preserves user data)
--   2. Delete the Tzavta show (cascades: events, genres, actors)

-- ============================================================
-- 1. Migrate Reviews (onDelete: Restrict — must move before delete)
-- ============================================================
-- Delete reviews that would violate unique(userId, showId) after re-pointing
-- (i.e. user already has a review on the Incubator show).
DELETE FROM "Review"
WHERE "showId" = (SELECT id FROM "Show" WHERE slug = 'אחינועם-ואני')
  AND "userId" IS NOT NULL
  AND "userId" IN (
    SELECT r2."userId" FROM "Review" r2
    WHERE r2."showId" = (SELECT id FROM "Show" WHERE slug = 'אחינועם-ואני-תיאטרון-האינקובטור')
      AND r2."userId" IS NOT NULL
  );

-- Re-point remaining Tzavta reviews to the Incubator show
UPDATE "Review"
SET "showId" = (SELECT id FROM "Show" WHERE slug = 'אחינועם-ואני-תיאטרון-האינקובטור')
WHERE "showId" = (SELECT id FROM "Show" WHERE slug = 'אחינועם-ואני');

-- ============================================================
-- 2. Migrate Watchlist entries (onDelete: Restrict — must move before delete)
-- ============================================================
-- Delete entries that would conflict (user already watchlisted Incubator version)
DELETE FROM "Watchlist"
WHERE "showId" = (SELECT id FROM "Show" WHERE slug = 'אחינועם-ואני')
  AND "userId" IN (
    SELECT w2."userId" FROM "Watchlist" w2
    WHERE w2."showId" = (SELECT id FROM "Show" WHERE slug = 'אחינועם-ואני-תיאטרון-האינקובטור')
  );

-- Re-point remaining Tzavta watchlist entries to the Incubator show
UPDATE "Watchlist"
SET "showId" = (SELECT id FROM "Show" WHERE slug = 'אחינועם-ואני-תיאטרון-האינקובטור')
WHERE "showId" = (SELECT id FROM "Show" WHERE slug = 'אחינועם-ואני');

-- ============================================================
-- 3. Delete the Tzavta show (cascades: Event, ShowGenre, ShowActor)
-- ============================================================
DELETE FROM "Show" WHERE slug = 'אחינועם-ואני';

-- ============================================================
-- 4. Recalculate review stats for the Incubator show
-- ============================================================
UPDATE "Show"
SET
  "reviewCount" = sub.cnt,
  "avgRating" = sub.avg
FROM (
  SELECT "showId", COUNT(*) AS cnt, AVG("rating")::float AS avg
  FROM "Review"
  WHERE "showId" = (SELECT id FROM "Show" WHERE slug = 'אחינועם-ואני-תיאטרון-האינקובטור')
  GROUP BY "showId"
) sub
WHERE "Show".id = sub."showId";

-- If no reviews exist, ensure stats are zeroed out
UPDATE "Show"
SET "reviewCount" = 0, "avgRating" = NULL
WHERE slug = 'אחינועם-ואני-תיאטרון-האינקובטור'
  AND NOT EXISTS (
    SELECT 1 FROM "Review"
    WHERE "showId" = (SELECT id FROM "Show" WHERE slug = 'אחינועם-ואני-תיאטרון-האינקובטור')
  );
