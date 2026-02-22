-- Step 1: Add slug column as nullable first
ALTER TABLE "Show" ADD COLUMN "slug" TEXT;

-- Step 2: Backfill slugs from titles
-- Uses the same logic as generateSlug():
--   trim → replace spaces with hyphens → replace ASCII apostrophe with Hebrew geresh
--   → strip URL-reserved chars → collapse consecutive hyphens → strip leading/trailing hyphens
UPDATE "Show"
SET "slug" = TRIM(BOTH '-' FROM
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REPLACE(
            TRIM("title"),
            ' ', '-'
          ),
          '''', E'\u05F3', 'g'
        ),
        '[?#%|\\/:*"<>]', '-', 'g'
      ),
      '-+', '-', 'g'
    ),
    '^-|-$', '', 'g'
  )
);

-- Step 3: Make slug NOT NULL and add unique index
ALTER TABLE "Show" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Show_slug_key" ON "Show"("slug");
