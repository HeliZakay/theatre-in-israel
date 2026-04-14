-- Migration: Add show חי שחור ביער to הפקות עצמאיות
-- Generated on 2026-04-15
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres (idempotent)
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('דרמה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('דוקומנטרי') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Show
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('חי שחור ביער', 'חי-שחור-ביער', 'הפקות עצמאיות', 80, 'יצירה אוטוביוגרפית מאת אוריין ליפשיץ ובה קטעי זכרונות מחוקים שהוסתרו לאורך שנים.', E'איש עם כובע חודר לעולם התיאטרון ומעורר אצל הבמאית עימות עם חייה הקודמים.\nהיא פוגשת את מי שהיתה לפני שהחליפה את שמה.\nמסע שמחבר בין כרוז לוויות ליללות שועלים, בין במה נקבה לחיה פרועה, בין רצח של זבוב לראיון בלאישה.\nאוטוביוגרפיה דמיונית על מסע של שחרור ונקמה בטעם גפילטע.', 'יוסף אלבלק, עדילי ליברמן, עדן סלטר, אורן הגני') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'חי-שחור-ביער' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'חי-שחור-ביער' AND g.name = 'דוקומנטרי' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Insert Events (venue resolved by name+city, safe across envs)
-- ============================================================
INSERT INTO "Event" ("showId", "venueId", date, hour) SELECT s.id, v.id, DATE '2026-04-16', '20:00' FROM "Show" s, "Venue" v WHERE s.slug = 'חי-שחור-ביער' AND v.name = 'תיאטרון הבית ת"א' AND v.city = 'תל אביב' ON CONFLICT DO NOTHING;
INSERT INTO "Event" ("showId", "venueId", date, hour) SELECT s.id, v.id, DATE '2026-04-17', '14:00' FROM "Show" s, "Venue" v WHERE s.slug = 'חי-שחור-ביער' AND v.name = 'תיאטרון הבית ת"א' AND v.city = 'תל אביב' ON CONFLICT DO NOTHING;
INSERT INTO "Event" ("showId", "venueId", date, hour) SELECT s.id, v.id, DATE '2026-04-18', '20:00' FROM "Show" s, "Venue" v WHERE s.slug = 'חי-שחור-ביער' AND v.name = 'תיאטרון הבית ת"א' AND v.city = 'תל אביב' ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
SELECT setval(pg_get_serial_sequence('"Event"', 'id'), (SELECT MAX(id) FROM "Event"));
