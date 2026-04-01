-- Migration: Add new all_theatres shows
-- Generated on 2026-04-01T07:29:50.969Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('דרמה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('דרמה קומית') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מותחן') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מחזמר') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מרגש') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('פנטזיה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קומדיה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קומדיה שחורה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('רומנטי') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('האירוע', 'האירוע', 'תיאטרון הקאמרי', 70, 'דרמה מרגשת המערבת קומדיה ועוסקת בפגיעה מידי איש סמכות, כשהחתונה המיוחלת מתערערת בעקבות אירוע מטלטל בין שתי משפחות.', 'דרמה רגישה העוסקת בפגיעה מידי איש סמכות, כאשר חתונה מתקרבת והשקט מתערער בעקבות אירוע מזעזע בין שתי משפחות. ההצגה בוחנת את מנגנוני ההישרדות והערכים של הדמויות במבחן המצוקה.', NULL) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('מדעי הוודאות', 'מדעי-הוודאות', 'תיאטרון תמונע', 75, 'מדעי הוודאות הוא מופע תיאטרוני מרהיב המשלב בובת בד רובוטית ושחקנים, המציע חקר מעמיק של יחסי הכוחות בין אדם לסביבתו.', 'בובת בד רובוטית, המרגישה ננטשת לאחר שהמטפלת שלה מעלה מחיר, יוצאת למסע חקר עצמי על יחסי הכוחות עם הסביבה. המופע מתאר את השפעת המפגשים עם אנשים שונים על התנהגותנו.', 'אורן עילם, קאיה וינצ''י') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('גבע לא יכול להתאהב', 'גבע-לא-יכול-להתאהב', 'תיאטרון המשולש', 75, 'גבע עוזב את הארץ בעקבות אהבה בלתי אפשרית, ומחפש את עצמו ואת האהבה בברלין, בעידן של מלחמה ומורכבות רגשית.', 'גבע ממש רוצה להתאהב. אבל בארץ הוא לא יכול, גם בגלל המצב, המלחמה וכל השיט… וגם בגלל איתי. אז הוא עוזב לברלין. הוא יכיר שם איזה טד או איזה שטפן, הוא יגיד ''גוטן מורגן'', ויסע ב - U-Bahn, ואולי סוף סוף יהיה לו טוב.', 'תום חודורוב, אלון ליאור, תומר ברש, דניאל מיוני') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('געגוע // SAUDADE', 'געגוע-SAUDADE', 'תיאטרון המשולש', 60, 'פאולו, ילד בברזיל של שנות ה-80, מספר את סיפורו המרגש על אהבה וזיכרונות, במופע אישי ומעורר מחשבה על זהות והשתייכות.', 'סיפורו הלא יאמן של פאולו, ילד שגדל בברזיל של שנות ה-80 בבית חם ואוהב לשתי אימהות לסביות שלא דפקו חשבון, וגילה שהעולם לא היה מוכן לזה. בין סמבה לבוסה נובה, בין שווקי סאו פאולו למגרשי הכדורגל, הוא מספר את סיפורו האישי, המרגש והבלתי צפוי על אהבה שבנתה בית, על זיכרונות שמסרבים להישכח – ועל ילד אחד שלא מפסיק להתגעגע.', 'פאולו א. מואורה') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('האחד: המחזמר', 'האחד-המחזמר', 'תיאטרון המשולש', 90, 'אסף, גיי תל אביבי בן 27, מתמודד עם פרידה כואבת ומתחיל מסע חיפוש אחרי האהבה האמיתית, במחזמר מלא הומור ומוזיקה.', 'לאסף, גיי תל-אביבי בן 27, יש כל מה שצריך בחיים – עבודה מצויינת בהייטק, דירה מהממת במלצ''ט ובן זוג מתוק וחתיך שאיתו הוא יתחתן ויביא ילדים בפונדקאות. הכל מושלם עד שיום בהיר אחד בן הזוג שלו עוזב אותו. שבור לב והמום מהפרידה, אסף מוצא את עצמו שוב בעולם הרווקות, רחוק שנות אור מהחיים שתכנן בקפידה. בעזרת חברו הטוב שתומך בו רגשית, ואימו שלא תוותר עד שיביא לה חתן - תוך זמן קצר, הוא מתאפס על עצמו ויוצא למסע חיפוש אחרי האחד, שהפעם באמת יהיה...', 'נדב אילון, אדיר שטיבלמן, דניאל אביטל / איתמר אלבז, נדב ארטשיק / שיר סייג') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('הקשב הרס״פ', 'הקשב-הרס״פ', 'תיאטרון המשולש', 60, 'אביאל, סוהר בכלא צבאי, מתמודד עם רגשותיו כלפי אסיר סטרייט, כאשר סיטואציה מסוכנת מאיימת על מערכת היחסים שלהם.', 'אביאל, סוהר הומו ורגיש עד כאב בכלא צבאי, מאוהב בסתר ביד ימינו, איציק, האסיר הסטרייט. מידע מודיעני חדש על החדרת סמים לפלוגה של אביאל, מוציא אותו מדעתו ומערער על מעמדו בכלא. כשאביאל מתבקש לבצע חיפוש בהפשטה על איציק, החשוד המרכזי בפרשה, מערכת היחסים המיוחדת בין השניים עומדת לראשונה למבחן.', 'רם גואטה, שחף קהלאני') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('פאקינג מן', 'פאקינג-מן', 'תיאטרון המשולש', 90, 'עשרה גברים נפגשים במופע המתרחש בעולם המודרני של חיפוש אינטימיות, חושף את הפערים בין בדידות לשייכות.', 'בעולם של טינדר, גריינדר, סקס ופורנו – בחיפוש האינסופי אחר אינטימיות, עשרה גברים נפגשים אחד עם השני כדי לשכב. אבל כל מפגש כזה הוא גם קצת מעבר. לפעמים הוא מפגש משנה חיים. זהו אוסף תמונות חשופות ומרגשות על קשרים בין גברים, על הפער בין בדידות לשייכות, בין חופש לאהבה.', 'נדב ארטשיק, רם גואטה, ישי בן משה, ידידיה ויטל, שלו גלבר') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('פותחות', 'פותחות', 'תיאטרון המשולש', 90, 'חמש נשים נפגשות כדי לחשוף את סיפורן האישי, במסע מצחיק ומרגש של גילוי עצמי וחברות.', 'חמש נשים. קוראים להן בטי. לא ממש טוב להן בחיים, אז הן נפגשות על במה אחת לפתוח הכל. כל אחת מהבטיות נשאבת למסע מטורלל ולא מתוכנן, שיפגיש אותה עם עצמה, עם האחרות ועם כל מה שאף פעם לא היה לה אומץ לגלות.', 'שיר פופוביץ׳, נעמי אורן / אופיר צויגנבום, מיקה שיבק, רוני גולדפיין, עמית פרטוק') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'האירוע' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'האירוע' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'האירוע' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מדעי-הוודאות' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מדעי-הוודאות' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מדעי-הוודאות' AND g.name = 'פנטזיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'גבע-לא-יכול-להתאהב' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'גבע-לא-יכול-להתאהב' AND g.name = 'רומנטי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'געגוע-SAUDADE' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'געגוע-SAUDADE' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'האחד-המחזמר' AND g.name = 'מחזמר' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'האחד-המחזמר' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'האחד-המחזמר' AND g.name = 'רומנטי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הקשב-הרס״פ' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הקשב-הרס״פ' AND g.name = 'מותחן' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'פאקינג-מן' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'פאקינג-מן' AND g.name = 'קומדיה שחורה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'פותחות' AND g.name = 'דרמה קומית' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'פותחות' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
