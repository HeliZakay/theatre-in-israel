-- Migration: Add new all_theatres shows
-- Generated on 2026-04-09T21:25:36.729Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('דרמה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('ילדים') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מרגש') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('פנטזיה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קלאסיקה') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('הברווזון המכוער', 'הברווזון-המכוער', 'תיאטרון מלנקי', 50, 'הברווזון המכוער הוא סיפור קסום על התמודדות עם קשיים והפיכתו של ברווזון לאלגנטי, בליווי מוסיקה קלאסית מרגשת.', 'זהו סיפור מרגש וחכם על ברווזון קטן ופשוט, העובר דרך של ניסיונות ותגליות עד שהוא הופך לברבור לבן ויפהפה.', 'אולגה טסלר, אורי לבנון, סופי נוז''יקוב/הדס אייל') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('הדוד וניה', 'הדוד-וניה', 'תיאטרון מלנקי', 140, 'הדוד וניה הוא מחזה מרגש על אנשים שחיים למען אחרים, המאתגרים את עצמם לראשונה ושואלים מה נשאר בשבילם.', 'סיפורו של צ’כוב על תקוות שלא התגשמו, אהבה, אכזבה ואומץ אנושי שקט, מתרחש באחוזה שכוחת אל שבה פעימת החיים משתנה עם הגעת הפרופסור ורעייתו הצעירה.', 'דודו ניב, אנה דוברביצקי, אורי לבנון, גד קינר, דימה רוס, סוניה צונווזו') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הברווזון-המכוער' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הברווזון-המכוער' AND g.name = 'ילדים' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הברווזון-המכוער' AND g.name = 'פנטזיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הדוד-וניה' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הדוד-וניה' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הדוד-וניה' AND g.name = 'קלאסיקה' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
