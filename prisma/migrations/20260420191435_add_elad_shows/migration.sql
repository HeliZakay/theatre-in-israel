-- Migration: Add new elad shows
-- Generated on 2026-04-20T19:14:35.863Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('מוזיקלי') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מרגש') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('Reefresh', 'Reefresh', 'תיאטרון אלעד', 60, 'מופע תיאטרון מוזיקלי בריף הדולפינים', 'מוסיקה, תשוקות ודג זהב אחד.

אחד שבורח ממשהו, אחת שבורחת למשהו, אחד שזורם, אחד שנמנע ואחת שוחה עם הזרם עד שיום אחד נמאס לה, נפגשים קרוב מאד למים.
והמים- זוכרים הכל.

בואו לערב עם הרבה זרמים תת קרקעיים, מוסיקה, שירה, ים ודולפינים', NULL) ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'Reefresh' AND g.name = 'מוזיקלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'Reefresh' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
