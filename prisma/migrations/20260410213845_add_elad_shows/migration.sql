-- Migration: Add new elad shows
-- Generated on 2026-04-10T21:38:45.934Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('דרמה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('דרמה קומית') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מוזיקלי') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מותחן') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מרגש') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('פנטזיה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קומדיה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קלאסיקה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('רומנטי') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('לא קל להיות מאושר כשהחיים קצת חרא', 'לא-קל-להיות-מאושר-כשהחיים-קצת-חרא', 'תיאטרון אלעד', 90, 'קומדיה מרה ומצחיקה על חיפוש האושר בעידן של פחד ובדידות, המציעה מבט הומוריסטי על קשיי החיים המודרניים.', 'קומדיה המלווה חמישה חברים שחייהם נמצאים בחוסר סדר. המחזה בוחן את חרדותיהם ומערכות היחסים המתפוררות שלהם, תוך כדי חיפוש נואש אחר אושר דרך מצבים קומיים ונוגעים ללב.', NULL) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('חדר 201', 'חדר-201', 'תיאטרון אלעד', 90, 'מותחן אינטנסיבי על מפגש של חברים ותיקים המוביל לחשיפת סודות ושקרים, תוך כדי חקירה של זיכרון ויחסים.', 'מותחן פסיכולוגי המתרחש במוטל בעיר, בו שלושה חברים ותיקים נפגשים לאחר עשר שנות נתק. עניין לא פתור מהעבר עומד במרכז, והמחזה בוחן את טבע הזיכרון והחברות.', NULL) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('IT MUST BE LOVE', 'IT-MUST-BE-LOVE', 'תיאטרון אלעד', 60, 'חוויה תיאטרלית ייחודית בבר יין, בה מתעוררות סצנות זוגיות המציעות חיבור עמוק בין הקהל לשחקנים.', 'הצגה המתרחשת בבר יין, בה מתעוררות סצנות זוגיות המציעות חוויה תיאטרלית בלתי אמצעית. הקהל מתוודע לעולמות של אהבה, פרידה ופגיעות, בליווי מוסיקה חיה.', NULL) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('קו החוף', 'קו-החוף', 'תיאטרון אלעד', 90, 'מסע תיאטרלי מרהיב המשלב חקירה של זהות משפחתית עם חוויות חיים עמוקות, במרחב תיאטרלי פנטסטי.', 'הצגת בכורה של המחזאי וואג''די מועווד, העוקבת אחרי וילפריד במסע עם גופת אביו אל מולדתו. המחזה עוסק במסע התבגרות פיזי ונפשי, תוך חקירת הקשרים המשפחתיים והזהות.', NULL) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('השיר המטורף של הארץ', 'השיר-המטורף-של-הארץ', 'תיאטרון אלעד', 90, 'מופע מוזיקלי-תיאטרלי המציע חוויה רגשית על אובדן ובית, בשילוב שירים שנוגעים בלב ובנשמה.', 'מופע מוזיקלי-תיאטרלי העוסק בשברון לב ובאבסורד של החיים בצל מלחמה. השירים והטקסטים מציעים מבט על המצב האנושי, על בית ואובדן, ומזמינים את הקהל להתחבר לרגשות עמוקים.', NULL) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('הזקן והים', 'הזקן-והים', 'תיאטרון אלעד', 80, 'ההצגה מציעה חוויה תיאטרונית מרגשת על מאבק אנושי מול הטבע, בהשראת הסיפור הקלאסי של היינריך מנקין.', 'ההצגה עוסקת במאבק של דייג זקן מול הים, במאבק על כבודו ועל קיומו, תוך חקירה של נושאים כמו עמידות, תעוזה והתמדה.', NULL) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('אנפרנד', 'אנפרנד', 'תיאטרון אלעד', 90, 'ההצגה עוסקת בבדידות בעידן הדיגיטלי, כשהיא מביאה את קולות הרשתות החברתיות לבמה בצורה מרגשת ומעוררת מחשבה.', 'אנפרנד היא הצגת תיאטרון דוקומנטרי שכל הטקסט שלה לקוח אך ורק מפוסטים בפייסבוק ותגובות אליהם. ההצגה בודקת את הפער בין חופש הביטוי שלנו ברשת לבין המפגש האנושי, ובין הקהילתיות הווירטואלית לבדידות הגוברת במציאות.', NULL) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('פלייבק', 'פלייבק', 'תיאטרון אלעד', 90, 'חוויה תיאטרלית ייחודית שבה סיפורים מהקהל מתעוררים לחיים, מצחיקים ומרגשים, באלמנט של אלתור מוחלט.', 'מופע אימפרוביזציה חווייתי שכולו מבוסס על סיפורים מהקהל, המומחזים במקום על ידי שחקני התיאטרון בליווי מוסיקה חיה. הסיפור המומחז מתעורר לחיים דרך הצגה מרגשת, מצחיקה ומעוררת מחשבה.', NULL) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('רומיאו ויוליה הצגה, יין ואוכל בנשף איטלקי', 'רומיאו-ויוליה-הצגה,-יין-ואוכל-בנשף-איטלקי', 'תיאטרון אלעד', 90, 'חוויה תיאטרלית קולינרית המשלבת את הסיפור הקלאסי של רומיאו ויוליה עם טעמים ואווירה איטלקית.', 'ההצגה מתבצעת בסגנון של נשף איטלקי, עם מוזיקה מקורית, עיצוב ואווירה ייחודית המשלבת אוכל ויין.', NULL) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('ירמה לאור ירח', 'ירמה-לאור-ירח', 'תיאטרון אלעד', 90, 'ההצגה מציעה חוויה תיאטרלית קסומה בלילה במדבר, עם נגיעות של שירה ותיאטרון.', 'מסע תיאטרלי לילי במדבר, בהשראת יצירתו של פדריקו גארסיה לורקה, חוקר את הנושאים של אהבה, אובדן ותשוקה.', NULL) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('DANCING EILAT', 'DANCING-EILAT', 'תיאטרון אלעד', 90, 'מסיבת אוזניות תיאטרלית שמביאה את האנרגיה של אילת לחיים, עם ריקודים, צחוק וחוויות בלתי נשכחות.', 'סיור תיאטרלי-מוסיקלי שהוא מסיבת אוזניות ניידת, המשלבת ריקודים, פלאשמוב ואימפרוביזציה עם העוברים והשבים בטיילת אילת.', NULL) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('IMPRO NIGHT', 'IMPRO-NIGHT', 'תיאטרון אלעד', 90, 'ערב אימפרוביזציה קומי עם דביר בנדק, שבו כל רגע הוא הפתעה וצחוק בלתי פוסק.', 'ערב אימפרוביזציה קומי בלתי צפוי עם דביר בנדק ושחקני התיאטרון, שכולו אילתור, משחקי תיאטרון ומערכונים. חוויה מצחיקה ומפתיעה שתשאיר אתכם עם חיוך.', NULL) ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'לא-קל-להיות-מאושר-כשהחיים-קצת-חרא' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'לא-קל-להיות-מאושר-כשהחיים-קצת-חרא' AND g.name = 'דרמה קומית' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'חדר-201' AND g.name = 'מותחן' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'חדר-201' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'IT-MUST-BE-LOVE' AND g.name = 'רומנטי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'IT-MUST-BE-LOVE' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'קו-החוף' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'קו-החוף' AND g.name = 'פנטזיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'השיר-המטורף-של-הארץ' AND g.name = 'מוזיקלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'השיר-המטורף-של-הארץ' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הזקן-והים' AND g.name = 'קלאסיקה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הזקן-והים' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אנפרנד' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אנפרנד' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'פלייבק' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'פלייבק' AND g.name = 'דרמה קומית' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'רומיאו-ויוליה-הצגה,-יין-ואוכל-בנשף-איטלקי' AND g.name = 'קלאסיקה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'רומיאו-ויוליה-הצגה,-יין-ואוכל-בנשף-איטלקי' AND g.name = 'רומנטי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'ירמה-לאור-ירח' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'ירמה-לאור-ירח' AND g.name = 'פנטזיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'DANCING-EILAT' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'DANCING-EILAT' AND g.name = 'מוזיקלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'IMPRO-NIGHT' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'IMPRO-NIGHT' AND g.name = 'דרמה קומית' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
