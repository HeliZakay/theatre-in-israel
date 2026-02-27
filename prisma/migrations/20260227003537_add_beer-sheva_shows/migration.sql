-- Migration: Add new beer-sheva shows
-- Generated on 2026-02-27T00:35:37.407Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('דרמה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('ישראלי') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מוזיקלי') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מרגש') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קומדיה') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('באר-שבסקיה', 'באר-שבסקיה', 'תיאטרון באר שבע', 90, 'קברט הגירה פרוע המשלב פולקלור רוסי עם דרמה אנושית, כשהחיים המורכבים של מהגרים מתגלים דרך שירים וריקודים.', 'חבורה של ארבעה שחקנים צעירים מברית המועצות לשעבר מעלה מופע קברטי קליל, אך היחסים ביניהם מגיעים לנקודת רתיחה, מה שהופך את החגיגה המזרח-אירופאית לחיטוט מצחיק וכואב בפצע המדמם של העלייה.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('פינק ליידי', 'פינק-ליידי', 'תיאטרון באר שבע', 90, 'מחזה ישראלי חדש המציע מבט נדיר על חיי נשים חרדיות, כשהמאבק הפנימי של בתי מוביל לגילוי עצמי מרגש.', 'בתי, אישה חרדית צעירה, מגלה כי בעלה נסחט על ידי כנופיה מקומית. הגילוי מטלטל את חייהם ושולח אותה למסע של התעוררות וחיפוש אחר חירות רגשית.') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'באר-שבסקיה' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'באר-שבסקיה' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'באר-שבסקיה' AND g.name = 'מוזיקלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'פינק-ליידי' AND g.name = 'ישראלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'פינק-ליידי' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'פינק-ליידי' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
