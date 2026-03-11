-- Migration: Add new all_theatres shows
-- Generated on 2026-03-11T09:54:16.016Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('דרמה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מרגש') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('אשכבה', 'אשכבה', 'תיאטרון הקאמרי', 90, 'דרמה מרגשת על חיים, מוות ואובדן בכפר נידח, שבה אם צעירה נאבקת להציל את בנה התינוק והעגלון מתמודד עם כאבו האישי.', 'אגדה על מוות בכפר נידח, שבו שני זקנים מתים בצער על חייהם. אם צעירה מחפשת מרפא לבנה התינוק הגוסס, אך הוא מת. עגלון ששכל את בנו מתמודד עם כאבו בין שיכורים וזונות, בעוד כרובים אוספים את נשמות המתים.', 'אסתי קוסוביצקי, רמי ברוך, נדב אסולין, פלורנס בלוך, דינה בליי, טל בן בינה, ארנית מרק, אירית בשן, רונית זלוטין, יצחק חזקיה, דויד בילנקה, שני טרייסטמן, אבי טרמין, שמעון מימרן, יובל סגל, גבי עמרני, שמחה ברבירו, סיגלית פוקס, שי פיינברג, יעל צבי, סיימון קריכלי, רומן קריכלי, יוסי רחמני, סנדרה שונוולד (בהצגה זו השחקנים.ות טל בן בינה / ארנית מרק, אירית בשן, רונית זלוטין, יצחק חזקיה / דויד בילנקה, שני טרייסטמן, אבי טרמין, שמעון מימרן, יובל סגל, גבי עמרני / שמחה ברבירו משתתפים.ות לסירוגין.)') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אשכבה' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אשכבה' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
