-- Migration: Add show מעריב with venue and event
-- Generated on 2026-04-11
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Show
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast")
VALUES (
  'מעריב',
  'מעריב',
  'הפקות עצמאיות',
  60,
  'אב ובנו מתמודדים עם זיכרון אירוע שהתחולל בעבר והכל במסגרת של הצגה בתוך הצגה.',
  'הצגה בהשראת סיפור קצר של יהושע קנז ז"ל ("האורחת"), מבכירי הסופרים של ישראל, שהעין החדה שלו מיטיבה תמיד לאבחן את מסתורי הנפש של הדמויות, ויודעת להביט בהן בתערובת של שעשוע וחמלה.',
  'עודד בן ידידיה, מוטי סבג, ניסו כאביה, איילת כנרת, ענת מידן'
) ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 2. Insert Venue
-- ============================================================
INSERT INTO "Venue" (name, city, regions)
VALUES ('תיאטרון בית אלפא', 'בית אלפא', ARRAY['center', 'north'])
ON CONFLICT (name, city) DO NOTHING;

-- ============================================================
-- 3. Insert Event
-- ============================================================
INSERT INTO "Event" ("showId", "venueId", "date", "hour")
SELECT s.id, v.id, '2026-05-20'::date, '20:30'
FROM "Show" s, "Venue" v
WHERE s.slug = 'מעריב'
  AND v.name = 'תיאטרון בית אלפא'
  AND v.city = 'בית אלפא'
ON CONFLICT ("showId", "venueId", "date", "hour") DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Venue"', 'id'), (SELECT MAX(id) FROM "Venue"));
SELECT setval(pg_get_serial_sequence('"Event"', 'id'), (SELECT MAX(id) FROM "Event"));
