-- Migration: Add new all_theatres shows
-- Generated on 2026-04-27T12:00:48.644Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('דרמה קומית') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מרגש') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('סאטירה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קומדיה') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('משתגעים מאהבה', 'משתגעים-מאהבה', 'תיאטרון חיפה', 90, 'הצגה קומית מרגשת על אהבה, קונפליקטים ודרמות אנושיות, המשלבת רגעים מצחיקים עם התמודדויות רגשיות עמוקות.', 'המחזמר המצליח “משתגעים מאהבה” הוא קומדיה מוזיקלית על מסע - ומשא - האהבה. ארבעה שחקנים
וירטואוזים מחליפים דמויות ותפקידים, ויוצרים פסיפס אנושי עשיר - מהדייטים המביכים של תחילת
הדרך ועד נישואין, הורות, משברים, ואהבות חדשות בגיל השלישי.
בשפה תיאטרונית דינמית ושירים מלאי הומור ורגש, ההצגה מציעה מבט חד, שנון ולרגעים גם מרגש עד
דמעות על הצורך של כולנו לאהוב ולהיות נאהבים.', 'איילת רובינסון, עידו מוסרי, דיאנה גולבי, בן פרי') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('נעולים', 'נעולים', 'הפקות עצמאיות', 60, 'קומדיה מרירה על הכאוס של החיים הישראליים, כאשר חתונת בתו של ליאון מתדרדרת לסיוט בעקבות פלישה מעולם תחתון.', 'כולם מחכים לחתונה של הבת של ליאון, אבל בסניף של ''ליאון שוז'' החגיגה הופכת לסיוט עוד לפני החופה. בתוך חנות נעליים קטנה בפריפריה, ההכנות לאירוע הנוצץ נקלעות לסיר לחץ של יצרים ומאבקי כח. השיגרה משתבשת סופית כשאורחים לא קרואים מהעולם התחתון פולשים לחנות. בעוד בעל הבית מנסה לתמרן בין חליפת חתונה לאיום פלילי, העובדים נותרים ''נעולים'' בתוך מחסן שבו הסדר המעמדי מתהפך והגבולות מיטשטשים. ''נעולים'' היא קומדיה מרירה המציבה מראה מול הכאוס המקומי.', 'נועם ארד, אייל זוסמן, שירה פרבר, אייל שכטר') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'משתגעים-מאהבה' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'משתגעים-מאהבה' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'משתגעים-מאהבה' AND g.name = 'דרמה קומית' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'נעולים' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'נעולים' AND g.name = 'דרמה קומית' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'נעולים' AND g.name = 'סאטירה' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
