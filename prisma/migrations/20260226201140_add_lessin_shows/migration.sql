-- Migration: Add new lessin shows
-- Generated on 2026-02-26T20:11:40.319Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('דרמה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מאחורי הקלעים') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מוזיקלי') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מחזמר') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מרגש') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קלאסיקה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('רומנטי') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('אמא', 'אמא', 'תיאטרון בית ליסין', 90, 'דרמה משפחתית נוקבת על חזרה הביתה, סודות משפחתיים וכיצד האהבה יכולה לגשר על פערים בין דורות.', 'זמרת-עבר שהתבטאות אומללה חיסלה את הקריירה שלה, שבה לארץ לאחר שנים של גלות כפויה בארצות-הברית. במפגש המחודש עם שתי בנותיה הבוגרות נחשפים סודות ומשקעים כואבים מהעבר. האם שלוש הנשים העצמאיות והשונות כל כך יצליחו להפוך שוב למשפחה?') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('הזמנה מהירה', 'הזמנה-מהירה', 'תיאטרון בית ליסין', 110, 'גרסה חדשה ומרהיבה למחזה המוזיקלי הקלאסי ''סיפור הפרברים'', המפגישה בין אהבה, מלחמה וטרגדיה ברחובות ניו יורק.', 'סיפור אהבתם האסורה של טוני, צעיר אמריקאי החבר בכנופיה, ומריה, אחותו של מנהיג הכנופיה הפורטוריקנית היריבה. סיפור האהבה הזה הופך למאבק דרמטי בין שתי כנופיות ברחובות ניו יורק, עד לסוף הטרגי.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('החברות של אלוהים', 'החברות-של-אלוהים', 'תיאטרון בית ליסין', 75, 'דרמה המציעה מבט חדש על דמויות נשיות מקראיות, חושפת את כאבן ומאבקן על מקומן בחברה.', 'שלוש שחקניות מקימות לתחייה שלוש דמויות נשים תנ"כיות: שרה אמנו, נעמי ופילגש בגבעה, ומאפשרות להן לחשוף את האמת שלהן בסיפורי התנ"ך המוכרים. ההצגה מציעה קריאה מחודשת בסיפורי המקרא מנקודת מבט רעננה ועכשווית.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('לילה – סיפורה של לילה מוראד', 'לילה-–-סיפורה-של-לילה-מוראד', 'תיאטרון בית ליסין', 75, 'סיפור חייה של לילה מוראד, כוכבת קולנוע וזמרת, המשלב בין נוסטלגיה למוזיקה מרגשת.', 'דרמה מוזיקלית בהשראת חייה של לילה מוראד, כוכבת-על יהודייה במצרים. הסיפור נוגע בתהילה, השבר והבחירות שהובילו אותה עד הלום, עם מוזיקה משיריה וקטעי שירה חיה על הבמה.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('סיור מאחורי הקלעים', 'סיור-מאחורי-הקלעים', 'תיאטרון בית ליסין', 60, 'סיור חווייתי המאפשר הצצה לעולם התיאטרון, תוך גילוי הסודות שמאחורי הקלעים.', 'סיור בתיאטרון בית ליסין המציע הצצה נדירה אל עולמו הפנימי של התיאטרון, כולל התפאורה, התלבושות וחדרי חזרות, עם אפשרות לשאול שאלות.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('שוחט בעקבות אמדאוס', 'שוחט-בעקבות-אמדאוס', 'תיאטרון בית ליסין', 90, 'קונצרט מרהיב המגלה את סוד גאונותו של מוצארט דרך מוזיקה ופרשנות חדשה.', 'קונצרט ייחודי שבו גיל שוחט פוגש את הגאון וולפגנג אמדאוס מוצארט, עם ביצועים של יצירותיו והסיפורים מאחורי המוזיקה.') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אמא' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אמא' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הזמנה-מהירה' AND g.name = 'מחזמר' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הזמנה-מהירה' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הזמנה-מהירה' AND g.name = 'רומנטי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'החברות-של-אלוהים' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'החברות-של-אלוהים' AND g.name = 'קלאסיקה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'לילה-–-סיפורה-של-לילה-מוראד' AND g.name = 'מוזיקלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'לילה-–-סיפורה-של-לילה-מוראד' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'סיור-מאחורי-הקלעים' AND g.name = 'מאחורי הקלעים' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'שוחט-בעקבות-אמדאוס' AND g.name = 'מוזיקלי' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
