-- Migration: Add new all_theatres shows
-- Generated on 2026-03-27T01:13:19.359Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('דרמה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('דרמה קומית') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('ילדים') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מרגש') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קומדיה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('רומנטי') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('שונאים סיפור אהבה', 'שונאים-סיפור-אהבה', 'תיאטרון בית ליסין', 150, 'שונאים סיפור אהבה, עיבוד לבימוי של יצירתו המפורסמת של בשביס זינגר, מציג רומן סוער בין אהבה, אשמה והאפשרות להתחלה חדשה בניו יורק שלאחר המלחמה.', 'ניו יורק, 1949. הרמן ברודר חי בין שתי נשים: אשתו, שהצילה את חייו במלחמה, וצעירה יפייפיה שהוא נשאב אליה. כשהאישה הראשונה שבה, הרמן מתמודד עם אשמה, תשוקה ושקרים. היצירה של יצחק בשביס זינגר מציעה מבט סוחף על אהבה והתחלות חדשות.', 'לימור גולדשטיין, תום חגי, אופיר וייל, יעל וקשטיין, רדה קנטרוביץ'', ערן שראל') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('האוגרת', 'האוגרת', 'תיאטרון תמונע', 50, 'קומדיה פסאודו-תיעודית שמביאה את סיפורה של אישה לכודה בבית עם שכנה אגרנית, במאבק בין ייאוש לתקווה.', 'שרה יורשת דירה בירושלים, ומוצאת את עצמה לכודה בגיהנום: שכנה אגרנית, ריחות בלתי נסבלים, מקקים, ומאבק אינסופי מול מערכת בירוקרטית מסועפת. זהו מסע של אישה שמבקשת לנשום בבית שלה. בין תיאטרון לפרפורמנס, בין וידאו לפלמנקו, בין ייאוש לתקווה, בין מציאות להזיה, נחשפים קצוות שונים של ההוויה האנושית.', 'שרה סיגל') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('מה פה מופע פה', 'מה-פה-מופע-פה', 'תיאטרון תמונע', 50, 'מופע מחול-תיאטרון מצחיק והרפתקני לילדים, שבו שני יצורים יוצאים למסע חקר אחר מהו מופע ומה מקומו של הדמיון.', 'שני יצורים משונים נוחתים בחלל מופעים ריק. משימתם: לגלות מהו מופע. זהו מבצע נועז ומלא הומור שמזמן הפתעות לכל מי שמוכן לצאת להרפתקה.', NULL) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('שורה', 'שורה', 'תיאטרון תמונע', 90, 'מחזה מבוסס מציאות על חוויות מילואימניק בזיהוי קורבנות טבח, המשלב רגעים של כנות, הומור ועומק אנושי.', 'שישים ימים שהה המילואימניק והמחזאי רועי יוסף במחנה ''שורה'' אי שם במרכז הארץ. במהלך תקופה זו עסק בזיהוי קורבנות הטבח, חיפש סימן מזהה שיקל את הזיהוי ויאפשר קבורה. ''שורה'' הוא ניסיון אמיץ וחשוף לאפשר לכולנו להבין מה היה שם, ואולי סוף סוף להביא אותו למנוחה נכונה.', 'שחר נץ, מוראד חסן, אייל נחמיאס, נעמי אורן / מיכל טופורק, אורי דב יוסף בלופרב / גלי פרנק, דורית דורה שלו, אילן זכרוב, יובל קנין נחמיאס, רועי יוסף') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('תיאטרון רפרטוארי', 'תיאטרון-רפרטוארי', 'תיאטרון תמונע', 70, 'קומדיה חדה על מחזאי צעיר המגלה את הקשרים המורכבים בין האומנות לחיים, בעיצומה של חקירה סביב מותו המסתורי של אביו.', 'קומדיה מקורית ומהירה, שבה מחזאי צעיר מגיש את מחזה הבכורה שלו למנהל תיאטרון רפרטוארי. כשהפגישה הופכת לחקירה מטורפת אודות הקשר בין המחזה החדש לבין מותו המסתורי של אביו של המחזאי, הכל מסתבך והגבולות בין תיאטרון ומציאות מוגדרים מחדש.', 'יפתח אופיר, ארז דריגס') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'שונאים-סיפור-אהבה' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'שונאים-סיפור-אהבה' AND g.name = 'רומנטי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'האוגרת' AND g.name = 'דרמה קומית' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'האוגרת' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מה-פה-מופע-פה' AND g.name = 'ילדים' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מה-פה-מופע-פה' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'שורה' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'שורה' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'תיאטרון-רפרטוארי' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'תיאטרון-רפרטוארי' AND g.name = 'דרמה קומית' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
