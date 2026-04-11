-- Migration: Add new hasimta shows
-- Generated on 2026-04-11T09:31:03.346Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('דרמה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מרגש') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קומדיה') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('חפץ לב', 'חפץ-לב', 'תיאטרון הסימטה', 80, 'דרמה עוצמתית על מאבק פנימי של צעיר דתי המנסה להתמודד עם נטיותיו המיניות, תוך כדי פגישות עם כומר שמטרתן להמיר את זהותו.', 'המחזה מתרחש במקום השייך לכנסייה בבריטניה, ומתאר סדרת פגישות של סטודנט צעיר בשם ג''וד עם כומר. מטרת הפגישות היא המרת נטיותיו המיניות של ג''וד, אשר נתפס על ידי אביו בעודו צופה בחומר פורנוגרפי. ג''וד, בחור דתי, עושה הכול כדי לרצות את אביו ולהיות ''אהוב'' על ידי האלוהים. בעודו נמצא ב''טיפול'', הוא מדמיין את מדריכו מהצופים ג''ושוע, שבו הוא מאוהב, וחולם לחיות עם אהובו בזוגיות ולגדל ילד במשותף.', 'אלון קטן, אמיתי קדר/ ג''וש שגיא, אסף פינקלשטיין') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('נקודת האל-חזור', 'נקודת-האל-חזור', 'תיאטרון הסימטה', 90, 'דרמה מרגשת המתרחשת בכלא, שבה עובדים סוציאליים ואסירים מתמודדים עם ההשלכות של אלימות במשפחה ותקוות לשינוי.', 'רווית היא עובדת סוציאלית מסורה בכלא, באגף השיקום לאלימות במשפחה. בני וגדעון, האסירים אותם היא מלווה, נאסרו באשמת אלימות כלפי נשותיהם וחולמים לחזור לחייהם הקודמים. ההצגה עוקבת אחרי יום אחד בחיי השלושה, שלאחריו הכל הולך להשתנות.', 'נופר חיון, יעל פינקלשטיין, נועם צפתי, בהט קלצ׳י') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('רק בשמחות', 'רק-בשמחות', 'תיאטרון הסימטה', 80, 'קומדיה מצחיקה על ערב חתונה שבו סודות משפחתיים ופערים תרבותיים מתנגשים, מה שמוביל לרגעים בלתי נשכחים.', 'קומדיה פרועה שמציצה מאחורי הקלעים של חופה, ערב שיכול להתפוצץ ברגע בגלל סודות משפחתיים, פערים בין מסורת לחיים עכשוויים ורצון לעצמאות. ההצגה עוסקת ברגעים טעונים, מצחיקים ומביכים שיכולים לקרות – רק בשמחות.', 'ספיר הרטמן, משי ריין, גיא זיידמן, רון רפפורט, ג''וש שגיא, שלום כורם, מיקי מרמור, יעל יהב, איילת קורץ יוסף') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'חפץ-לב' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'חפץ-לב' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'נקודת-האל-חזור' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'נקודת-האל-חזור' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'רק-בשמחות' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
