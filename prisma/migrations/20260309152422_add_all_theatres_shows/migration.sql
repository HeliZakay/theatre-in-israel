-- Migration: Add new all_theatres shows
-- Generated on 2026-03-09T15:24:22.747Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('דרמה קומית') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מוזיקלי') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('סאטירה') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('Die Blumen', 'Die-Blumen', 'תיאטרון תמונע', 120, 'קברט אנטי-מלחמתי סוחף המתרחש במקביל בין נקודות שונות, מציע חוויה חופשית ומעוררת השראה על עולם טוב יותר בעידן של כאוס.', 'ההצגה מתרחשת בזמן מלחמת העולם השנייה, ומביאה לקדמת הבמה קברט אנטי-מלחמתי צבעוני שמזמין את הצופים לנוע בחופשיות בין הנקודות השונות של החלל, תוך כדי חוויית מוסיקה, תנועה וטקסט.
- אין ישיבה באולם. ', 'אנסמבל פולקרו') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'Die-Blumen' AND g.name = 'מוזיקלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'Die-Blumen' AND g.name = 'דרמה קומית' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'Die-Blumen' AND g.name = 'סאטירה' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
