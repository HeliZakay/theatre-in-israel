-- Migration: Add new all_theatres shows
-- Generated on 2026-02-27T10:34:07.658Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('דרמה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מרגש') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קומדיה') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('האמת', 'האמת', 'תיאטרון באר שבע', 75, 'קומדיה חדה וסקסית על סודות ושקרים בחיים, מאת המחזאי הצרפתי פלוריאן זלר.', 'מישל מנהל רומן עם אליס, נשואה לפול, חברו הטוב. החבורה מסתבכת בשקרים ואמיתות, והשאלה היא האם לשקר זה דבר רע.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('מותרת לכל אדם', 'מותרת-לכל-אדם', 'תיאטרון באר שבע', 90, 'דרמה מרגשת על מאבק נשים בישראל לשחרור מעול הנישואין, המלווה בשירה של איה כורם.', 'אפי מחליטה לסיים את נישואיה הלא מאושרים לבעז, אך הוא מסרב לתת לה גט. היא נאבקת על חירותה מול הדיינים וילדיה.') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'האמת' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'האמת' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מותרת-לכל-אדם' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מותרת-לכל-אדם' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
