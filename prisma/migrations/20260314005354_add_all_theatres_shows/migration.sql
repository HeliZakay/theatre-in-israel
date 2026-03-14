-- Migration: Add new all_theatres shows
-- Generated on 2026-03-14T00:53:54.642Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('דרמה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מרגש') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('את מדברת. אני מדברת', 'את-מדברת.-אני-מדברת', 'תיאטרון תמונע', 70, 'מונודרמה עוצמתית בה ריקי חיות חוקרת את חייה של ברונהילדה פומזל, המזכירה של גבלס, ומזמינה את הקהל להתמודד עם שאלות על זהות ועבר.', 'ברונהילדה פומזל, מזכירתו של שר התעמולה הנאצי יוזף גבלס, מופיעה על הבמה ומעלה שאלות קיומיות על החיים והעבר. ריקי חיות, השחקנית, חיה את דמותה של פומזל ומביאה את הקהל למסע פנימי מעורר מחשבה.', 'ריקי חיות') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('הגבירה מאבו דיס', 'הגבירה-מאבו-דיס', 'תיאטרון תמונע', 90, 'ערב הוקרה מרגש למנטורית התיאטרון נירה לילי רוסו, המשלב קטעים נבחרים מיצירותיה ומזמין את הקהל למסע חווייתי ומרגש.', 'בערב הוקרה מרגש, השחקנית חדווה לוי־גושן מציגה קטעים נבחרים מיצירותיה של המנטורית נירה לילי רוסו, חוגגת ארבעה עשורים של יצירה תיאטרונית, ומזמינה את הקהל למסע אל תת המודע הקולקטיבי.', 'עדילי ליברמן, נדב בושם, אורה מאירסון וליאם שניצר') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'את-מדברת.-אני-מדברת' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'את-מדברת.-אני-מדברת' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הגבירה-מאבו-דיס' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הגבירה-מאבו-דיס' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
