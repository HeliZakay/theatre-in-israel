-- Migration: Reassign shows to new theatre group 'פנתאון'
-- Moves 5 shows from 'הפקות עצמאיות' to the new 'פנתאון' theatre group.
-- Idempotent: only updates shows currently matching the old theatre.

UPDATE "Show" SET theatre = 'פנתאון'
WHERE slug IN (
  'קיצור-תהליכים',
  'מזוייפת',
  'יצרים-רעים',
  'זו-שכותבת-אותי',
  'המאהבת'
);
