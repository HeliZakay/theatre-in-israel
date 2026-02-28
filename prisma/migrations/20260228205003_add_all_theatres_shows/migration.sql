-- Migration: Add new all_theatres shows
-- Generated on 2026-02-28T20:50:03.661Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('דרמה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('דרמה קומית') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('ישראלי') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('סאטירה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('פנטזיה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קומדיה') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('אש בארזים', 'אש-בארזים', 'תיאטרון תמונע', 80, 'ההצגה אש בארזים מציעה מסע מרתק לפענוח המציאות הישראלית דרך משל תנכי, המשלב חוויה אישית עם לאומית, ומבקר את השלטון הרודני.', 'משל יותם מדבר על העצים שבחרו להם מלך לא נכון, סיפור תנכי שמסתיים במפולת, ובקץ השלטון הרודני. 
חמישה שחקנים יוצאים למסע, לפענח את המציאות הישראלית באמצעות המשל העתיק. 

הם מחפשים את הקשר בין המיתולוגיה היהודית, טקסטים מפאנלים של ערוץ 12,14, לתוכניות בישול שיצאו משליטה, לסיפורים אישיים, סיפורים ששייכים למקום שבו אנחנו חיים ונאבקים.

מסע שמחבר את החוויה האישית עם זו הלאומית. 

', 'מאת ובבימוי: אלמה וייך // ליווי אמנותי: נאוה צוקרמן // דרמטורגיה: בהט קלצ''י // וידיאו ארט: ארז מילר // עיצוב חלל ותלבושות: דניאלה מור // עיצוב תאורה: מתן פרמינגר // מוסיקה: טל יניב //ייעוץ קונספט: נגה אפרת// ייעוץ סאונד: אורי אפרת// ייעוץ תאורה: אורי מורג// ע. בימאית: גאיה חושן ומאיה וולפרט // שחקנים: איסק צ''וקרון, שירה פרבר, אייל שכטר, גיא רון, מיכל טופורק

תודות: סוזנה וייך שחק, נאוה צוקרמן, לידיה לוקובסקי, לצלם דוד קפלן') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('Mamachine', 'Mamachine', 'תיאטרון תמונע', 75, 'Mamachine היא קומדיה פרועה המשלבת תיאטרון פיזי וליצנות, בה אישה נאבקת לשבור את מחזור הגנטיקה שלה, תוך כדי חוויות קצביות ומרתקות.', 'אישה מנסה לברוח מחוקי הגנטיקה על מנת שלא להפוך לאמא שלה. ההצגה משלבת תיאטרון פיזי, ליצנות, מוסיקה ומחול, תוך כדי חקירה של זהות אישית ופנטסטית.', 'מאת: יולנה צימרמן ומאשה נמירובסקי // בימוי ומוסיקה: מאשה נמירובסקי // עיצוב תאורה: יוני טל // בביצוע: יולנה צימרמן') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אש-בארזים' AND g.name = 'ישראלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אש-בארזים' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אש-בארזים' AND g.name = 'סאטירה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'Mamachine' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'Mamachine' AND g.name = 'פנטזיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'Mamachine' AND g.name = 'דרמה קומית' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
