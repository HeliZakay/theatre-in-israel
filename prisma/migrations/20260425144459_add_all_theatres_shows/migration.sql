-- Migration: Add new all_theatres shows
-- Generated on 2026-04-25T14:44:59.811Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('ילדים') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מוזיקלי') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('פנטזיה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קומדיה') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('ארבעה משלים ומלכה', 'ארבעה-משלים-ומלכה', 'הפקות עצמאיות', 50, 'קומדיה מינימליסטית המשלבת פנטומימה ושפה עשירה, בה שחקנית אחת מגלמת מגוון דמויות ומביאה את הסיפור לחיים בצורה מרתקת.', 'ארבעה סיפורים עטופים בסיפור: קומדיה במילים ובפנטומימה לשמונה חיות ומלכה אחת. המלכה שופטת, שאיבדה את פניה, פותרת תלונות החיות בבית המשפט ביער, ובכך מחזירה את השתקפותה במראה.', 'רותי תמיר') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('החולד הקטן', 'החולד-הקטן', 'הפקות עצמאיות', 50, 'הצגה מצחיקה ומוזיקלית המשלבת דיאלוגים שנונים עם שיעור חשוב על נחישות, המצליחה לרתק ילדים ומבוגרים כאחד.', 'הצגת ילדים מוסיקלית ומצחיקה בהשראת סיפור הילדים המפורסם על חולד קטן שמחפש את מי שעשה לו על הראש. במהלך המסע הוא לומד על העולם דרך מפגשים עם חיות שונות.', 'דניאל סבג, איציק לילך, ירדן לויתן') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('סילבר שואו איש צינור', 'סילבר-שואו-איש-צינור', 'הפקות עצמאיות', 50, 'מופע מחול ייחודי המשלב חומרים יומיומיים ליצירת חוויה מרהיבה ומרתקת, המובילה את הקהל לעולם של דמיון ופנטזיה.', 'מופע מחול מודרני קצבי המשלב חומרים ואביזרים שונים, כמו צינורות מתכת ונורות מהבהבות, ויוצר עולם פנטסטי שבו הכול אפשרי, מעורר השראה ומשעשע.', 'כספית ישלח, שחר שובה, שיר גורדון,נעמה מאור, דנה בן שמואל') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('פופלינדה בממלכת הדמיון', 'פופלינדה-בממלכת-הדמיון', 'הפקות עצמאיות', 50, 'מופע קסום המשלב הומור והרפתקאות, המוביל את הילדים לגלות את הכוח שבדמיון והיצירתיות שבפניהם.', 'מופע תיאטרון-מחול לכל המשפחה המזמין את הצופים למסע דמיוני עם פופלינדה ורוברטו, שבו הם חווים הרפתקאות קסומות ומגלים שהממלכה חיה בתוך הדמיון.', NULL) ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'ארבעה-משלים-ומלכה' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'ארבעה-משלים-ומלכה' AND g.name = 'פנטזיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'החולד-הקטן' AND g.name = 'ילדים' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'החולד-הקטן' AND g.name = 'מוזיקלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'החולד-הקטן' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'סילבר-שואו-איש-צינור' AND g.name = 'פנטזיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'סילבר-שואו-איש-צינור' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'פופלינדה-בממלכת-הדמיון' AND g.name = 'ילדים' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'פופלינדה-בממלכת-הדמיון' AND g.name = 'פנטזיה' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
