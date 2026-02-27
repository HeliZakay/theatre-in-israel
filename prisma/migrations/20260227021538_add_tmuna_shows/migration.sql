-- Migration: Add new tmuna shows
-- Generated on 2026-02-27T02:15:38.259Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('מוזיקלי') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קומדיה') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('דיסקו, בייבי !', 'דיסקו,-בייבי-!', 'תיאטרון תמונע', 60, 'מופע דיסקו מרהיב המשלב מסיבה והרקדה קבוצתית, בו הקהל לומד ריקודים מהסבנטיז ומתחבר לחוויית תנועה משמחת.', 'האירוע ''דיסקו, בייבי'' הוא מופע משולב מסיבה והרקדה קבוצתית נוסח Bal Moderne לצלילי פלייליסט מטריף של הלהיטים מהסבנטיז. Bal Moderne היא צורת הרקדה קבוצתית, עממית, המיועדת לאנשים שאין להם רקע מקצועי בתנועה אבל אוהבים לזוז.') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'דיסקו,-בייבי-!' AND g.name = 'מוזיקלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'דיסקו,-בייבי-!' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
