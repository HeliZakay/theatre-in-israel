-- Migration: Add new gesher shows
-- Generated on 2026-04-15T21:11:36.447Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('דרמה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קלאסיקה') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('בית ברנרדה אלבה', 'בית-ברנרדה-אלבה', 'תיאטרון גשר', 105, 'דרמה קלאסית מאת פדריקו גרסיה לורקה, המגוללת סיפור על חירות ודיכוי בבית סגור, בו חמש בנות נאבקות על חופשיהן מול סמכות אימן.', 'כשבעלה של ברנרדה מת, היא מכריזה על שמונה שנים של אבל וסוגרת את חמש בנותיה בבית. הבית שהיה אמור להגן עליהן הופך לכלא, והאלימות מתחפשת לסדר. לא כל הבנות מוכנות להשלים עם זה.', 'אפרת בן-צור, מיכל ויינברג, עירית בנדק, קארין סרויה, דר רוזנבאום, ניקול פודבלני, אופיר צויגנבום, טלי אוסדצ''י, נועה כרמי, ליליאן שלי רות') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'בית-ברנרדה-אלבה' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'בית-ברנרדה-אלבה' AND g.name = 'קלאסיקה' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
