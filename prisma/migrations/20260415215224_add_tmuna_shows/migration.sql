-- Migration: Add new tmuna shows
-- Generated on 2026-04-15T21:52:24.230Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('דרמה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('דרמה קומית') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('ישראלי') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מרגש') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קלאסיקה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('רומנטי') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('אנטיגונה', 'אנטיגונה', 'אנסמבל תמונע', 120, 'אנטיגונה 2023 היא גרסה עכשווית לטרגדיה הקלאסית, המשלבת בין מציאות קשה לבין חוויות אישיות של אישה ישראלית במאבק מול שלטון אכזר.', 'אנטיגונה 2023 מתרחשת על רקע מלחמה ומגפה, סוחבת טרגדיה משפחתית עם שני אחים שרצחו זה את זה. היא חושפת את העירום המוחלט של השלטון, את הכיעור והבורות שבו, ומביאה את הסיפור של אנטיגונה העכשווית, אישה ישראלית המתמודדת עם מציאות בלתי אפשרית.', NULL) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('דירה לא להשכיר', 'דירה-לא-להשכיר', 'הפקות עצמאיות', 60, 'דירה לא להשכיר מציגה את סיפורם של פליטים המעלים הצגה כדרך להתמודד עם עברם הכואב, תוך חיפוש אחר תקווה ונחמה.', 'ארבעה פליטים ששרדו מלחמה קשה מעלים הצגה בתוך חלל של מבנה נטוש, במטרה למצוא נחמה ומפלט מהחוויה הקשה שעברו.', 'ערן בוהם, אלון לשם, ניבה אלוש, שירה פרבר') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('השתקפויות', 'השתקפויות', 'הפקות עצמאיות', 70, 'השתקפויות הוא מחזה חכם ומשעשע, המשלב בין תיאטרון לחיים ומציג את הקונפליקטים הפנימיים של יוצר תיאטרון דרך סיפור זוגי מורכב.', 'המחזה עוסק בזוג במשבר נישואין, דניאל וקרין, ובפערים הערכיים ביניהם. הוא מתבונן על תהליך הבימוי והקונפליקטים בין במאי לשחקנים, חושף את העולם הנסתר של חדר החזרות, ומעלה שאלות על אהבה, נאמנות והגשמה עצמית.', 'אייל שכטר, תומר גלרון, יולי מובצ''ן ודליה שימקו') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('מהפכניות', 'מהפכניות', 'הפקות עצמאיות', 80, 'מהפכניות מציעה מבט חדש על ההיסטוריה, תוך שהיא מעניקה מקום מרכזי לנשים שהיו חלק בלתי נפרד מהמהפכות, אך נשכחו מההיסטוריה.', 'המחזה חוקר את תפקידן של נשים מאחורי גברים מצליחים בהיסטוריה, ומבקש להעניק להן את ההכרה הראויה. הוא מתאר את חייהן של נשים כמו ג''ני מרקס וכסנתיפה אשת סוקרטס, ומציג את תרומתן למהפכות החשובות.', 'אסתי זקהיים, אלחי לויט, שירה קוריאל / מאיה הר-ציון, דליה שימקו, אייל שכטר, שלום שמואלוב') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אנטיגונה' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אנטיגונה' AND g.name = 'קלאסיקה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אנטיגונה' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'דירה-לא-להשכיר' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'דירה-לא-להשכיר' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'השתקפויות' AND g.name = 'דרמה קומית' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'השתקפויות' AND g.name = 'רומנטי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מהפכניות' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מהפכניות' AND g.name = 'ישראלי' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
