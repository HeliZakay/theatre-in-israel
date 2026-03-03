-- Migration: Add new all_theatres shows
-- Generated on 2026-03-03T21:35:44.302Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('אינטימי') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קומדיה') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('מיינדפאק', 'מיינדפאק', 'תיאטרון צוותא', 60, 'אורית זפרן במופע קומי-דרמטי על ניצחון אישי, חקירת זהות ושורשים משפחתיים, המשלב צחוק עם רגעים נוגעים ללב.', 'מופע המשלב סטנד אפ וסטנד דאון, בו אורית זפרן חוגגת את ניצחונה על הנאצים, פושטת את זהותה כדור שני לשואה ומביאה זכרונות משפחתיים תוך כדי חקירה של נשיות ואמהות.', 'אורית זפרן') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מיינדפאק' AND g.name = 'אינטימי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מיינדפאק' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
