-- Migration: Add new all_theatres shows
-- Generated on 2026-05-19T18:11:40.801Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('דרמה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('דרמה קומית') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מרגש') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קומדיה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('רומנטי') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('יוסי וג''אגר', 'יוסי-וג׳אגר', 'תיאטרון הבימה', 90, 'דרמה מרגשת על אהבה אסורה בין שני קצינים במוצב על גבול לבנון, המתרקמת בצל מלחמה ושגרת חיים קשה.', 'סוף שנות התשעים. מוצב מושלג על גבול לבנון. קבוצת לוחמים לכודים בשגרת מלחמה מתמשכת, בעוד הם חולמים על אהבה, סקס ואינטימיות. נרקם סיפור אהבה סוער בין יוסי וג''אגר, שני קצינים שנאלצים לשמור את אהבתם בסוד. בין המרחבים הפסטורלים של החרמון המושלג לבין המחנק של הבונקר, נאבקים הלוחמים על זהותם האישית ועל הזכות לאהוב ולחיות.', 'אבנר ברנהיימר, ניב מנור, איתמר קיגלר, אברהם ארנסון') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('Bloody Mary', 'Bloody-Mary', 'תיאטרון גשר', 90, 'דרמה מרתקת בשפה הרוסית, שבה שיחה בין שחקניות מתפתחת למחזה על כוח וקנאה, המתרחש במקביל לעולם המודרני.', 'בתור לקופת חולים נפגשים אנשים מעולמות וזמנים שונים. ביניהם - שתי שחקניות המתכוננות לגלם את ''מריה סטיוארט''. השיחה ביניהן הופכת למחזה עצמו, והסיפור על כוח, קנאה והוצאה להורג מתחיל להתרחש כאן ועכשיו. גם כשהכול מסתיים במוות – החיים ממשיכים והכול חוזר למסלולו. בתיאטרון זה, הפנטזיה חושפת את משמעויותיה הסמויות והנסתרות של המציאות.', 'ישראל (סשה) דמידוב, יבגניה דודינה, פולינה פחומוב, ניקיטה גולדמן, ניקיטה אוליניקוב, רות סנדרוביץ'', איתי טרחנוב, בוריס רפרטור, פולינה פחומוב, ניקיטה אוליניקוב, איתי טרחנוב, רות סנדרוביץ''') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('יום המזל שלי', 'יום-המזל-שלי', 'תיאטרון בית ליסין', 90, 'קומדיה צרפתית מבריקה על גבר שמקבל הזדמנות לשנות את עברו, אך מגלה שהשינויים מביאים עימם הפתעות בלתי צפויות.', 'גבר מצליח, עם קריירה, משפחה וחיים שנראים מסודרים, מקבל הזדמנות יוצאת דופן לחזור לאותו יום גורלי בעבר ולבחור אחרת. מה שנראה בתחילה כמו תיקון קטן, מוביל לשרשרת בלתי צפויה של מפגשים, שינויים, אהבות והחמצות – ומעמיד במבחן את כל מה שהוא חשב שהוא יודע על עצמו, על אושר ועל גורל. קומדיה שנונה, קצבית ומלאת הפתעות, שבוחנת בהומור חד ובאנושיות רבה את השאלה הגדולה מכולן: האם שינוי גורל מביא לאושר – או רק גובה מחיר חדש?', 'קובי פרג'', יובל ינאי, יעל וקשטיין, דור אלמקייס, עדי גילת') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('התחנה', 'התחנה', 'תיאטרון הסימטה', 70, 'דרמה מרגשת על אנשים הממתינים בתחנה, מחפשים את עצמם ומבינים את משמעות ההצלחה והכישלון בעולם המודרני.', 'המחזה עוסק בשישה גיבורים וגיבורות הנאבקים להוכיח את ערכם בתוך עולם שמודד הצלחה בבחינות ובתוצאות. הספסל בתחנת האוטובוס משמש כנקודת מפגש, כאשר כל דמות מתמודדת עם שאלות של זיהוי עצמי ושינוי. העלילות השזורות מציגות את המאבק האנושי באי הוודאות.', 'אלון לשם, יובל רהב, יעל בר שביט, נטע טרוים, רמי שוורץ, נוי אליאסי') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'יוסי-וג׳אגר' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'יוסי-וג׳אגר' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'יוסי-וג׳אגר' AND g.name = 'רומנטי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'Bloody-Mary' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'Bloody-Mary' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'יום-המזל-שלי' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'יום-המזל-שלי' AND g.name = 'דרמה קומית' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'התחנה' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'התחנה' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
