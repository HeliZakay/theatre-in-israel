-- Migration: Add 3 events for show איפה לורה
-- Generated on 2026-05-05
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Venues (idempotent)
-- ============================================================
INSERT INTO "Venue" (name, city, regions) VALUES ('אודיטוריום אניס', 'תל אביב', ARRAY['center']) ON CONFLICT (name, city) DO NOTHING;
INSERT INTO "Venue" (name, city, regions) VALUES ('מרכז דוהל', 'תל אביב', ARRAY['center']) ON CONFLICT (name, city) DO NOTHING;

-- ============================================================
-- 2. Insert Events (venue resolved by name+city, safe across envs)
-- ============================================================
INSERT INTO "Event" ("showId", "venueId", date, hour) SELECT s.id, v.id, DATE '2026-05-10', '20:00' FROM "Show" s, "Venue" v WHERE s.slug = 'איפה-לורה' AND v.name = 'אודיטוריום אניס' AND v.city = 'תל אביב' ON CONFLICT DO NOTHING;
INSERT INTO "Event" ("showId", "venueId", date, hour) SELECT s.id, v.id, DATE '2026-05-27', '20:00' FROM "Show" s, "Venue" v WHERE s.slug = 'איפה-לורה' AND v.name = 'מרכז דוהל' AND v.city = 'תל אביב' ON CONFLICT DO NOTHING;
INSERT INTO "Event" ("showId", "venueId", date, hour) SELECT s.id, v.id, DATE '2026-07-30', '20:00' FROM "Show" s, "Venue" v WHERE s.slug = 'איפה-לורה' AND v.name = 'אודיטוריום אניס' AND v.city = 'תל אביב' ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Venue"', 'id'), (SELECT MAX(id) FROM "Venue"));
SELECT setval(pg_get_serial_sequence('"Event"', 'id'), (SELECT MAX(id) FROM "Event"));
