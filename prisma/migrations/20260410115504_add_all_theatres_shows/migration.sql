-- Migration: Add new all_theatres shows
-- Generated on 2026-04-10T11:55:04.353Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('דרמה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מרגש') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('רומנטי') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('האשליה', 'האשליה', 'תיאטרון הקאמרי', 90, 'דרמה מרגשת על חיפוש אחרי אהבה ואובדן, כאשר רז מתמודד עם זיכרונותיו מאביגיל בעזרת מכשפה המגלה לו את האמת המסתתרת.', 'שנה אחרי הפרידה רז עדיין לא מצליח לשחרר מאביגיל. לילה אחד על חוף הים הוא מנסה סוף-סוף לפגוש מישהי חדשה, אבל הלב נשאר שבור. רגע לפני שהוא בורח בהתנצלות, הדייט שלו מתוודה שהיא בעצם סוג של מכשפה, ומציעה לו להגשים את משאלת ליבו הכמוסה: לראות מה קרה לאביגיל בשנה שחלפה מאז שנעלמה מחייו. חיזיון אחר חיזיון, רז צופה באביגיל נודדת בין מפגשים ליליים ונחשף לכל מה שהיא יכולה להיות כשהיא לא איתו.', 'נאיה בינשטוק, אנה בנימין, ענבל בר - לב, אלינור וייל, וורקו מקונן, נדב עדר, אורי פרלמן, עמית שושני') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'האשליה' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'האשליה' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'האשליה' AND g.name = 'רומנטי' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
