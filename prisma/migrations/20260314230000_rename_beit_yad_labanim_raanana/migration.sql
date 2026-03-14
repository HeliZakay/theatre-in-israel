-- Rename venue "בית יד לבנים" (רעננה) → "בית יד לבנים רעננה"
-- Safely handles the case where the old name doesn't exist (no-op)
-- or the new name already exists (merge events into new venue).

-- If new venue already exists, move events from old to new, then delete old
UPDATE "Event"
SET "venueId" = (SELECT id FROM "Venue" WHERE name = 'בית יד לבנים רעננה' AND city = 'רעננה')
WHERE "venueId" = (SELECT id FROM "Venue" WHERE name = 'בית יד לבנים' AND city = 'רעננה')
  AND EXISTS (SELECT 1 FROM "Venue" WHERE name = 'בית יד לבנים רעננה' AND city = 'רעננה')
  AND EXISTS (SELECT 1 FROM "Venue" WHERE name = 'בית יד לבנים' AND city = 'רעננה');

DELETE FROM "Venue"
WHERE name = 'בית יד לבנים' AND city = 'רעננה'
  AND EXISTS (SELECT 1 FROM "Venue" WHERE name = 'בית יד לבנים רעננה' AND city = 'רעננה');

-- If new venue does NOT exist, just rename the old one
UPDATE "Venue"
SET name = 'בית יד לבנים רעננה'
WHERE name = 'בית יד לבנים' AND city = 'רעננה';
