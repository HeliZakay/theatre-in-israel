-- Migration: Add new all_theatres shows
-- Generated on 2026-04-07T07:33:15.963Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('דרמה קומית') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('ילדים') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מוזיקלי') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מחזמר') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מרגש') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קומדיה') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('אחינועם ואני', 'אחינועם-ואני-תיאטרון-האינקובטור', 'תיאטרון האינקובטור', 70, 'קומדיה פרועה על מערכת יחסים זוגית שמתערערת בעקבות משחק חדש, המשלבת הומור אינטליגנטי עם מסר עמוק על התבגרות ואהבה.', 'אחינועם ותמיר חיים בגן עדן של משחקים, נהנים ממערכת יחסים זוגית עד שמופיע משחק חדש שמערער את הקשר שלהם. ההצגה עוסקת בקשיים של התבגרות ובחיפוש אחר אהבה אמיתית.', 'אילון פרבר, יאלי ויס') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('איפה הילד', 'איפה-הילד', 'תיאטרון האינקובטור', 70, 'יצירה בימתית מוסיקלית חצופה על הקשיים וההחלטות שבין חופש להורות במדינת מלחמה, המשלבת הומור עם רגעים נוגעים ללב.', 'ההצגה עוסקת בשאלת ההורות בעידן המלחמה, מציגה את הדילמות וההחלטות הקשות של אישה צעירה על האם להביא ילד לעולם, דרך סיפור לא ליניארי ומלא הומור.', 'נעמה רדלר, אתי וקנין סובר, אילון פרבר ויעל טל') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('חיה להפליא', 'חיה-להפליא', 'תיאטרון האינקובטור', 50, 'מסע מוזיקלי קומי־דרמטי על הקשר הנצחי בין אם לבת, המשלב הומור וכאב, ומציג את ההתמודדות עם פרידה ואובדן.', 'ההצגה מתארת את מערכת היחסים בין אם לבת רגע לפני הפרידה, עם זיכרונות ושיחות מצחיקות וכואבות, ומביאה את הקהל למסע אישי על אהבה, חיים ומוות.', 'אילה דנגור') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('מקום טוב הכל רע', 'מקום-טוב-הכל-רע', 'תיאטרון האינקובטור', 60, 'מופע אוטוביוגרפי פנטסטי על משפחה שחיה בעולם עם חוקים אחרים, המשלב הומור ודרמה תוך כדי חקירת הקשרים המורכבים בין אובדן לאהבה.', 'ההצגה עוסקת במשפחה עם אבא שהוא ילד ושתי אחיות, חושפת את חוויות החיים המורכבות והאבסורדיות שלהם, ושואלת שאלות על אובדן, שיגעון ואהבה.', 'ענת דרימר, נורית דרימר, אמיר מיוחס') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('שובו של הקרקס', 'שובו-של-הקרקס', 'תיאטרון האינקובטור', 60, 'הצגת קרקס מינימליסטית ומלאת הומור, המשלבת ליצנות ואקרובטיקה, חוגגת את הכוח של עבודת צוות ויצירתיות מול אתגרים.', 'שלישיית ליצנים מנסה ליצור מופע קרקס מחדש ביום אחד, מתמודדים עם מכשולים טכניים ודרישות בלתי אפשריות, ומגלים את הכוח של שיתוף פעולה.', NULL) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('Be More Chill', 'Be-More-Chill', 'תיאטרון האינקובטור', 150, 'סיפור אנרגטי על נער שמקבל מחשב זעיר שיביא לו פופולריות, אך מגלה שהמחיר עלול להיות גבוה מדי.', 'המחזמר עוסק ברצון להשתלב ובחרדה חברתית, ומספר על ג''רמי, נער רגיל שבולע מחשב זעיר שמבטיח להפוך אותו למקובל. כשהתוכנה מתחילה לנהל את חייו, הוא מתמודד עם תוצאות ההחלטה.', 'Ben Caspi, Dalia Herszaft, Daniel Lewin, Danny Freedman, Ella Schulman, Ezzy Scheinert, Idan Marcus, Iddo Schejter, Izzy Salant, Milana Gerrish, Neta Arbel, Ori Lewin, Ori Peretz, Rimon Nisan, Shelly Solomon, Zohar (Pearl) Almoznino') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אחינועם-ואני-תיאטרון-האינקובטור' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אחינועם-ואני-תיאטרון-האינקובטור' AND g.name = 'דרמה קומית' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'איפה-הילד' AND g.name = 'מוזיקלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'איפה-הילד' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'חיה-להפליא' AND g.name = 'מוזיקלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'חיה-להפליא' AND g.name = 'דרמה קומית' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מקום-טוב-הכל-רע' AND g.name = 'דרמה קומית' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מקום-טוב-הכל-רע' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'שובו-של-הקרקס' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'שובו-של-הקרקס' AND g.name = 'ילדים' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'Be-More-Chill' AND g.name = 'מחזמר' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'Be-More-Chill' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
