-- Migration: Add new habima shows
-- Generated on 2026-02-26T14:43:58.979Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('דרמה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('דרמה קומית') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('ילדים') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מאחורי הקלעים') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מוזיקלי') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מחזמר') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מרגש') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קומדיה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קלאסיקה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('רומנטי') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('אוי אלוהים', 'אוי-אלוהים', 'תיאטרון הבימה', 80, 'קומדיה חכמה ומרגשת על פסיכולוגית שמגלה שהמטופל שלה הוא אלוהים, המנסה לשים קץ לאנושות, והיא חייבת לשנות את דעתו.', 'אלה, פסיכולוגית בת 42 ואם חד-הורית לילד על הרצף האוטיסטי, מקבלת שיחת טלפון דחופה מ-א'', מטופל מסתורי שנואש לפגישה מיידית. כשהוא מגיע, מתברר שהמטופל אינו אלא אלוהים, בורא עולם בכבודו ובעצמו, הסובל מדיכאון עמוק. הוא מיואש מיחסיו המורכבים עם בני האדם ומבקש לשים קץ לאנושות - מה שמשאיר לאלה שעה אחת בלבד לשנות את דעתו ולהציל את העולם.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('בוסתן ספרדי 2021', 'בוסתן-ספרדי-2021', 'תיאטרון הבימה', 110, 'מחזמר מרגש המתרחש בשכונה ספרדית בירושלים, עוסק במשפחה, אהבה, מסורת ודילמות אנושיות, עם לחנים מתוך אנתולוגיה לחזנות ספרדית.', 'המחזה מתאר הווי של שכונה ספרדית בירושלים של הימים ההם, בשימו דגש על משפחה אחת, משפחת קסטל. דברים שבינו לבינה, אבות ובנים, פילוסופיה עממית, שמש הקורא לסליחות, מגיד עתידות, יחסי שכנים, נערה מופקרת המצווה ע"י הרב לעזוב את ירושלים והדילמה שבקבורתה, בן ציון, תמהוני המחפש את אליהו הנביא, ולבסוף, הטרגדיה של ויקטוריה המואשמת שלא שמרה על בתוליה. ובין תמונה לתמונה, פזורים שירי אהבה וכאב, שמחה ויגון.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('הג''יגולו מקונגו', 'הג׳יגולו-מקונגו', 'תיאטרון הבימה', 90, 'ערב תיאטרון קומדי עם מיקי קם, ישראל קטורזה ויגאל נאור, המשלב מערכונים ושירים של חנוך לוין, המציע חוויה בין צחוק לדמע.', 'ערב שנע על הגבול הדק שבין צחוק לדמע, בין המגוחך לנשגב, ובין תשוקות אפלות לחלומות בלתי אפשריים שהתקלקלו בדרך מקונגו לרחוב דיזנגוף. בואו להיזכר, להתרגש, ולגלות מחדש את הקסם שהפך את המערכונים של חנוך לוין לקלאסיקה ישראלית.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('הסוחר מוונציה', 'הסוחר-מוונציה', 'תיאטרון הבימה', 110, 'מחזה עוצמתי של שייקספיר על כסף, צדק ואנטישמיות, המתרחש בברלין של 1933, עם דמויות מורכבות ונוגעות ללב.', 'שיילוק היא מלוות כספים, אלמנה, יהודיה. הסוחר העשיר והאנטישמי אנטוניו לווה ממנה כסף עבור חברו, אהובו, שיוצא לצוד לעצמו רעיה עשירה. הגברת שיילוק מציבה תנאי – בעד ההלוואה: אם הסכום לא יוחזר עד יום זה-וזה, היא רשאית לחתוך לעצמה ליטרת בשר מגופו של אנטוניו. עם הזמן הבדיחה נעשית רצינית מאד. ההפקה הנוכחית מעתיקה את מקום העלילה וזמן ההתרחשות לברלין, 1933.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('חתונה מאוחרת', 'חתונה-מאוחרת', 'תיאטרון הבימה', 100, 'עיבוד בימתי לסרט עטור השבחים על צעיר גרוזיני המתקשה לבחור בין אהבתו האמיתית לבין לחצי משפחתו להתחתן.', 'זאזא כבר היה אמור להתחתן: הוא עוד רגע בן 32, ולפי המסורת הגרוזינית עליו להיות נשוי לכלה צעירה ויפהפייה. הבעיה היא שזאזא פשוט לא רוצה להתחתן, לפחות לא עם הכלות הפוטנציאליות שההורים מסדרים לו, כי הלב שלו שייך לאהובה סודית. האם זאזא יתמסר לאהבה הטוטאלית או ייכנע ללחצי המשפחה והמסורת?') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('להתראות ותודה על הקרמשניט', 'להתראות-ותודה-על-הקרמשניט', 'תיאטרון הבימה', 80, 'קומדיה מרגשת על זוג המחליט לסיים את חייהם יחד, אך תוכניותיהם משתבשות כאשר הבת הבכורה מגיעה הביתה.', 'אחרי חמישים שנה של זוגיות מאושרת, מחליטים איזי ותיקי לסיים את החיים יחד בשלווה, בתאריך ובשעה שנקבעו מראש. הבית ערוך לשבעה, מכתבי הפרידה מסודרים על השולחן. אבל רגע לפני האקט הגורלי, הבת הבכורה דופקת בדלת, ופתאום הכל משתנה.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('מחווה לדיוות הגדולות', 'מחווה-לדיוות-הגדולות', 'תיאטרון הבימה', 90, 'מופע מחווה מרגש לדיוות הגדולות של הזמר העברי, המשלב שירים קלאסיים בביצועים מרהיבים.', 'מחווה לדיוות הגדולות של הזמר העברי, שושנה דמארי, יפה ירקוני, אסתר עופרים ועפרה חזה, עם שירים מוכרים ויקרים לליבם של רבים.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('סיור "מאחורי הקלעים"', 'סיור-מאחורי-הקלעים', 'תיאטרון הבימה', 90, 'סיור מרתק מאחורי הקלעים של התיאטרון הלאומי הבימה, בו תגלו את ההיסטוריה, האולמות והאביזרים המיוחדים של התיאטרון.', 'סיור מאחורי הקלעים של התיאטרון הלאומי הבימה. הסיור יכלול היסטוריה של התיאטרון, מוזיאון הבימה, האולמות השונים, חדרי הלבשה, אביזרים ושאלות ותשובות עם השחקן המעביר את הסיור.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('פינוקיו', 'פינוקיו', 'תיאטרון הבימה', 65, 'מחזמר קסום לילדים על פינוקיו, בובת עץ שהופכת לילד אמיתי במסע מלא הרפתקאות והומור.', 'מחזמר קסום ומלא הומור ודמיון מאת אפרים סידון ומירון מינסטר, בהשראת סיפורו האהוב של קרלו קולודי. ג׳פטו, הנגר הזקן, בונה בובת עץ בדמות ילד בשם פינוקיו, והפיה הכחולה מפיחה חיים בבובה. פינוקיו יוצא למסע הגדול מכולם כדי להפוך לילד אמיתי.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('פריסילה מלכת המדבר - סיור מאחורי הקסם!', 'פריסילה-מלכת-המדבר-סיור-מאחורי-הקסם!', 'תיאטרון הבימה', 60, 'סיור ייחודי מאחורי הקלעים של המחזמר "פריסילה מלכת המדבר", בו תגלו את סודות ההפקה ותהליכי העבודה של השחקנים.', 'סיור מיוחד במינו מאחורי הקלעים של המחזמר "פריסילה מלכת המדבר". במהלך הסיור נבקר בפינות המיוחדות של התיאטרון, נשמע סיפורים על תהליך העבודה ונענה על שאלות הקהל.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('רומי + ג''ולייט', 'רומי-+-ג׳ולייט', 'תיאטרון הבימה', 110, 'דרמה חברתית מרגשת שמביאה עיבוד מודרני ל"רומיאו ויוליה", כשאהבה ראשונה מתמודדת עם אתגרים משפחתיים קשים.', 'דרמה חברתית על רומי, אב יחידני, וג''ולייט, צעירה הנלחמת על חלומה ללמוד באוניברסיטה. השניים חווים את עוצמתה של אהבה ראשונה, אך משפחתה של ג''ולייט חוששת לגורלה עם רומי. עיבוד מודרני ליצירתו של שייקספיר.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('תרקדי איתי', 'תרקדי-איתי', 'תיאטרון הבימה', 110, 'קומדיה אנושית מחממת לב על אב שמחדש קשר עם בתו דרך שיעורי ריקוד, תוך התמודדות עם החיים והאהבה.', 'קומדיה אנושית על פי הסרט הצרפתי המצליח. אליאס, שרת בבית ספר, חוטף התקף לב ומחליט לחדש את הקשר עם בתו אנה. הוא נרשם לשיעורי ריקוד בעיר הגדולה כדי להתקרב אליה.') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אוי-אלוהים' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אוי-אלוהים' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'בוסתן-ספרדי-2021' AND g.name = 'מחזמר' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'בוסתן-ספרדי-2021' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הג׳יגולו-מקונגו' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הג׳יגולו-מקונגו' AND g.name = 'דרמה קומית' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הסוחר-מוונציה' AND g.name = 'קלאסיקה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הסוחר-מוונציה' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'חתונה-מאוחרת' AND g.name = 'דרמה קומית' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'חתונה-מאוחרת' AND g.name = 'רומנטי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'להתראות-ותודה-על-הקרמשניט' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'להתראות-ותודה-על-הקרמשניט' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מחווה-לדיוות-הגדולות' AND g.name = 'מוזיקלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מחווה-לדיוות-הגדולות' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'סיור-מאחורי-הקלעים' AND g.name = 'מאחורי הקלעים' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'פינוקיו' AND g.name = 'מחזמר' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'פינוקיו' AND g.name = 'ילדים' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'פריסילה-מלכת-המדבר-סיור-מאחורי-הקסם!' AND g.name = 'מאחורי הקלעים' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'רומי-+-ג׳ולייט' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'רומי-+-ג׳ולייט' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'תרקדי-איתי' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'תרקדי-איתי' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
