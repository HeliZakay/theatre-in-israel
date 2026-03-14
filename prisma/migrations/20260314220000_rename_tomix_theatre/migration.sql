-- Rename תיאטרון toMix → תיאטרון toMix אקספו ת״א

-- Update Show.theatre
UPDATE "Show"
SET theatre = 'תיאטרון toMix אקספו ת״א'
WHERE theatre = 'תיאטרון toMix';

-- Update Venue.name
UPDATE "Venue"
SET name = 'תיאטרון toMix אקספו ת״א'
WHERE name = 'תיאטרון toMix';
