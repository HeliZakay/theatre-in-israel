-- Migration: Add new all_theatres shows
-- Generated on 2026-04-09T08:27:03.182Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('מחזמר') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מרגש') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קומדיה') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('לעלות על הציקלון', 'לעלות-על-הציקלון', 'הפקות עצמאיות', 100, 'מחזמר קומי ופרוע המשלב הומור וסגנונות מוזיקליים מגוונים, ומציג תחרות מרגשת על החיים.', 'לאחר שנהרגו בתאונת רכבת הרים, מקהלה של שישה תלמידי תיכון פוגשת את הקרנק - רובוט מגיד עתידות שמבשר להם שבכוחו להשיב אחד מהם לחיים. כדי לזכות בהזדמנות הנחשקת, מתחרים ביניהם התלמידים המתים הטריים בתחרות מוזיקלית: כל אחד שר שיר שמביע את התשוקות ואת החלומות שלא העז לבטא במהלך חייו. כך מתגלה העולם הפנימי של כל אחת מהדמויות, והסודות העמוקים ביותר נחשפים בפני שאר התלמידים.

״לעלות על הציקלון״ הוא מחזמר קומי ופרוע שמשלב בין הומור חד, סגנונות מוזיקליים מגוונים ורגעים מרגשים. מי האחד שינצח בתחרות ויחזור לחיים?', 'לירי שירב, שגיא שולמן, טל יאביץ, יובל בקר, יעל אינטרטר, אופיר קימברג, ניר רוזנטל, שי ערבה') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'לעלות-על-הציקלון' AND g.name = 'מחזמר' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'לעלות-על-הציקלון' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'לעלות-על-הציקלון' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
