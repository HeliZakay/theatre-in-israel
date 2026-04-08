-- Migration: Add show זוהי ירושלים to הפקות עצמאיות
-- Generated on 2026-04-08
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres (idempotent)
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('מחזמר') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('רומנטי') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מרגש') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Show
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('זוהי ירושלים', 'זוהי-ירושלים', 'הפקות עצמאיות', 120, 'מחזמר מרגש על סיפור אהבה בין זמנים — נערה צעירה מקבלת תליון עתיק מסבתה ומוצאת את עצמה נוסעת בזמן לירושלים העתיקה, שם היא פוגשת דמות מרתקת מהעבר ויחד הם יוצאים למסע דרך נקודות מפנה בתולדות ירושלים.', 'נעווה (סתיו צוברי), צעירה בת 25, מקבלת מסבתה תליון עתיק ומסתורי שעובר במשפחתה מדור לדור. בביקור בהר הבית, התליון נדלק לפתע ומעביר אותה אחורה בזמן לשנת 3830 (ט׳ באב). שם היא פוגשת את יינון (עומרי פלד) — דמות מרתקת מן העבר שכובשת את ליבה. יחד הם יוצאים למסע מיוחד דרך נקודות המפנה המרכזיות בתולדות ירושלים — מעקדת יצחק, דרך חורבן בית המקדש ועד שחרור ירושלים. המשימה שלהם: למנוע את חורבן המקדש על ידי מלחמה בשנאת חינם וקידום אהבת חינם, שהייתה נדירה באותה תקופה.', NULL) ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'זוהי-ירושלים' AND g.name = 'מחזמר' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'זוהי-ירושלים' AND g.name = 'רומנטי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'זוהי-ירושלים' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
