-- Migration: Add new all_theatres shows
-- Generated on 2026-05-17T07:58:50.934Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('דרמה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('ילדים') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מוזיקלי') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מחזמר') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מרגש') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('סאטירה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קומדיה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קומדיה שחורה') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('MADONA – THE TRIBUTE SHOW', 'MADONA-–-THE-TRIBUTE-SHOW', 'התיאטרון העברי', 90, 'מופע מחווה עוצמתי למדונה, המשלב להיטים בלתי נשכחים, תיזמורת חיה וכוריאוגרפיה סוחפת, לחוויה נוסטלגית ומרהיבה.', 'מופע מחווה אנרגטי וחגיגי למלכת הפופ, מדונה. הפקה מרהיבה עם הלהיטים הגדולים של כל הזמנים, עם תיזמורת חיה וכוריאוגרפיה סוחפת, בתלבושות איקוניות ותאורה חדשנית.', 'מיכל אמדורסקי, שני שאולי, עדי שרון, לי-חי דהן, אורן הראל, גל מחזרי, ניר שיבר, הוד שמיר, רוי שמש, נעה בן בסט, הילה אטדגי, ים אייזנברג, נטעלי, חכם מעיין, גלינקה. נגנים: תופים - יובל ירון בס - יובל בכר גיטרה - דניאל הלפמן קלידים - עומר גולד') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('אדיפוס המלך', 'אדיפוס-המלך', 'הפקות עצמאיות', 105, 'עיבוד עכשווי ל''אדיפוס המלך'' של סופוקלס, המציע חקירה מרתקת על גורל ואחריות, תוך שילוב בין פארסה לטרגדיה.', 'אדיפוס המלך מחליט לחקור מי רצח את המלך ליוס, אך הוא לא יודע שהרוצח הוא בעצם הוא עצמו. ההצגה מתמודדת עם שאלות של אחריות וגורל, בשילוב פארסה וטרגדיה.', 'רע דשא, הגר זנדר, עמית לסרי') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('הפינגווין', 'הפינגווין', 'הפקות עצמאיות', 60, 'הפינגווין הוא עיבוד חופשי לרומן על סופר כושל שמגלה שהמילים שלו מובילות למוות, חוויה משעשעת ומוזרה על בדידות ומציאות מעוותת.', 'ויקטור, סופר כושל, מקבל הצעה לכתוב מאמרי הספד על אנשים חיים, אך כל מי שנכתב עליו מחוסל. ההצגה מציעה חוויה מרירה-משעשעת על בדידות, אמנות ומוות.', 'אלון פרידמן') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('ילד שלי מוצלח', 'ילד-שלי-מוצלח', 'הפקות עצמאיות', 50, 'ילד שלי מוצלח היא הצגת תיאטרון בובות קסומה על ילד שמביא מתנות לאמו, מלאת צבע, דמיון וצחוק.', 'בכל פעם שיוסי יוצא לבצע מטלה פשוטה הוא נקלע להרפתקה קסומה וחוזר עם מתנה מפתיעה לאמא. זוהי הצגת תיאטרון בובות על ילד שובב וחולמני, על אם אוהבת ועל הצבע והצחוק שהדמיון מוסיף לחיי היומיום. ההצגה משלבת בובות אמיצות, אנימציה צבעונית ומוזיקה אימהית.', 'הילה פלשקס') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('לחם ושעשועים', 'לחם-ושעשועים', 'הפקות עצמאיות', 60, 'לחם ושעשועים היא הצגה סאטירית על האמן בעידן המודרני, המאתגרת את הלחצים החברתיים והפוליטיים על היצירה.', 'אנחנו אמנים רגישים! אנחנו מפנימים היטב את הלך הרוח הציבורי, ואת המסרים הנושבים מהחלונות הגבוהים. אנחנו נהיה ממושמעים. למה שנרצה להעכיר, להטריד או לעורר מחלוקת? אנחנו עם העם. אנחנו פטריוטים. אנחנו פוליטיקלי-קורקט. לשעה קלה נעלה את מורל הציבור ונשמח לבבות בריקוד ובפזמונים קליטים ונעימי לחן. הרקדנים הצעירים והגמישים חדורי תחושת שליחות, ערוכים ומוכנים להגיש לכם צעדים ומחולות מלוא הטנא, ובטוחים אנו כי יהיה בסדר.', 'עירד אבני, תומר גיאת, יעל סופר') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('זוגות בזיגזג - קומדיה בקצב גבוה', 'זוגות-בזיגזג-קומדיה-בקצב-גבוה', 'תיאטרון toMix', 80, 'קומדיה שנונה על מערכות יחסים, שבהן כל מפגש בין זוגות חושף סיטואציות מצחיקות ומפתיעות בקצב מסחרר.', 'התכנית של דניאל הייתה מושלמת, כשאשתו יוצאת לסוף שבוע לבקר את אמא שלה הוא יהיה בבית בסוף שבוע סודי יחד עם המאהבת שלו כולל שפית פרטית שאמורה לדאוג לארוחות גורמה ואווירה יוקרתית. מה כבר יכול להשתבש ? הכל ! אשתו לא הולכת , אורחים לא צפויים מגיעים, זהויות מתבלבלות והעניינים הולכים ומסתבכים בקצב מסחרר. מה שתוכנן כסוף שבוע אינטימי הופך לקומדיית טעויות מצחיקה שבה שום דבר לא הולך לפי התכנית.

', 'מיה דגן/שיפי אלוני, יניב פולישוק, יפית אסולין, יובל סגל, טלי בן יוסף שורוש, דן קיזלר') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('נפש', 'נפש', 'הפקות עצמאיות', 60, 'מסע מוזיקלי מרגש לחיפוש עצמי, שבו נפש פוגשת קולות מסתוריים ומגלה את עצמה מחדש.', 'נפש יוצאת למסע מוזיקלי לגלות את עצמה מחדש. בדרך היא פוגשת קולות מסתוריים שהיו בתוך ארגזים יותר מדי זמן.', NULL) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('תחושת בטן', 'תחושת-בטן', 'הפקות עצמאיות', 70, 'מחזמר בלשי ופוסט מודרני על חקירה מוזרה שבה איברים חשודים נחשדים במעורבות בהיעלמות, עם הומור וכאב.', 'באישון לילה גשום בשוויץ, נפתחת חקירה לבחון מה קרה לבטן הנעדרת. ככל שהחקירה מתקדמת, הגבול בין מציאות להזייה מתפרק, ומתגלה סוד אפל. השאלה היא האם אנחנו מחפשים כדי למצוא, או פשוט מפחדים מהרגע שבו כבר לא ישאר עוד מה לחפש.', 'תמר רות מרי, ענבל גוזלן, יפתח גרינברג, יאיר הספרי, מיכל אלזהויספלד, נתן וולקינד, רועי מעוז ותמר רות מרי, ירון סליק, ניסים מרי, גל טמיר, תום פייפל, אוקסנה קולי ועילי שמרץ') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'MADONA-–-THE-TRIBUTE-SHOW' AND g.name = 'מוזיקלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'MADONA-–-THE-TRIBUTE-SHOW' AND g.name = 'מחזמר' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אדיפוס-המלך' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הפינגווין' AND g.name = 'קומדיה שחורה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הפינגווין' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'ילד-שלי-מוצלח' AND g.name = 'ילדים' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'לחם-ושעשועים' AND g.name = 'סאטירה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'זוגות-בזיגזג-קומדיה-בקצב-גבוה' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'נפש' AND g.name = 'מוזיקלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'נפש' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'תחושת-בטן' AND g.name = 'מחזמר' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'תחושת-בטן' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'תחושת-בטן' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
