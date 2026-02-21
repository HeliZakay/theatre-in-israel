-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_showId_fkey";

-- DropForeignKey
ALTER TABLE "Watchlist" DROP CONSTRAINT "Watchlist_showId_fkey";

-- AddForeignKey (Restrict: prevent show deletion while reviews exist)
ALTER TABLE "Review" ADD CONSTRAINT "Review_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey (Restrict: prevent show deletion while watchlist entries exist)
ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
