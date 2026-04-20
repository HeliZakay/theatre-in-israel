-- Migration: Add new hanut31 shows
-- Generated on 2026-04-20T19:18:52.079Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('ילדים') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מוזיקלי') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מרגש') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('פנטזיה') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('Horsing Around', 'Horsing-Around', 'תיאטרון החנות', 60, 'המערבון המיוחד הזה מציע גלגול נשמות בעזרת סיפור קין והבל, בשילוב פרפורמנס וכלים מוזיקליים יוצאי דופן.', 'מערבון חסר זמן ומקום נפרם ונהפך לגלגול נשמות. סיפור קין והבל המקראי במיתולוגיה חדשה במערב הפרוע, בשילוב פרפורמנס וכלי נגינה מומצאים בעולם פנטסטי.', NULL) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('Plastic Heroes', 'Plastic-Heroes', 'תיאטרון החנות', 60, 'תיאטרון בובות שמצליח לגעת בלבבות בעזרת פשטות ואומנות, משאיר את הקהל מהורהר ומרגש.', 'המלחמה עוד רגע מתחילה, עכשיו הזמן להפוך לגיבורים!
אבל החיילים מפלסטיק, שדה הקרב הוא שולחן, והבית הוא רק תמונה רחוקה על מסך.
במערכה בה איש אינו יודע מי האויב או מה המטרה, הגבולות בין המציאות לדמיון מטשטשים: האם כל זה אמיתי או רק משחק ילדים?
פלסטיק הירוס היא אסופת תמונות ממלחמה בהופעת תיאטרון חפצים למבוגרים. מופע מצחיק ומכאיב, עם מעט מילים, שני אייפדים והרבה מאוד צעצועים.', NULL) ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'Horsing-Around' AND g.name = 'פנטזיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'Horsing-Around' AND g.name = 'מוזיקלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'Plastic-Heroes' AND g.name = 'ילדים' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'Plastic-Heroes' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
