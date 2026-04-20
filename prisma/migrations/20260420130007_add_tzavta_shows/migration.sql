-- Migration: Add new tzavta shows
-- Generated on 2026-04-20T13:00:07.890Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('דרמה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('דרמה קומית') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('ילדים') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מוזיקלי') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מחזמר') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מרגש') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('סאטירה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קומדיה') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('אורות קטנות', 'אורות-קטנות', 'הפקות עצמאיות', 60, 'מחזמר הומוריסטי על המאבק בין האור לחושך בנפש, המעלה שאלות על החיים בתקופה מאתגרת.', 'על המלחמה בין האור והחושך בנפשנו, ועל הצורך שלהם אחד בשני על מנת להתקיים. המחזמר מעלה שאלות הרלוונטיות לכולנו בתקופה המאתגרת בה אנו חיים ומנגיש אותן בצורה היתולית והומוריסטית.', 'טלי אוסדצ''י (אור), מיכל ויינברג (ספק), שני צברי (חושך), אליסה וייסבורד (רצון)') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('איפה גוגו?', 'איפה-גוגו', 'הפקות עצמאיות', 40, 'קומדיה ליצנית כמעט ללא מילים, על חיפוש אחר גוגו המיוחד, המייצג תקווה פנימית.', 'משום מקום היא מגיעה, עם מזוודה קטנה ביד ושאלה גדולה בלב: איפה גוגו? קומדיה ליצנית, וירטואוזית וסוחפת, כמעט ללא מילים, על חיפוש, תקווה ומציאת הגוגו המיוחד, הטמון בך.', NULL) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('אמא שלי קראה לי רוטוויילר', 'אמא-שלי-קראה-לי-רוטוויילר', 'הפקות עצמאיות', 60, 'מופע יחיד מרגש על חיפוש זהות, המשלב כאב והומור במסע אישי בין תרבויות.', 'מופע אישי, חד, כואב ומצחיק שבו מיה שואלת את השאלה ''מה אני יותר, פודל - או רוטוויילר?'' במסע חוצה ז''אנרים בין מקומות שונים, היא מחפשת מרחב מוגן לדבר על הכל, בשילוב של כאב והומור.', NULL) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('אני מכיר רק אחד שמתנהג ככה', 'אני-מכיר-רק-אחד-שמתנהג-ככה', 'הפקות עצמאיות', 50, 'מופע פרפורמטיבי על זעם משפחתי והמאבק לשבור את המעגל ההרסני, דרך וידויים מרגשים.', 'היצירה היא מופע פרפורמטיבי המורכב משבעה עשר מונולוגים העוסקים בזעם והעברה הבין-דורית שלו בין שלושה גברים במשפחה. המופע כולל וידויים על אלימות, בקשת סליחה ורצון להשתחרר מהזעם המועבר מדור לדור.', NULL) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('אקורד סיום - למלחמה', 'אקורד-סיום-למלחמה', 'הפקות עצמאיות', 60, 'דרמה מוזיקלית על כוח השירה לשנות מציאות, בממלכת מהגרייה האפלה.', 'נאפיסה ואבו חסן חיים בממלכת מהגרייה, שם נאפיסה חולמת את השיר לשולטן ומזמרת אותו בבוקר. במהלך ההצגה הם מנסים להשתמש בכוח השירה כדי לשנות את הממלכה ולבטל את שלטון הדיכוי.', NULL) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('התחנה האחרונה', 'התחנה-האחרונה', 'הפקות עצמאיות', 60, 'דרמה מצחיקה ומעוררת מחשבה על משמעות החיים, המתרחשת בתחנת רכבת בין חיים למוות.', 'בתחנת רכבת מסתורית, נפגשים טירון צעיר וחייל ותיק, שניהם נושאים מטענים מהעבר וממתינים לרכבת שתיקח אותם אל ''התחנה האחרונה''. במהלך ההמתנה הם מתמודדים עם זיכרונותיהם ומבינים מה באמת חשוב בחיים.', 'סלי עדן בר, יותם רוטשטיין, עידו שטרסבורג / גיא נטאף') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('זה בסדר.?', 'זה-בסדר.', 'הפקות עצמאיות', 50, 'ההצגה בוחנת את הקשר בין זהות למקום, דרך סיפוריהם האישיים של צעירים המתמודדים עם שאלות קיומיות בעידן המודרני.', 'שישה פרפורמרים צעירים בוחנים את אחת השאלות הבוערות של דורם: האם להישאר בארץ או לעזוב? דרך סיפוריהם האישיים, הם נוברים בפצעיהם מאותה שבת, מתמודדים עם שכול, פוסט טראומה וזוגיות.', 'נגה בן נר, רועי דרור, רון חכמון, יונתן סבוראי, שחר סיטון, לילי פרלמן') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('טובעים השניים', 'טובעים-השניים', 'הפקות עצמאיות', 60, 'ההצגה עוסקת באתגרים במציאת פרטנר לחיים, דרך סיפוריהם של ארבעה דמויות שנלחמות בסודות ובקשרים המורכבים ביניהם.', 'ספיר ופלג, זוג מושלם, טובעים בסודותיהם, בעוד אלינור ונועם, אחים שהפכו לאויבים, מתמודדים עם משבר משפחתי. הסיפורים משתלבים לפאזל צבעוני ואינטימי שמוצג מול הקהל.', 'רוי אברמוביץ׳, אביה סדי, גיא ויטנר, רוני שלו') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('ככה יצאתי', 'ככה-יצאתי', 'הפקות עצמאיות', 50, 'ההצגה מציעה מסע מרגש אל תוך עולם היציאה מהחברה החרדית, דרך חוויות אמיתיות של אנשים שמחפשים את עצמם.', 'שני שחקנים יוצאי החברה החרדית מביאים לבמה סיפורים אמיתיים של אנשים שעזבו את העולם החרדי. הם מחליפים דמויות ומבצעים מסע בין העולמות, תוך שיתוף בסיפורם האישי.', 'אבי אופיר וטס מאיר') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('עצבים', 'עצבים', 'הפקות עצמאיות', 60, 'ההצגה מציעה זווית חדשה על זוגיות ועצבנות, דרך סיפור חייה של מאיה והשפעתה על ערך עצמי.', 'מאיה ודוד מתאהבים בבית קפה, אך מתגלה בעיה קטנה. ההצגה עוסקת בעצבנות יתר ובמחירים שהיא גובה בזוגיות, באמצעות סיפור חיי מאיה בכנות ובסגנון סטוריטלינג.', NULL) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('פאק בסיסטם', 'פאק-בסיסטם', 'הפקות עצמאיות', 60, 'ההצגה מציעה חוויה ויזואלית אבסורדית, המאתגרת את תפיסתנו לגבי מושלמות והדפקטים שבחיים.', 'גיא יוצא למסע בעקבות הדפקט, כאשר הוא מלווה בארבעה פרפורמרים שמייצגים את מחשבותיו. ההצגה היא מניפסט אבסורדי שמנסה לפתור בעיות תוך שמירה על שלמותן.', 'אביגיל אדרי, קובי ירחי, הילה קרני, אלעד עובדיה') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אורות-קטנות' AND g.name = 'מחזמר' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אורות-קטנות' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'איפה-גוגו' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'איפה-גוגו' AND g.name = 'ילדים' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אמא-שלי-קראה-לי-רוטוויילר' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אמא-שלי-קראה-לי-רוטוויילר' AND g.name = 'דרמה קומית' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אני-מכיר-רק-אחד-שמתנהג-ככה' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אני-מכיר-רק-אחד-שמתנהג-ככה' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אקורד-סיום-למלחמה' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אקורד-סיום-למלחמה' AND g.name = 'מוזיקלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'התחנה-האחרונה' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'התחנה-האחרונה' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'זה-בסדר.' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'זה-בסדר.' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'טובעים-השניים' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'טובעים-השניים' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'ככה-יצאתי' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'ככה-יצאתי' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'עצבים' AND g.name = 'דרמה קומית' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'עצבים' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'פאק-בסיסטם' AND g.name = 'סאטירה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'פאק-בסיסטם' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
