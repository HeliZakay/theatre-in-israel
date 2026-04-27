-- AlterTable
ALTER TABLE "Show" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill: existing rows get a far-past date so none flash as "new" on deploy.
-- Going forward, the column default (now()) applies to new rows.
UPDATE "Show" SET "createdAt" = '2020-01-01T00:00:00Z';
