-- AlterTable
ALTER TABLE "Review" ADD COLUMN "ip" TEXT;

-- CreateIndex
CREATE INDEX "Review_ip_showId_idx" ON "Review"("ip", "showId");
