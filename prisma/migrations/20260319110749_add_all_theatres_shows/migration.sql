-- Migration: Add new all_theatres shows
-- Generated on 2026-03-19T11:07:49.526Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('דרמה קומית') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('סאטירה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קומדיה') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('Frau Marlene', 'Frau-Marlene', 'תיאטרון תמונע', 50, 'מופע דראג עוצמתי המשלב ליפסינק וסטנד-אפ, חוקר את זהות האישה במאה ה-21 דרך דמויות מגוונות ואמיצות.', 'פראו מרלן מזמינה אתכם למופע דראג שלא מתנצל על כלום. בליפסינק, סטנד־אפ ומונולוגים נולדת האישה של המאה ה־21: היא יכולה להיות מדענית או חשפנית, פוליטיקאית או מורה – ותמיד יהיה שם מישהו “עם ביצים” שירוויח יותר. ובכל זאת, אנחנו נושמות, עובדות, אוהבות, צוחקות, כועסות, רוקדות ומגשימות חלומות.', 'ניקיטה גולדמן') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'Frau-Marlene' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'Frau-Marlene' AND g.name = 'דרמה קומית' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'Frau-Marlene' AND g.name = 'סאטירה' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
