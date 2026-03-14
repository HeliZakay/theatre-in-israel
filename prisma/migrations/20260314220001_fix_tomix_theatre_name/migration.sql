-- Fix: revert Show.theatre back to תיאטרון toMix (only the venue name changed)
UPDATE "Show"
SET theatre = 'תיאטרון toMix'
WHERE theatre = 'תיאטרון toMix אקספו ת״א';
