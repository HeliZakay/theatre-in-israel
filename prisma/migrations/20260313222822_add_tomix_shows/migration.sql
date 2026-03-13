-- Migration: Add new tomix shows
-- Generated on 2026-03-13T22:28:22.367Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('ישראלי') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מחזמר') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מרגש') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קומדיה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קלאסיקה') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('אהבה מודרנית', 'אהבה-מודרנית', 'תיאטרון toMix', 80, 'קומדיה ישראלית חדשה שמביאה את סיפור האהבה המודרני עם טוויסטים בלתי צפויים.', 'יעל, רווקה תוססת, מחליטה להביא ילד – ובוחרת באסף, בעלה של חברתה הטובה, כמועמד המושלם. במקביל נכנס לחייה בני, גבר מסתורי עם ביטחון מופרז ותיאוריות מפתיעות על זוגיות, שמאיים לטרוף את כל התוכניות.
מכאן מתחיל גלגל מטורף של אהבה, בלגן, חלומות וחדר מלון אחד שבו כל הרעיונות על אהבה מקבלים חיים – ובעיקר צחוק גדול.
קומדיה רומנטית עכשווית, שנונה, מצחיקה ומרגשת – על אהבה, נאמנות, חברות ומה שביניהם.', 'טלי אורן, מלי לוי, אילן רוזנפלד, גיא לואל/ מולי שולמן') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('אנני', 'אנני', 'תיאטרון toMix', 140, 'המחזמר המפורסם אנני חוזר בגרסה ישראלית חדשה, מלאה בשירים בלתי נשכחים וסיפור מרגש על אהבה ותקווה.', 'אנני כובשת את הקהל במסע מרגש מבית היתומות הקשוח של מיס האניגן אל חיים חדשים בביתו של המיליארדר אוליבר וורבקס. אנני, שנחושה לגלות מה עלה בגורל הוריה, יוצאת להרפתקה ומלמדת את כולם שיעור באהבה, תקווה ואומץ.', 'איליה גוחמן, אנדראה פרנקורט, אמיר אהרוני, גארי ווינדמן, גיל זגורי, דין רואס, חנן שוורצברג, יובל גרוס, נועם ליברמן, עדן אמסילי, ענת יעקב, ציון חורי, רותם גלזר, שון ויילר') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('מצחיקונת – Funny Girl', 'מצחיקונת-–-Funny-Girl', 'תיאטרון toMix', 120, 'הגרסה הישראלית למחזמר המצליח מצחיקונת מביאה את סיפור חייה של כוכבת עם שירים בלתי נשכחים והפקה מרהיבה.', 'גרסה ישראלית חדשה לקלאסיקה של מחזות הזמר מברודווי, המציעה חוויה סוחפת ומרהיבה.
מחזמר סוחף העוקב אחר עלייתה של פאני ברייס, צעירה יהודייה מברוקלין שאינה מתאימה לשום תבנית מקובלת, אך ניחנה בכישרון קומי יוצא דופן ובנחישות חסרת פשרות. כנגד כל הסיכויים היא מצליחה לפרוץ אל מרכז הבמה של ניו־יורק ולהפוך לאחת הכוכבות הגדולות של זמנה. לצד ההצלחה המקצועית מתפתחת מערכת יחסים מורכבת בינה לבין ניק ארנסטיין – גבר מושך ושאפתן, שחי על הקצה ומתקשה להתרחק מעולם ההימורים. הקריירה של פאני ממריאה עם הצטרפותה למופעי זיגפילד היוקרתיים, אך חייה האישיים מתערערים כאשר ניק מסתבך ונאלץ לעזוב את הארץ. הבחירה ללכת אחריו משנה את מסלול חייה, וכששניהם שבים, היא מוצאת את עצמה נקרעת בין הבמה לבין אהבה שמאיימת למוטט הכול. האם יש מקום לאהבה כאשר המחיר כה גבוה?', 'ניצה שאול, יעל עמית, אוריה אלקיים, אדווה סבג , אדם כהן, אוראל גלעד, טל בן שבע, יונתן פרידמן, יעל דובר, מייה אסייג, מתן בר, מיכל פרדקין, עופר גורדון, עדן גולדמן, ענת יעקב, ציון חורי, רותם גלזר, שגיא דיאמנט') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('מיקה שלי', 'מיקה-שלי', 'תיאטרון toMix', 100, 'מיקה שלי הוא מחזמר מרגש על אהבה, פרידה והתפכחות, המלווה בשיריו האייקוניים של יאיר רוזנבלום.', 'סיפור אהבה ישראלי על רקע השנים שעיצבו דור שלם. מיקה נקרעת בין שתי אהבות: גידי, אהבת נעוריה שחוזר מהמלחמה פגוע, וארי, חבר למחזור שמוצא דרך חדשה דרך האמונה. מחזה מוזיקלי מרגש המלווה בשיריו הבלתי נשכחים של יאיר רוזנבלום.', 'משי קלינשטיין, גלעד מרחבי, עדי אלון, גילת אנקורי, אוהד שחר, לירון ויגדור, מיטל נוטיק, אייל בוקובזה, אמיר אהרוני, דורון אורן, גיל זגורי, יובל גרוס, ליאור כהן, מאיה משעניה, מישל עמרם, נועה סבן, עמית בורשטיין , צח כהן') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('נישואים גרעיניים', 'נישואים-גרעיניים-תיאטרון-toMix', 'תיאטרון toMix', 80, 'קומדיה זוגית מצחיקה שמתארת את האתגרים והמצבים המוזרים של חיי הנישואים.', 'קומדיה זוגית פרועה ומצחיקה. מה קורה כשזוג נשוי עם אהבה גדולה ושגרה מטורללת, מגיעים לאודישן לתוכנית ריאליטי חדשה, שתבחן את הנישואים שלהם עד הקצה. במאמץ להתקבל לתכנית השניים מוציאים הכל החוצה - ריבים, פינקסנות, סודות מביכים מהעבר, רגעים מלאי רגש ושאלה אחת שחוזרת: "מי חשב שזה רעיון טוב?!"', 'גיא לואל ושיפי אלוני') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('סימה מכשפה', 'סימה-מכשפה', 'תיאטרון toMix', 80, 'סימה מכשפה היא קומדיה מצחיקה שעושה ניסים, עם עלילה מפתיעה ודמויות בלתי נשכחות.', 'קומדיה מטורפת המבוססת על הסרט של דרור שאול, המציעה חוויות מצחיקות וניסים.
סימה, אלמנה ואם מסורה, מבקשת לשפץ את דירתה הקטנה כדי לשמור את משפחתה קרוב אליה. ברגע של תסכול, כששכן עקשן חוסם את דרכה, סימה מקללת אותו בלהט. אך כשהקללות מתחילות להתגשם האחת אחרי השנייה והשמועה מתפשטת ברחבי העיר, מוצאת את עצמה סימה "מכשפה" במשרה מלאה על מנת שתוכל לממן את שיפוץ הדירה. בתוך כל הרעש והקסם תצטרך סימה, אולי לראשונה בחייה, לבחור בין טובת המשפחה לטובתה שלה.', 'בתפקיד סימה – ענת מגן שבו עומר עציון, דניאל סבג, שרון אלכסנדר, רוית יעקב/יפית אסולין, נוי עזריה ודניאל חסין') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('דרושה עוזרת', 'דרושה-עוזרת', 'תיאטרון toMix', 80, 'דרושה עוזרת היא קומדיה מצחיקה ומלאה הפתעות, המציעה חוויות משעשעות מחיי הזוגיות.', 'קומדיה מטורפת על חייהם של הזוג עמוס ונעמי, המנוהלים על ידי עוזרת עם טוויסט מבריק.', 'ניקי גולדשטיין, אקי אבני, נתי קלוגר, גל פופולר , שיר פופוביץ') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('שעה של שקט', 'שעה-של-שקט', 'תיאטרון toMix', 90, 'קומדיה שנעה במהירות מסחררת בין צחוק להיסטריה, ומוכיחה שכמה שלא ננסה – – שקט, פשוט לא עובד ככה...', 'כל מה שאודי רצה, זו רק שעה אחת של שקט... כורסה. פטיפון. תקליט נדיר שמצא במקרה ברחוב. אבל, ברגע שהוא לוחץ על כפתור ה-PLAY כל העולם לוחץ עליו בחזרה. בתוך שישים דקות, חייו של אודי מתפרקים: צרחות, קידוחים, וידויים, בגידות, בקרים, שיפוצניק מזויף, שכן מטריד, בן שצורח שהוא "מאדר פאקר"; ואישה אחת, שאומרת את כל מה שהתאפקה לומר במשך עשרים וחמש שנה.', 'יניב פולישוק, לירית בלבן/יפית אסולין, יובל סגל, אביעד בנטוב, יעל טל, אופיר וייל/דן קיזלר ורועי רביב') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('שקרים קטנים', 'שקרים-קטנים', 'תיאטרון toMix', 90, 'קומדיה משפחתית מופרעת שבה ערב רגוע מתמלא בגילויים מפתיעים, סודות ובגידות, המאתגרים את מושגי האהבה והנישואים.', 'מה הייתם עושים בשביל אהבה? ערב משפחתי רגוע מתפתח לגילויים מפתיעים של סודות, בגידות ושקרים קטנים, המובילים לקומדיה משפחתית חמה ומרגשת על אהבה ויחסים.', 'אורי גוטליב, מיה דגן, שלומי טפיארו, אלי סטין') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אהבה-מודרנית' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אהבה-מודרנית' AND g.name = 'ישראלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אנני' AND g.name = 'מחזמר' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אנני' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מצחיקונת-–-Funny-Girl' AND g.name = 'מחזמר' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מצחיקונת-–-Funny-Girl' AND g.name = 'קלאסיקה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מיקה-שלי' AND g.name = 'מחזמר' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מיקה-שלי' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'נישואים-גרעיניים-תיאטרון-toMix' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'סימה-מכשפה' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'דרושה-עוזרת' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'שעה-של-שקט' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'שקרים-קטנים' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'שקרים-קטנים' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
