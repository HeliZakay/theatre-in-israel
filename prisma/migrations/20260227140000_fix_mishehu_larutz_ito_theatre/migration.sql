-- Fix theatre: move "מישהו לרוץ איתו" from תיאטרון חיפה to תיאטרון גשר
UPDATE "Show" SET "theatre" = 'תיאטרון גשר' WHERE "slug" = 'מישהו-לרוץ-איתו';
