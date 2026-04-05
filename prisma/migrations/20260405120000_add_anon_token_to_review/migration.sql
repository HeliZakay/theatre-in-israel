-- AlterTable
ALTER TABLE "Review" ADD COLUMN "anonToken" TEXT;

-- CreateIndex
CREATE INDEX "Review_anonToken_showId_idx" ON "Review"("anonToken", "showId");
