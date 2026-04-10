-- Migration: Add new all_theatres shows
-- Generated on 2026-04-10T12:09:41.334Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('דרמה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('דרמה קומית') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('ישראלי') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מוזיקלי') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מרגש') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קומדיה') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('בוקר טוב מר היימר', 'בוקר-טוב-מר-היימר', 'קבוצת התיאטרון הירושלמי', 60, 'דרמה מרגשת על אהבת אמת שמסרבת להיכנע, המגוללת את סיפורם של זוג המתמודד עם אלצהיימר.', 'מר אלץ-היימר בא לבקר במפתיע אצל חנה, לאחר 60 שנות זוגיות. החגים המשפחתיים הפכו לזיכרון מעורפל, אך אמנון לא מוותר על אהבתם ועל אופטימיות עקשנית.', 'צהלה מיכאלי, אייל שכטר, רפי קלמר') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('וינה או דימונה', 'וינה-או-דימונה', 'קבוצת התיאטרון הירושלמי', 90, 'קומדיה ישראלית משוגעת על אהבה, גיור והתמודדויות עם נציגי אלוהים עלי אדמות.', 'כריסטינה, סטודנטית מאוסטריה, נלהבת לקראת הגיור שלה, בזמן שבן זוגה גיא רוקם תכניות אחרות. הרבנית בוטבול וחנניה, בנה, מתפרצים לדרמה הזוגית.', 'יניב פרץ, סער שני, שירה נתן, רונית אברהמוף-שפירא') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('טייק אחרון', 'טייק-אחרון', 'קבוצת התיאטרון הירושלמי', 50, 'דרמה קומית על קריירה, הורות ורגעי הזוהר מאחורי הקלעים, המאתגרת את השחקנית למצוא את עצמה.', 'כאשר מאיה מן, שחקנית אנונימית בשנות ה-30 לחייה, מקבלת את ההזדמנות לה חיכתה, היא יודעת שסוף סוף היא ''עשתה את זה''. עוד רגע והיא נוגעת באושר, בהגשמה.

אבל לגוף שלה תוכניות משלו, כאלה שיאלצו אותה לחשוב על הכל מחדש ולהתמודד עם זכרונות מן העבר, דמויות שהרחיקה מחייה ושאלות גורליות על החיים שהיא רוצה לחיות. איזו דמות היא באמת נועדה לשחק?', 'לילך כנען') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('כוונות טובות', 'כוונות-טובות', 'קבוצת התיאטרון הירושלמי', 80, 'דרמה מרגשת המעלה שאלות על חופש הבחירה והאמת הפנימית של הדמויות.', 'שתי בנות, שלוש משפחות ואלוהים אחד מנסים לגלות את האמת מאחורי העיקרון היהודי ''חופש הבחירה''.', 'אלי ריינמן, חן יפרח, עדינה דוד, נועה לפידות, רמי בן גור, הילה קסטלר') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('כשנולד ילד מיוחד', 'כשנולד-ילד-מיוחד', 'קבוצת התיאטרון הירושלמי', 80, 'הצגה מרגשת המעניקה קול למשפחות המתמודדות עם אתגרים ייחודיים ורגשות עמוקים.', 'סיפורים קצרים מהחיים הפותחים צוהר לעולמן של משפחות לילדים עם צרכים מיוחדים, מציגים רגעים, חלומות, כאב ושמחה.', 'עופר שלחין, עדינה דוד, חן יפרח') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('מלח הארץ', 'מלח-הארץ', 'קבוצת התיאטרון הירושלמי', 60, 'סיפור נוגע ללב על תקומת ישראל והמאבק של ניצולי השואה להיחשף ולזכות להכרה.', 'מונודרמה עוצמתית, סיפור אישי של אברם, מאבטח במוזיאון לאמנות מודרנית, שחושף את סיפור חייו כניצול שואה ואת סיפורם של האנשים השקופים.', 'ערן בוהם') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('מניה - אגדה בחייה', 'מניה-אגדה-בחייה', 'קבוצת התיאטרון הירושלמי', 110, 'דרמה מרגשת על חייה של מניה שוחט, פועלת וחלוצה, המשלבת זיכרונות ותיעוד היסטורי בעיצוב אמנותי מרהיב.', 'סיפור חייה של מניה שוחט, אשת העלייה השנייה, שזור בסיפור היישוב ובתקומת המדינה. דרך שברי זיכרונות, קטעי וידאו ותצלומי ארכיון, עולה דמותה רבת הפנים, אגדה בחייה ובמותה.', 'צהלה מיכאלי - מניה | סער שני - ישראל, גדע, שוטר | רן כהן - אבא, זובאטוב, יגאל, מלשין, חנקין | ענבל מילוא-בכר - רחל, חייקא, קיילה') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('צ''כוב: קומדיה מוזיקלית', 'צ׳כוב-קומדיה-מוזיקלית', 'קבוצת התיאטרון הירושלמי', 60, 'קומדיה מוזיקלית פרועה המבוססת על יצירותיו של אנטון צ''כוב, המשלבת הומור, רגש ומאבקים חברתיים.', 'גנרל בדימוס מגיע לפרובינציה רחוקה לגבות חוב מאלמנה יפה, ומנהל מוסד עני מחזר אחר נציג ציבור. וויכוח מטורף פורץ ביניהם, המסתיר משיכה עזה ועל פערי מעמדות ומאבק בין המינים.', 'יצחק לאור, רונית אברהמוף שפירא, יונתן ברנר') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('רגע רגע', 'רגע-רגע', 'קבוצת התיאטרון הירושלמי', 70, 'חגיגה מוזיקלית לשיריו של סשה ארגוב, המציעה סיפור התבגרות מרגש של חבורה צעירה בארץ ישראל.', 'ערב תיאטרלי – מוזיקלי המורכב משיריו של סשה ארגוב, המגולל סיפור התבגרות של חבורה צעירה בארץ ישראל. החבורה חווה אהבות ופרידות במדינה המתפתחת.', 'ענבל מילוא-בכר/יהב מרום, רימון כרמי/ירדן רז, צח כהן, סער שני, עדי דרורי') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('שלוש מלכות ופילגש - נשים בתנ''''ך', 'שלוש-מלכות-ופילגש-נשים-בתנ׳׳ך', 'קבוצת התיאטרון הירושלמי', 90, 'יצירה בימתית המפגישה בין נשים מקראיות לבין נושאים עכשוויים, חושפת את כוחן והשפעתן על ההיסטוריה.', 'דרך טקסטים עתיקים ועכשוויים, שירה ומוסיקה, מתגלה כוחן של ארבע נשים הקשורות בדוד המלך: מיכל, אביגיל, בת שבע ורצפה.', 'צהלה מיכאלי, תהלה ישעיהו אדגה, אלונה הבר, דנה קוצ''רובסקי ונגנים') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'בוקר-טוב-מר-היימר' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'בוקר-טוב-מר-היימר' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'וינה-או-דימונה' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'וינה-או-דימונה' AND g.name = 'ישראלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'טייק-אחרון' AND g.name = 'דרמה קומית' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'כוונות-טובות' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'כוונות-טובות' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'כשנולד-ילד-מיוחד' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מלח-הארץ' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מלח-הארץ' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מניה-אגדה-בחייה' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מניה-אגדה-בחייה' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'צ׳כוב-קומדיה-מוזיקלית' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'צ׳כוב-קומדיה-מוזיקלית' AND g.name = 'מוזיקלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'רגע-רגע' AND g.name = 'מוזיקלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'רגע-רגע' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'שלוש-מלכות-ופילגש-נשים-בתנ׳׳ך' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'שלוש-מלכות-ופילגש-נשים-בתנ׳׳ך' AND g.name = 'ישראלי' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
