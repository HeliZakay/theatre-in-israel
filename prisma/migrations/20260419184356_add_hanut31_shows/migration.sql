-- Migration: Add new hanut31 shows
-- Generated on 2026-04-19T18:43:56.438Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('דרמה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מרגש') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('בית לשלושה', 'בית-לשלושה', 'תיאטרון החנות', 60, 'סיור במוזיאון אוטומטות חושף את סיפור חייה של ממציאנית פורצת דרך, המשלב מיניות, יצירה ואובדן, בקבוצות של שלושה משתתפים.', 'ההצגה מציעה ביקור במוזיאון האוטומטות של מאדאם לוין, המספרת את סיפורה של ממציאנית פורצת דרך, המשלבת מיניות, יצירה ואובדן, בסיור קבוצתי של שלושה משתתפים.', 'נדיה קוצ''ר, עמית גור, פיתוח מחזה: רוני ברודצקי (כחלק מקבוצת מילאטיס)') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'בית-לשלושה' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'בית-לשלושה' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
