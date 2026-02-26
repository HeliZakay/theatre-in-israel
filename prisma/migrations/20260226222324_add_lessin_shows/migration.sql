-- Migration: Add new lessin shows
-- Generated on 2026-02-26T22:23:24.558Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('מאחורי הקלעים') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('סיור מאחורי הקלעים', 'סיור-מאחורי-הקלעים-תיאטרון-בית-ליסין', 'תיאטרון בית ליסין', 60, 'סיור מאחורי הקלעים בבית ליסין מציע חוויה ייחודית של גילוי הסודות שמאחורי הבמה, עם אפשרות לשאלות ותשובות באווירה חופשית.', 'סיור מאחורי הקלעים בתיאטרון בית ליסין מציע הצצה לעולמו הפנימי של התיאטרון, כולל אולמות, תפאורה, תלבושות וחדרי חזרות, תוך שיחה על ההיסטוריה של התיאטרון.') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'סיור-מאחורי-הקלעים-תיאטרון-בית-ליסין' AND g.name = 'מאחורי הקלעים' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
