-- AlterTable
ALTER TABLE "Review" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Show" ADD COLUMN     "description" TEXT;
