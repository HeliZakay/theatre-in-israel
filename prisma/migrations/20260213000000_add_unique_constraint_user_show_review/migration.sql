-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_showId_key" ON "Review"("userId", "showId");
