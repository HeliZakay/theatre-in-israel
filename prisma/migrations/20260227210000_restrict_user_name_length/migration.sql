-- Truncate existing names that exceed the new limit
UPDATE "User" SET name = LEFT(name, 20) WHERE LENGTH(name) > 20;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "name" SET DATA TYPE VARCHAR(20);
