-- Nullify cast for all shows not belonging to הבימה or הקאמרי theatres
UPDATE "Show"
SET "cast" = NULL
WHERE "theatre" NOT IN ('תיאטרון הבימה', 'תיאטרון הקאמרי');
