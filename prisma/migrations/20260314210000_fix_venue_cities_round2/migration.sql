-- Fix venue cities round 2: wrong cities, remaining duplicates, unknown cities

-- ============================================================================
-- MERGES — duplicates
-- ============================================================================

-- בית החייל - תל אביב → בית החייל תל אביב (same venue, different dash format)
UPDATE "Event"
SET "venueId" = (SELECT id FROM "Venue" WHERE name = 'בית החייל תל אביב' AND city = 'תל אביב')
WHERE "venueId" = (SELECT id FROM "Venue" WHERE name = 'בית החייל - תל אביב' AND city = 'תל אביב');
DELETE FROM "Venue" WHERE name = 'בית החייל - תל אביב' AND city = 'תל אביב';

-- היכל התרבות (בת ים) → היכל התרבות בת ים (bare name vs full name)
UPDATE "Event"
SET "venueId" = (SELECT id FROM "Venue" WHERE name = 'היכל התרבות בת ים' AND city = 'תל אביב')
WHERE "venueId" = (SELECT id FROM "Venue" WHERE name = 'היכל התרבות' AND city = 'בת ים');
DELETE FROM "Venue" WHERE name = 'היכל התרבות' AND city = 'בת ים';

-- צוותא (תל אביב-יפו) → תיאטרון צוותא (תל אביב)
UPDATE "Event"
SET "venueId" = (SELECT id FROM "Venue" WHERE name = 'תיאטרון צוותא' AND city = 'תל אביב')
WHERE "venueId" = (SELECT id FROM "Venue" WHERE name = 'צוותא' AND city = 'תל אביב-יפו');
DELETE FROM "Venue" WHERE name = 'צוותא' AND city = 'תל אביב-יפו';

-- ============================================================================
-- CITY FIXES — venues with wrong city "תל אביב"
-- ============================================================================

UPDATE "Venue" SET city = 'אריאל'
WHERE name = 'היכל התרבות אריאל' AND city = 'תל אביב';

UPDATE "Venue" SET city = 'בת ים'
WHERE name = 'היכל התרבות בת ים' AND city = 'תל אביב';

UPDATE "Venue" SET city = 'יבנה'
WHERE name = 'היכל התרבות יבנה' AND city = 'תל אביב';

UPDATE "Venue" SET city = 'כרמיאל'
WHERE name = 'היכל התרבות כרמיאל' AND city = 'תל אביב';

UPDATE "Venue" SET city = 'עכו'
WHERE name = 'היכל התרבות עכו' AND city = 'תל אביב';

UPDATE "Venue" SET city = 'עפולה'
WHERE name = 'היכל התרבות עפולה' AND city = 'תל אביב';

UPDATE "Venue" SET city = 'ראש העין'
WHERE name = 'היכל התרבות ראש העין' AND city = 'תל אביב';

-- ============================================================================
-- CITY FIXES — venues with "לא ידוע"
-- ============================================================================

UPDATE "Venue" SET city = 'תל מונד'
WHERE name = 'מתנ"ס תל מונד' AND city = 'לא ידוע';

UPDATE "Venue" SET city = 'גלילות'
WHERE name = 'סינמה סיטי גלילות' AND city = 'לא ידוע';

UPDATE "Venue" SET city = 'יגור'
WHERE name = 'תיאטרון יד למגינים יגור' AND city = 'לא ידוע';
