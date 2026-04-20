-- Delete all events at תיאטרון מלנקי venue.
-- The homepage schedule was incomplete and produced stale/incorrect dates.
-- Event scraping for Malenki is now disabled.
DELETE FROM "Event"
WHERE "venueId" IN (
  SELECT "id" FROM "Venue" WHERE "name" = 'תיאטרון מלנקי'
);
