-- Migration: Add new all_theatres shows
-- Generated on 2026-03-06T16:57:13.397Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('מוזיקלי') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('סאטירה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קומדיה') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('בדיחה', 'בדיחה', 'תיאטרון תמונע', 150, 'בדיחה הוא קברט אנטי-טוטליטרי המשלב שירים מהעידן הסובייטי, חקר ההומור והאכזריות, והפנטזיות על העתיד.', 'הקברט מבוסס על טקסטים של המחברים מהעידן הסובייטי. ב''בדיחה'' אנחנו שוחים בים של ניצוצות וצבעים עזים, מתבדחים על העבר שלנו ועל הפנטזיות לגבי העתיד. הקברט אנטי-טוטליטרי מספר איך בהתחלה הכול נראה מצחיק, ואי אפשר להאמין באכזריות. *המופע ברוסית עם כתוביות בעברית', 'קבוצת Fulcro') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'בדיחה' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'בדיחה' AND g.name = 'סאטירה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'בדיחה' AND g.name = 'מוזיקלי' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
