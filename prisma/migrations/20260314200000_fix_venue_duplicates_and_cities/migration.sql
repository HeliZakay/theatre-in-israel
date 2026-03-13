-- Fix venue duplicates and incorrect cities
-- This migration:
--   1. Merges duplicate venues (moves events to canonical venue, deletes duplicate)
--   2. Fixes incorrect city values
--   3. Renames venues for consistency

-- ============================================================================
-- MERGES — move events from duplicate venue to canonical, then delete duplicate
-- ============================================================================

-- 4. מוזה היכל התרבות חוף הכרמל → היכל התרבות חוף הכרמל
UPDATE "Event"
SET "venueId" = (SELECT id FROM "Venue" WHERE name = 'היכל התרבות חוף הכרמל' AND city = 'תל אביב')
WHERE "venueId" = (SELECT id FROM "Venue" WHERE name = 'מוזה היכל התרבות חוף הכרמל' AND city = 'תל אביב');
DELETE FROM "Venue" WHERE name = 'מוזה היכל התרבות חוף הכרמל' AND city = 'תל אביב';

-- 8. תיאטרון חולון - בית יד לבנים → תיאטרון חולון
UPDATE "Event"
SET "venueId" = (SELECT id FROM "Venue" WHERE name = 'תיאטרון חולון' AND city = 'חולון')
WHERE "venueId" = (SELECT id FROM "Venue" WHERE name = 'תיאטרון חולון - בית יד לבנים' AND city = 'חולון');
DELETE FROM "Venue" WHERE name = 'תיאטרון חולון - בית יד לבנים' AND city = 'חולון';

-- 9. המשכן לאומנויות הבמה אשדוד → המשכן לאמנויות הבמה אשדוד
UPDATE "Event"
SET "venueId" = (SELECT id FROM "Venue" WHERE name = 'המשכן לאמנויות הבמה אשדוד' AND city = 'אשדוד')
WHERE "venueId" = (SELECT id FROM "Venue" WHERE name = 'המשכן לאומנויות הבמה אשדוד' AND city = 'אשדוד');
DELETE FROM "Venue" WHERE name = 'המשכן לאומנויות הבמה אשדוד' AND city = 'אשדוד';

-- 10. היכל התרבות חבל מודיעין → היכל התרבות אייפורט סיטי
-- Note: duplicate venue has city "איירפורט סיטי" (with ר before פ)
UPDATE "Event"
SET "venueId" = (SELECT id FROM "Venue" WHERE name = 'היכל התרבות אייפורט סיטי' AND city = 'אייפורט סיטי')
WHERE "venueId" = (SELECT id FROM "Venue" WHERE name = 'היכל התרבות חבל מודיעין' AND city = 'איירפורט סיטי');
DELETE FROM "Venue" WHERE name = 'היכל התרבות חבל מודיעין' AND city = 'איירפורט סיטי';

-- 12. היכל התיאטרון (קרית מוצקין) → היכל התיאטרון קריית מוצקין
UPDATE "Event"
SET "venueId" = (SELECT id FROM "Venue" WHERE name = 'היכל התיאטרון קריית מוצקין' AND city = 'קריית מוצקין')
WHERE "venueId" = (SELECT id FROM "Venue" WHERE name = 'היכל התיאטרון' AND city = 'קרית מוצקין');
DELETE FROM "Venue" WHERE name = 'היכל התיאטרון' AND city = 'קרית מוצקין';

-- 13. הכיל התרבות - בית העם רחובות → בית העם רחובות
UPDATE "Event"
SET "venueId" = (SELECT id FROM "Venue" WHERE name = 'בית העם רחובות' AND city = 'רחובות')
WHERE "venueId" = (SELECT id FROM "Venue" WHERE name = 'הכיל התרבות - בית העם רחובות' AND city = 'רחובות');
DELETE FROM "Venue" WHERE name = 'הכיל התרבות - בית העם רחובות' AND city = 'רחובות';

-- Herzliya — typo אומנויות → אמנויות
UPDATE "Event"
SET "venueId" = (SELECT id FROM "Venue" WHERE name = 'היכל אמנויות הבמה הרצליה' AND city = 'הרצליה')
WHERE "venueId" = (SELECT id FROM "Venue" WHERE name = 'היכל אומנויות הבמה הרצליה' AND city = 'הרצליה');
DELETE FROM "Venue" WHERE name = 'היכל אומנויות הבמה הרצליה' AND city = 'הרצליה';

-- ============================================================================
-- RENAMES — fix city values and venue names
-- ============================================================================

-- 1. אולם המופעים יפעת — city → מועצה אזורית עמק יזרעאל
UPDATE "Venue" SET city = 'מועצה אזורית עמק יזרעאל'
WHERE name = 'אולם המופעים יפעת' AND city = 'לא ידוע';

-- 2. היכל התרבות מעלה אדומים — city → מעלה אדומים
UPDATE "Venue" SET city = 'מעלה אדומים'
WHERE name = 'היכל התרבות מעלה אדומים' AND city = 'תל אביב';

-- 3. היכל התרבות חוף הכרמל — city → חוף הכרמל
UPDATE "Venue" SET city = 'חוף הכרמל'
WHERE name = 'היכל התרבות חוף הכרמל' AND city = 'תל אביב';

-- 5. היכל התרבות דרום השרון — city → נווה ירק
UPDATE "Venue" SET city = 'נווה ירק'
WHERE name = 'היכל התרבות דרום השרון' AND city = 'תל אביב';

-- 6. תיאטרון היהלום → תיאטרון היהלום רמת גן
UPDATE "Venue" SET name = 'תיאטרון היהלום רמת גן'
WHERE name = 'תיאטרון היהלום' AND city = 'רמת גן';

-- 7. אולם מופעים גבעת ברנר — city → גבעת ברנר
UPDATE "Venue" SET city = 'גבעת ברנר'
WHERE name = 'אולם מופעים גבעת ברנר' AND city = 'לא ידוע';

-- 11. המשכן לאמנויות הבמה → המשכן לאמנויות הבמה תל אביב
UPDATE "Venue" SET name = 'המשכן לאמנויות הבמה תל אביב'
WHERE name = 'המשכן לאמנויות הבמה' AND city = 'תל אביב';
