-- Fix theatre name: rename bare 'תמונע' to 'תיאטרון תמונע'
UPDATE "Show" SET "theatre" = 'תיאטרון תמונע' WHERE "theatre" = 'תמונע';
