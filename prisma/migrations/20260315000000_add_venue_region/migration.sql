-- Add region column to Venue
ALTER TABLE "Venue" ADD COLUMN "region" TEXT;

-- Replace standalone date index with composite (date, showId, venueId)
DROP INDEX IF EXISTS "Event_date_idx";
CREATE INDEX "Event_date_showId_venueId_idx" ON "Event"("date", "showId", "venueId");
