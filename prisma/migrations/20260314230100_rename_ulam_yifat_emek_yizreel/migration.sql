-- Rename venue "אולם המופעים יפעת" → "אולם המופעים יפעת עמק יזרעאל"

-- If new venue already exists, merge events from old to new, then delete old
UPDATE "Event"
SET "venueId" = (SELECT id FROM "Venue" WHERE name = 'אולם המופעים יפעת עמק יזרעאל' AND city = 'מועצה אזורית עמק יזרעאל')
WHERE "venueId" = (SELECT id FROM "Venue" WHERE name = 'אולם המופעים יפעת' AND city = 'מועצה אזורית עמק יזרעאל')
  AND EXISTS (SELECT 1 FROM "Venue" WHERE name = 'אולם המופעים יפעת עמק יזרעאל' AND city = 'מועצה אזורית עמק יזרעאל')
  AND EXISTS (SELECT 1 FROM "Venue" WHERE name = 'אולם המופעים יפעת' AND city = 'מועצה אזורית עמק יזרעאל');

DELETE FROM "Venue"
WHERE name = 'אולם המופעים יפעת' AND city = 'מועצה אזורית עמק יזרעאל'
  AND EXISTS (SELECT 1 FROM "Venue" WHERE name = 'אולם המופעים יפעת עמק יזרעאל' AND city = 'מועצה אזורית עמק יזרעאל');

-- If new venue does NOT exist, just rename the old one
UPDATE "Venue"
SET name = 'אולם המופעים יפעת עמק יזרעאל'
WHERE name = 'אולם המופעים יפעת' AND city = 'מועצה אזורית עמק יזרעאל';
