-- AlterTable: convert Venue.region (nullable text) to Venue.regions (text array)
ALTER TABLE "Venue" ADD COLUMN "regions" TEXT[] NOT NULL DEFAULT '{}';

-- Migrate existing data: copy single region into the array
UPDATE "Venue" SET "regions" = ARRAY["region"] WHERE "region" IS NOT NULL;

-- Drop old column
ALTER TABLE "Venue" DROP COLUMN "region";
