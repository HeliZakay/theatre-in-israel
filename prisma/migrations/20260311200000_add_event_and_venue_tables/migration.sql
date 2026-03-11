-- CreateTable
CREATE TABLE "Venue" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" SERIAL NOT NULL,
    "showId" INTEGER NOT NULL,
    "venueId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "hour" TEXT NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Venue_name_city_key" ON "Venue"("name", "city");

-- CreateIndex
CREATE INDEX "Event_showId_idx" ON "Event"("showId");

-- CreateIndex
CREATE INDEX "Event_venueId_idx" ON "Event"("venueId");

-- CreateIndex
CREATE INDEX "Event_date_idx" ON "Event"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Event_showId_venueId_date_hour_key" ON "Event"("showId", "venueId", "date", "hour");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
