-- Migration: Add new all_theatres shows
-- Generated on 2026-03-29T20:27:34.668Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('מוזיקלי') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מחזמר') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קומדיה') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('נס ציונה- המחזמר', 'נס-ציונה-המחזמר', 'תיאטרון תמונע', 70, 'במחזמר המוזיקלי והמשעשע, ינון מגלה שהחיים בנס ציונה יכולים להיות שונים לחלוטין בזכות בחורה חדשה שמאתגרת את שגרת חייו.', 'קומדיית נונסנס מוזיקלית על הצלחה, אושר והקשר ביניהם. ינון יושב כל היום בתחנת האוטובוס, אך חייו משתנים כשמגיעה בחורה חדשה לעיר, המשבשת את שגרת חייו.', 'אורי עטיה, מעין ויסברג, אסף פריינטה, יעל טל, עומר עציון, נעמה רדלר') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'נס-ציונה-המחזמר' AND g.name = 'מחזמר' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'נס-ציונה-המחזמר' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'נס-ציונה-המחזמר' AND g.name = 'מוזיקלי' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
