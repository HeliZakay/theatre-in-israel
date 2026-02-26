-- Migration: Add new lessin shows
-- Generated on 2026-02-26T21:17:35.795Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('מאחורי הקלעים') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('סיור מאחורי הקלעים', 'סיור-מאחורי-הקלעים', 'תיאטרון בית ליסין', 60, 'סיור מרתק מאחורי הקלעים בתיאטרון בית ליסין, המציע הצצה לעולמו הפנימי של התיאטרון והיסטוריה עשירה.', 'סיור בתיאטרון בית ליסין הוא הצצה נדירה אל עולמו הפנימי של התיאטרון. הסיור כולל ביקור באולמות, התפאורה, התלבושות וחדרי חזרות, עם הסיפורים שמתרחשים מאחורי הקלעים. נדבר על ההיסטוריה של התיאטרון וכל מה שתרצו לשאול.') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'סיור-מאחורי-הקלעים' AND g.name = 'מאחורי הקלעים' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
