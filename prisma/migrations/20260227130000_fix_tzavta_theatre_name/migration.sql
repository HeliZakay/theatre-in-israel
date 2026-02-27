-- Fix theatre name: rename bare 'צוותא' to 'תיאטרון צוותא'
UPDATE "Show" SET "theatre" = 'תיאטרון צוותא' WHERE "theatre" = 'צוותא';
