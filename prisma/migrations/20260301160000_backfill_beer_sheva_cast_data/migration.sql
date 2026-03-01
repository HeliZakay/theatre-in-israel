-- Backfill actors-only cast data for Beer Sheva Theatre (תיאטרון באר שבע) shows
-- Cast extracted from individual show pages at b7t.co.il
-- Format: comma-separated actor names, / for alternates
-- 4 shows updated

UPDATE "Show" SET "cast" = 'לנה פרייפלד / טטיאנה מחלינובסקי, ולד פסחוביץ׳, יורי קזנצב, יאן קוגן' WHERE "slug" = 'באר-שבסקיה';
UPDATE "Show" SET "cast" = 'אורי דב יוסף בלופרב, עינת הולנד, פלורנס בלוך, דנה מיינרט – הורביץ, חגית דסברג, נעמי אורן/ גיל פישמן, ינאי כץ/ רועי דוד, גל כהן/דולב אסולין ילדים גל אדלשטיין/עוז עמינוב, מיקה פריינטי/נעמה גלר' WHERE "slug" = 'פינק-ליידי';
UPDATE "Show" SET "cast" = 'אפרת בוימולד, יואב דונט, רון ביטרמן' WHERE "slug" = 'העלמה-והמוות';
UPDATE "Show" SET "cast" = 'אסתי זקהיים, חליפה נאטור, אורן כהן/יואב דונט, רון ביטרמן, ויקי כהן, מיכל שטמלר' WHERE "slug" = 'מקומות-שמורים';
