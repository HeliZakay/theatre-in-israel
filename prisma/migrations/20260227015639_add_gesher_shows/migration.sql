-- Migration: Add new gesher shows
-- Generated on 2026-02-27T01:56:39.582Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('דרמה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('דרמה קומית') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('ילדים') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מחזמר') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מרגש') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('פנטזיה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קומדיה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קומדיה שחורה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קלאסיקה') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('איך ג''ירפה ישנה', 'איך-ג׳ירפה-ישנה', 'תיאטרון גשר', 50, 'הצגה קסומה לילדים על אהבה בלתי אפשרית בין ג''ירפה לקרנף, שמגלה את כוחות הקסם והתקווה בעולם מלא הבדלים.', 'סיפור על אהבה בלתי אפשרית בין ג''ירפה לקרנף בסוואנה של אפריקה. המפגש הראשון בין השניים מתגלה כמאתגר בשל ההבדלים העצומים ביניהם, אך הם מוצאים פתרון שיאפשר להם להיפגש.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('אמא קוראז'' וילדיה', 'אמא-קוראז׳-וילדיה', 'תיאטרון גשר', 135, 'דרמה עוצמתית של ברטולד ברכט, המעמידה במרכז את חוויותיה של אם המנסה לשרוד את המלחמה, תוך התמודדות עם דילמות מוסריות קשות.', 'אמא קוראז'', רוכלת קשת יום, מנסה לשרוד את ימי המלחמה ולהאכיל את ילדיה, תוך שהיא מתמודדת עם דילמות מוסריות קשות. ההצגה עוסקת במחיר ההקרבה ובקונפליקטים של תלות במלחמה.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('אנה קרנינה', 'אנה-קרנינה', 'תיאטרון גשר', 150, 'דרמה קלאסית של לב טולסטוי, המציעה מבט מעמיק על אהבה, בגידה ומאבק פנימי בין חובות אישיים לרצונות הלב.', 'אנה קרנינה, אישה עם בעל וילד, מתאהבת בקצין יפה תואר, מה שמערער את חיי המשפחה שלה. ההצגה עוסקת בהתמודדות עם בגידה ושגרה מול הרפתקה.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('האוצר מתחת לגשר', 'האוצר-מתחת-לגשר', 'תיאטרון גשר', 75, 'מעשיה קסומה על מסע חיפוש אחר אוצר, המשלבת ערכים של חברות ותקווה, ומביאה חיוך על פני הילדים.', 'מסע משעשע בעקבות פלוני אלמוני, שמגלה כי בעיר רחוקה ממתין לו אוצר. במהלך המסע הוא פוגש דמויות שונות ומגלה על חברות, תקווה ואהבה.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('הדיבוק', 'הדיבוק', 'תיאטרון גשר', 120, 'דרמה יהודית קלאסית על אהבה גדולה מהחיים, המתרחשת בין שני עולמות, עם פרשנות מודרנית מרגשת.', 'סיפור אהבתם של חנן ולאה, כאשר נשמתו של חנן נשארת בין העולמות לאחר מותו, והוא שב כדיבוק אל אהובתו ביום חתונתה עם אחר.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('יאקיש ופופצ''ה', 'יאקיש-ופופצ׳ה', 'תיאטרון גשר', 110, 'קומדיה שנונה על דימויים וציפיות בחיי המין, המציעה מבט מצחיק ועגום על חיי הזוגיות.', 'קומדיה עגומה על יאקיש ופופצ''ה, זוג מכוער ועני, המתמודד עם ציפיות חברתיות ומסע הזוי להביא ילדים לעולם.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('להתעורר', 'להתעורר', 'תיאטרון גשר', 100, 'דרמה גרוטסקית המציעה חוויה ייחודית של מפגש בין דמויות, תוך חקר של זהות ושברון לב.', 'ההצגה עוסקת במפגש מקרי בין שתי דמויות ייחודיות בעולם חדש וגרוטסקי, בו הן מתמודדות עם שברי חייהן הקודמים.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('מי כמוני', 'מי-כמוני', 'תיאטרון גשר', 100, 'ההצגה מי כמוני חוקרת את חיי בני הנוער במרכז רפואי, תוך שימוש בכוח המרפא של התיאטרון כדי להעלות את מפלס החמלה בחברה.', 'במרכז לרפואת הנפש ''אורות'' מאושפזים חמישה בני נוער. הם ישנים יחד, אוכלים יחד ויוצרים יחד הצגה. ''מי כמוני'' מעניקה הצצה למחלקה הסגורה, אל חייהם של הצוות הרפואי, בני הנוער וההורים שלהם. ההצגה עוסקת בכוחו המרפא של התיאטרון מתוך תקווה להעלות את מפלס החמלה.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('מסעות אודיסאוס', 'מסעות-אודיסאוס', 'תיאטרון גשר', 75, 'מסעות אודיסאוס היא הצגה לכל המשפחה המשלבת פנטזיה והרפתקה, כאשר אבא ובנו ממתינים לשובו הביתה של המלך אודיסאוס ממסע מלא תלאות.', 'אבא אודי נוסע לעשרה ימים ומשאיר לבנו טל ספר קסום. בספר מסופר על המלך אודיסאוס שיצא למלחמה וניצח, אך דרכו חזרה הביתה מתארכת והופכת לאודיסאה – מסע ארוך ורב תלאות. ההצגה מציעה חוויה משפחתית מרגשת על חיי נצח וחיבור בין אב לבן.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('פו הדב', 'פו-הדב', 'תיאטרון גשר', 75, 'פו הדב מגיע לבמה עם הרפתקאות מצחיקות ומלמדות ביער אלף הצעדים, מציע חוויות חמות לכל המשפחה בגילאי 4-8.', 'פו הדב מתעורר ביער אלף הצעדים עם מחשבה אחת – דבש. הוא יוצא להרפתקאות עם חבריו, חזרזיר, הארנבת ואיה, תוך כדי חוויות מצחיקות ומלמדות. ההצגה מציעה חיבוק פרוותי שמחמם את הלב ומביאה את הסיפורים הקלאסיים לחיים.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('קרום', 'קרום', 'תיאטרון גשר', 120, 'קרום, יצירת המופת של חנוך לוין, מקבלת פרשנות מוזיקלית חדשה, המשלבת הומור ותוגת הקיום האנושי בסיפור על כישלון וחלומות שלא התממשו.', 'יצירת המופת של חנוך לוין מציגה את סיפורו של קרום, שחוזר לעיר הולדתו לאחר כישלון בחו"ל ומגלה מציאות חסרת תקווה. ההפקה המוזיקלית החדשה משלבת הומור מריר עם תוגת הקיום האנושי.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('רוזנקרנץ וגילדנשטרן מתים', 'רוזנקרנץ-וגילדנשטרן-מתים', 'תיאטרון גשר', 160, 'רוזנקרנץ וגילדנשטרן מתים מציע הצצה שנונה ומרגשת אל מאחורי הקלעים של המלט, כשהדמויות המשניות הופכות לגיבורים הראשיים.', 'רוזנקרנץ וגילדנשטרן הם דמויות משנה ב''המלט'' של שייקספיר, שהופכות לגיבורים הראשיים במחזה המודרני של טום סטופארד. דרך עיניהם אנו זוכים להצצה אל מאחורי הקלעים של הטרגדיה המפורסמת, במחזה שנון המהלל את האדם ואת אמנות התיאטרון.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('ריצ''רד III', 'ריצ׳רד-III', 'תיאטרון גשר', 170, 'ריצ''רד III מציע מסע מרהיב של הרס עצמי, כשהנבל הפגוע משקף את פגמי החברה האנושית בדרכו לכס המלכות.', 'ההצגה עוסקת בריצ''רד השלישי, ילד דחוי שהופך לרודן אכזר. הטרגדיה המשפחתית מתפתחת לטרגדיה לאומית, כאשר שייקספיר מציג את ריצ''רד כנבל מרהיב, המראה את פגמי החברה האנושית.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('שמשון', 'שמשון', 'תיאטרון גשר', 140, 'דרמה היסטורית מרתקת על שמשון ודלילה, שבה מתערבבים אהבה, קנאה וגורל אישי עם ההיסטוריה של עם ישראל.', 'בני ישראל מחולקים לשבטים, ואין מלך בישראל. שמשון, לוחם ושופט, פוגש את דלילה ואהבתם מתמודדת עם קנאה וגורל. סיפור המשלב מיתוס ואתוס, הרס ואֶרוס.') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'איך-ג׳ירפה-ישנה' AND g.name = 'ילדים' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'איך-ג׳ירפה-ישנה' AND g.name = 'פנטזיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אמא-קוראז׳-וילדיה' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אנה-קרנינה' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אנה-קרנינה' AND g.name = 'קלאסיקה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אנה-קרנינה' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'האוצר-מתחת-לגשר' AND g.name = 'ילדים' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'האוצר-מתחת-לגשר' AND g.name = 'פנטזיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הדיבוק' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הדיבוק' AND g.name = 'קלאסיקה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הדיבוק' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'יאקיש-ופופצ׳ה' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'יאקיש-ופופצ׳ה' AND g.name = 'קומדיה שחורה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'להתעורר' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מי-כמוני' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מי-כמוני' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מסעות-אודיסאוס' AND g.name = 'ילדים' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מסעות-אודיסאוס' AND g.name = 'פנטזיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'פו-הדב' AND g.name = 'ילדים' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'פו-הדב' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'קרום' AND g.name = 'מחזמר' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'קרום' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'קרום' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'רוזנקרנץ-וגילדנשטרן-מתים' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'רוזנקרנץ-וגילדנשטרן-מתים' AND g.name = 'דרמה קומית' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'ריצ׳רד-III' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'ריצ׳רד-III' AND g.name = 'קלאסיקה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'שמשון' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'שמשון' AND g.name = 'קלאסיקה' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
