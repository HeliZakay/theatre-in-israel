-- Migration: Add new gesher shows
-- Generated on 2026-02-27T02:02:08.146Z
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
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('כפר', 'כפר', 'תיאטרון גשר', 135, 'דרמה מרגשת המתרחשת בכפר בארץ ישראל בשנות ה-40, המשלבת הומור ועצב על רקע אירועים היסטוריים מכוננים.', 'סיפורם של תושבי כפר בארץ ישראל של שנות ה-40 כפי שחווה אותם יוסי, נער תם שלא התבגר. חיי היום-יום והפרט מעסיקים את הנפשות, כשברקע חולפים אירועי מלחמת העולם השנייה, סכנת הפלישה הגרמנית, השואה, הכרזת המדינה ומלחמת השחרור. סיפור המחזה מתגלגל בחום ובחיבה, בהומור ובעצב, בארץ ישראל שבה האדם, למרות גורלו, יוצא מנצח.') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'כפר' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'כפר' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'כפר' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
