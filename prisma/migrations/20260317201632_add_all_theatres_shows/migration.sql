-- Migration: Add new all_theatres shows
-- Generated on 2026-03-17T20:16:32.087Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('ילדים') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מוזיקלי') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מרגש') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('ממלכת קקופוניה', 'ממלכת-קקופוניה', 'תיאטרון צוותא', 105, 'מופע מוזיקלי אינטראקטיבי שבו משפחות יוצאות למסע מרגש להחזרת הרגשות האבודים לממלכת הרמוניה, תוך זיהוי והבעה של רגשות דרך שירה.', 'מופע מוזיקלי אינטראקטיבי לכל המשפחה, בו ילדים והורים יוצאים למסע מרגש בעקבות הרגשות האבודים של ממלכת הרמוניה. בממלכת הרמוניה הכול פועל בשיר ובהרמוניה מושלמת, אך בעקבות סערה עזה, הרגשות מתבלבלים והשירים נעלמים. המלכה ושני עוזריה צריכים עזרה כדי להחזיר את המוסיקה להרמוניה. הילדים וההורים במופע ייצאו יחד עם הדמויות למסע מרתק ומלא הומור, בו נלמד לזהות רגשות כמו פחד, עצב ושמחה, ונגלה כיצד אפשר להביע אותם דרך השירה.', 'ירון גושן (סנצ''ו) , מיכל מזר, בועז פינקוביץ, כתיבה: ירון גושן (סנצ''ו), מיכל מזר, בועז פינקוביץ, יותם קושניר וטלי רגב, הלחנת השיר') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'ממלכת-קקופוניה' AND g.name = 'מוזיקלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'ממלכת-קקופוניה' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'ממלכת-קקופוניה' AND g.name = 'ילדים' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
