-- Migration: Add new hakahn shows
-- Generated on 2026-02-27T00:15:31.413Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('דרמה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('ילדים') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('ישראלי') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מותחן') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מרגש') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('פנטזיה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קומדיה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קלאסיקה') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('אבדוֹת ומציאוּת', 'אבדוֹת-ומציאוּת', 'תיאטרון החאן', 75, 'דרמה פסיכולוגית מרתקת על סודות אפלים, המתרחשת באי מסתורי, שבה כל צעד יכול לחשוף אמת חדשה.', 'אנגליה, 1946. קבוצת אנשים מוזמנת לנופש על אי מסתורי. כל אחד מהם נושא סוד אפל והאי מתמלא במתח ומסתורין. מה שמתחיל כמפגש חברתי שלו הופך במהרה למסע מסוכן של גילוי עצמי והתמודדות עם השלכות העבר. במהלך לילה אחד נחשפים הסודות הכמוסים של האורחים, והמתחים ביניהם גוברים. הצטרפו לחוויה ייחודית, שבה כל אחד מגלה משהו על עצמו, על האחרים ועל המורכבות האנושית.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('ביבר הזכוכית', 'ביבר-הזכוכית', 'תיאטרון החאן', 100, 'דרמה משפחתית פיוטית על אכזבות, חלומות ושאיפה לאושר, המתרחשת בבית משפחה לאחר נטישת האב.', 'העלילה מתארת את חייה של משפחת וינגפילד, האם אמנדה ושני ילדיה הבוגרים טום ולורה, זמן קצר לאחר שאב המשפחה נטש אותם לטובת חיים חדשים. השלישייה נאבקת בשגרת חייה מלאת האכזבות, ובורחת אל עולם מקביל של אשליה ופנטזיה. טום הבן, בעל נפש האומן, נמלט בלילות לבית הקולנוע, אחותו המופנמת לורה מתכנסת לתוך עולמה הפרטי והאינטימי, ואימם הדומיננטית אמנדה נאחזת בעברה המפואר. כשמופיע בדירתם הקטנה בחור צעיר לארוחת ערב, המשפחה מוצפת בתקווה חדשה, אך המציאות שמביא איתו האורח מאיימת לסדוק את עולמם השברירי.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('בתחילת קיץ 1970', 'בתחילת-קיץ-1970', 'תיאטרון החאן', 60, 'דרמה אינטימית ומרגשת על זקנה ושכול, המתרחשת במפגש בין מנהל לבית ספר למורה המתקשה לעזוב.', 'בתחילת קיץ 1970 רודף מנהל בית הספר התיכון אחרי מורה לתנ"ך המסרב לצאת לפנסיה, ומבקש לבשר לו בשורה. מפגש אינטימי הנוגע באומץ בנושאים אנושיים עדינים - זקנה אהבה ושכול. הצגת יחיד על פי נובלה מאת אברהם ב. יהושע, שעיבדה וביימה מור פרנק.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('הֱיֵה שלום, מר הַפְמַן', 'הֱיֵה-שלום,-מר-הַפְמַן', 'תיאטרון החאן', 90, 'דרמה מרתקת על דילמה מוסרית בין חיים וסכנה בפריז הכבושה, עם הומור ותחכום.', 'השנה 1942 בפריז. מר הפמן, תכשיטן יהודי מצליח, מבין שחייו בסכנה ומציע לאחד מעובדיו עסקה: הוא יעביר לו את הבעלות על חנות התכשיטים, בתנאי שהאחרון יחביא אותו מהנאצים. פייר, העובד הצרפתי, חוזר עם הצעה נגדית: הוא ואשתו רוצים ילדים, אך פייר עקר. לאורך היצירה נרקמת בין שלוש הדמויות מערכת יחסים מיוחדת, כשברקע המציאות של פריז הכבושה סוגרת עליהם.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('יהודים רעים', 'יהודים-רעים', 'תיאטרון החאן', 90, 'קומדיה משפחתית חדה ומעוררת מחשבה על זהות יהודית, המתרקמת בלילה שאחרי ההלוויה.', 'נכדיו של סבא אהוב, יהודי ניצול שואה, מוצאים את עצמם במפגש משפחתי בלילה שאחרי הלווייתו. ביניהם דפנה, היהודייה המסורתית, ליאם החילוני ובת זוגו הגויה. עד מהרה נקלעים בני הדודים לעימות חריף סביב השאלות מיהו יהודי טוב? מה טוב בלהיות יהודי? והכי חשוב: מי יקבל את תליון ה"חי" יקר הערך של סבאל׳ה ז״ל?') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('סיפור פשוט', 'סיפור-פשוט', 'תיאטרון החאן', 90, 'דרמה נוגעת ללב על אהבה בלתי ממומשת, המבוססת על יצירתו המפורסמת של ש"י עגנון.', 'הירשל הורביץ, בן למשפחה עשירה, נשבה בקסמיה של בלומה נאכט, יתומה ענייה שעובדת בבית משפחתו. אך אימו מתנגדת לקשר בין השניים ומשדכת אותו עם מינה העשירה. החודשים עוברים, אבל הירשל לא מצליח להשתחרר מאהבתו הראשונה, אשר מייסרת אותו ומביאה אותו לכדי טירוף.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('על אם הדרך', 'על-אם-הדרך', 'תיאטרון החאן', 50, 'דרמה קהילתית המאתגרת את הדמויות לבחור בין נאמנות עצמית לבין לחצים חיצוניים, בפונדק דרכים קסום.', 'אי שם במקום לא נודע ישנו פונדק דרכים ישן, בו מדי יום מתקבצת לה חבורה עליזה. ביקור של אורחת מסתורית אשר בפיה הצעה מפתיעה, גורם לשינויים ולהתרחשויות אצל יושבי הפונדק ומאלץ אותם להכריע: האם עליהם להיות נאמנים לעצמם, או שמא עליהם להתאים עצמם לסטנדרטים של העולם שבחוץ.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('פליידייט', 'פליידייט', 'תיאטרון החאן', 60, 'הצגה אינטראקטיבית שבה הקהל הופך למחזה, משלב הומור ואלתור במופע חווייתי ומיוחד.', 'מופע ספונטני ומשעשע שבו הקהל מתנסה בתרגילי משחק ואלתור יחד עם השחקנים, כשהם מכתיבים את העלילה והדמויות על הבמה.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('תהלה', 'תהלה', 'תיאטרון החאן', 60, 'מסע מרגש בירושלים שבו הקהל פוגש דמויות שונות ומגלה את סיפור עברה של תהלה, בשילוב תיאטרון אביזרים ובובות.', 'הצגה אימרסיבית שבה הקהל מצטרף למסע בעקבות דמותה של תהלה, זקנה צדקת, בסמטאות ירושלים, כשהסיפור נפרש בין אבנים עתיקות ודמויות צבעוניות.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('תעלולי סקפן', 'תעלולי-סקפן', 'תיאטרון החאן', 90, 'קומדיה מבריקה שבה תככים ותושייה מובילים לאהבה ולתשלום על מעשים רעים, עם דמויות בלתי נשכחות.', 'קומדיה קלאסית על אוקטב וליאנדר האוהבים את זרבינט ואת היאסינט, ועל המשרת הספק עבריין, ספק פרחח, שמסייע להם לנצח את האתגרים שמציבים להם אבותיהם.') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אבדוֹת-ומציאוּת' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אבדוֹת-ומציאוּת' AND g.name = 'מותחן' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'ביבר-הזכוכית' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'ביבר-הזכוכית' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'בתחילת-קיץ-1970' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'בתחילת-קיץ-1970' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הֱיֵה-שלום,-מר-הַפְמַן' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הֱיֵה-שלום,-מר-הַפְמַן' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'יהודים-רעים' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'יהודים-רעים' AND g.name = 'ישראלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'סיפור-פשוט' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'סיפור-פשוט' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'על-אם-הדרך' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'על-אם-הדרך' AND g.name = 'פנטזיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'פליידייט' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'פליידייט' AND g.name = 'ילדים' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'תהלה' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'תהלה' AND g.name = 'פנטזיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'תעלולי-סקפן' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'תעלולי-סקפן' AND g.name = 'קלאסיקה' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
