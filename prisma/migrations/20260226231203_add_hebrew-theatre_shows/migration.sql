-- Migration: Add new hebrew-theatre shows
-- Generated on 2026-02-26T23:12:03.256Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('דרמה קומית') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('ילדים') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('ישראלי') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מוזיקלי') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מרגש') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קומדיה') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('הכל נשאר במשפחה', 'הכל-נשאר-במשפחה', 'התיאטרון העברי', 80, 'קומדיה בעיבוד חדש לסדרה הקומית המפורסמת, המציעה חוויות משפחתיות מצחיקות ומרגשות.', 'ההצגה מבוססת על להיט הטלוויזיה המקורית, ומשלבת את הדינמיקה המשפחתית עם הומור שנון והקשרים בין הדורות.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('זוג משמיים', 'זוג-משמיים', 'התיאטרון העברי', 100, 'קומדיה ישראלית בועטת על מפגש בין חרדי לחילוני, שמאתגרת את הגבולות של אהבה וקבלה.', 'רווק חרדי מבני ברק מתנחל בביתם של זוג תל אביבי ודורש מהם למצוא לו כלה נאה וחסודה, מה שמוביל למפגש תרבויות מעניין ומצחיק.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('פים פם פה', 'פים-פם-פה', 'התיאטרון העברי', 60, 'מופע קסום המשלב אגדות ילדים עם מוזיקה מרגשת, המציע חוויה בלתי נשכחת לכל המשפחה.', 'מסע מופלא באגדות הילדים האהובות, בליווי שיריה הנפלאים של נורית הירש, שמזמין את הקהל לעולם קסום של דמיון וחלומות.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('קנאביס', 'קנאביס', 'התיאטרון העברי', 90, 'קומדיה בראש טוב שמביאה את הצחוק וההנאה של התנסויות חדשות בעולם המודרני.', 'אברום וזהבה מתנסים לראשונה בחייהם בפרח פלא שמוביל אותם למסע מצחיק ומפתיע, תוך חקירה של חוויות חדשות.') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הכל-נשאר-במשפחה' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הכל-נשאר-במשפחה' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'זוג-משמיים' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'זוג-משמיים' AND g.name = 'ישראלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'פים-פם-פה' AND g.name = 'ילדים' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'פים-פם-פה' AND g.name = 'מוזיקלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'קנאביס' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'קנאביס' AND g.name = 'דרמה קומית' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
