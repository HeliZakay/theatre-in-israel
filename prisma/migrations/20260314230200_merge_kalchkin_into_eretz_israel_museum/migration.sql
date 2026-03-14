-- Merge venue "אודיטוריום ע"ש קלצ'קין" into "מוזיאון ארץ ישראל - תל אביב"
-- (Kalchkin auditorium is inside the Eretz Israel Museum)

-- Move all events from Kalchkin to the museum venue
UPDATE "Event"
SET "venueId" = (SELECT id FROM "Venue" WHERE name = 'מוזיאון ארץ ישראל - תל אביב' AND city = 'תל אביב')
WHERE "venueId" = (SELECT id FROM "Venue" WHERE name = 'אודיטוריום ע"ש קלצ''קין' AND city = 'תל אביב')
  AND EXISTS (SELECT 1 FROM "Venue" WHERE name = 'מוזיאון ארץ ישראל - תל אביב' AND city = 'תל אביב')
  AND EXISTS (SELECT 1 FROM "Venue" WHERE name = 'אודיטוריום ע"ש קלצ''קין' AND city = 'תל אביב');

-- Delete the now-empty Kalchkin venue
DELETE FROM "Venue"
WHERE name = 'אודיטוריום ע"ש קלצ''קין' AND city = 'תל אביב';
