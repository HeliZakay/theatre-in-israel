-- AlterTable
ALTER TABLE "Show" ADD COLUMN "avgRating" DOUBLE PRECISION,
ADD COLUMN "reviewCount" INTEGER NOT NULL DEFAULT 0;

-- Backfill existing data from reviews
UPDATE "Show" s
SET "avgRating" = sub.avg_rating,
    "reviewCount" = sub.review_count
FROM (
  SELECT "showId",
         AVG(rating)::double precision AS avg_rating,
         COUNT(*)::integer AS review_count
  FROM "Review"
  GROUP BY "showId"
) sub
WHERE s.id = sub."showId";

-- CreateIndex
CREATE INDEX "Show_theatre_idx" ON "Show"("theatre");

-- CreateIndex
CREATE INDEX "Show_avgRating_idx" ON "Show"("avgRating");
