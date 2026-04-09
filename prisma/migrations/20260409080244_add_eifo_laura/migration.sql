-- Migration: Add show איפה לורה to הפקות עצמאיות
-- Generated on 2026-04-09
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres (idempotent)
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('מחזמר') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קומדיה') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Show
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('איפה לורה', 'איפה-לורה', 'הפקות עצמאיות', 120, 'מחזמר קומי על אם ואחות שיוצאות לחפש את לורה שנעלמה בעיירה אמריקאית, ומגלות כת מסתורית שמנסה להחזיר לחיים את כוכבי הרוק הגדולים מהעבר — עם להקה חיה, כוריאוגרפיה סוחפת וטוויסט מופרע שבודק את גבולות ז׳אנר המיוזיקל.', 'לורה, הבת המושלמת, נעלמת בעיירה אמריקאית קטנה. אמה ואחותה יוצאות לחפש אחריה ונקלעות לכת מסתורית שמנסה להחזיר לחיים את כוכבי הרוק הגדולים מהעבר — אלביס, מייקל ג׳קסון, פרדי מרקורי ועוד. עם להקה חיה של ארבעה נגנים, כוריאוגרפיה סוחפת ושחקנים מהפקות בולטות כמו ״תיכון מגשימים״, ״העיר הזאת״ ו״זו ירושלים״ — ״איפה לורה?״ היא חוויה תיאטרונית מחשמלת שמציעה טוויסט חצוף ומופרע שבודק את גבולות ז׳אנר המיוזיקל.', 'בר כהן מורד, גלי אשכנזי לוין, גיא רון, אליאו בן זאב, אדיר בקשי, לי בלישה, יובל בירן, שגיא שולמן') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'איפה-לורה' AND g.name = 'מחזמר' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'איפה-לורה' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
