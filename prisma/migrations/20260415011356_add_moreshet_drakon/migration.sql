-- Migration: Add show מורשתו של דרקון to הפקות עצמאיות
-- Generated on 2026-04-15
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres (idempotent)
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('דרמה') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Show
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('מורשתו של דרקון', 'מורשתו-של-דרקון', 'הפקות עצמאיות', 80, E'הצגה שכל שדיקטטור ימהר לסגור.\nלמה אנחנו מאפשרים לדרקונים לנהל את העולם?\nהאם אפשר להיפתר מדרקון?\nמהי מורשתו של דרקון?', E'מחזה מקורי, עפ"י תסריט של גריגורי גורין, עפ"י מחזה של יבגני שוורץ, עפ"י אגדות עם.\nבעיירה אל זמנית שולט דרקון. פעם בשנה העיירה צריכה להקריב לו את הבחורה הטובה ביותר. אבל יום אחד מגיע לעיירה אביר נודד. האם אפשר להרוג את הדרקון ומהי מורשתו של הדרקון המושרשת עמוק בתוך כל אחד ואחת מתושבי העיירה?', 'ולאדי פסחוביץ'', דיאנה פלייר, איוון זבשטה, איתמר זנדני, סנדרו זילדמן, ויקטוריה קברמובה.') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מורשתו-של-דרקון' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
