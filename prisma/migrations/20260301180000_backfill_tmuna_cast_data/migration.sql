-- Backfill actors-only cast data for Tmuna Theatre (תיאטרון תמונע) shows
-- Cast extracted from individual show pages at tmu-na.org.il
-- Format: comma-separated actor names
-- 18 shows updated

UPDATE "Show" SET "cast" = 'סופה צ‘ודנובסקי, יורי קזנצב, גריגורי קצנלסון, מריה מקייב/יבגניה נתנוב' WHERE "slug" = 'HANNAH';
UPDATE "Show" SET "cast" = 'מעין בלום, אברהם סלקטר, מעין קילצ''בסקי ותמיר גינזבורג' WHERE "slug" = 'לא-סוף-העולם';
UPDATE "Show" SET "cast" = 'איסק צ''וקרון, שירה פרבר, אייל שכטר, גיא רון, מיכל טופורק' WHERE "slug" = 'אש-בארזים';
UPDATE "Show" SET "cast" = 'אביגיל אריאלי, ערן בוהם, עמרי בן עמי, דניאל זהבי, אייל זוסמן, יעל מסנר, טליה לין רון, ניר שטראוס' WHERE "slug" = 'שחף-עודד-קוטלר';
UPDATE "Show" SET "cast" = 'אורי אברהמי, אלי דנקר/אייל נחמיאס, שאול עזר' WHERE "slug" = 'איך-לא-חשבתי-על-זה-קודם';
UPDATE "Show" SET "cast" = 'יפתח אופיר' WHERE "slug" = 'ימח-שמי';
UPDATE "Show" SET "cast" = 'אלירן כספי, הילה לב-ארי/רחלי פנחס, נעם ברמט/יעל שטולמן, מאשה שמוליאן' WHERE "slug" = 'אבא-יצא-מהקבוצה';
UPDATE "Show" SET "cast" = 'רפ"ק דולב מזרחי- אריאל יגן/שחף קהלני, פקד סתיו לוי- שירן בוחניק/אביטל רודצקי, משה מטאייב- מתן בן עמי, יחיאל אבוסביתאן- רם גואטה, אבי ביטן- שחף קהלני/איתמר אליהו, אלירן אבוסביתאן- יוני גבורה, רז מטאייב- יותם רוטשטיין' WHERE "slug" = 'רצח-במועדון-הטרנספר';
UPDATE "Show" SET "cast" = 'אוהד שחר, יחיעם ברקו' WHERE "slug" = 'אדום';
UPDATE "Show" SET "cast" = 'ערן בוהם, אלון לשם, ניבה אלוש, שירה פרבר' WHERE "slug" = 'דירה-לא-להשכיר';
UPDATE "Show" SET "cast" = 'מאיה ליבני, יובל קנין נחמיאס / נדב ארטשיק, עדי שור' WHERE "slug" = 'בילבי';
UPDATE "Show" SET "cast" = 'שיא דרייגור קדמן, יריב קוק, שנטל כהן, מור אלוש, גיא בירגר, יעקב אוחנה ואברום הורוביץ' WHERE "slug" = 'המורה';
UPDATE "Show" SET "cast" = 'נטע וינר, אורי יניב, נטע שפיגלמן, בני אלדר, יפתח אופיר' WHERE "slug" = 'שמואל';
UPDATE "Show" SET "cast" = 'מעין בלום, שמעון מימרן/יגאל זקס, ליז רביאן, אורלי טובלי, ויקטור סבג' WHERE "slug" = 'הפצוע-הישראלי';
UPDATE "Show" SET "cast" = 'יוסי ירום, תמיר גינזבורג, מאשה שמוליאן, מעין אור' WHERE "slug" = 'פריקואל-וסיקואל-יורשים-כת';
UPDATE "Show" SET "cast" = 'נעם ברמט, אלירן כספי' WHERE "slug" = 'אקספוז׳ר';
UPDATE "Show" SET "cast" = 'אסתי זקהיים, אלחי לויט, שירה קוריאל / מאיה הר-ציון, דליה שימקו, אייל שכטר, שלום שמואלוב' WHERE "slug" = 'מהפכניות';
UPDATE "Show" SET "cast" = 'אייל שכטר, תומר גלרון, יולי מובצ''ן ודליה שימקו' WHERE "slug" = 'השתקפויות';
