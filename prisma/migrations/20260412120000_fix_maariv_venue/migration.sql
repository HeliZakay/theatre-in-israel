-- Migration: Fix מעריב venue name and city
-- Venue: תיאטרון בית אלפא → תיאטרון אלפא, city: בית אלפא → תל אביב

UPDATE "Venue"
SET name = 'תיאטרון אלפא',
    city = 'תל אביב',
    regions = ARRAY['center']
WHERE name = 'תיאטרון בית אלפא'
  AND city = 'בית אלפא';
