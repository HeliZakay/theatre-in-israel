-- Migration: Add new hanut31 shows
-- Generated on 2026-04-11T11:47:21.081Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('דרמה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('דרמה קומית') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מרגש') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('סאטירה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('פנטזיה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קומדיה') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('Boxed', 'Boxed', 'תיאטרון החנות', 80, 'Boxed היא הצגה מינימליסטית ללא מילים, המאתגרת את הקהל לפתוח קופסה מסתורית ולחקור את הדמיון והמציאות.', 'מה מתחבא בתוך קופסה? האם זה אני? האם זה אמיתי? הגיע הזמן לפתוח אותה! הצגה מינימליסטית, ללא מילים, עם הרבה דמיון וקופסה.', NULL) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('Machine Man', 'Machine-Man', 'תיאטרון החנות', 80, 'Machine Man הוא מופע וודביל אינטראקטיבי, שבו קהל מתנדב מפעיל מכונות שמביאות לשאלות קיומיות על חיי האדם.', 'תשע מכונות השאלות שואלות על מהות הרוח האנושית ועל האלוהות על פני האדמה. מופע וודביל, בו ממציאן מכונות אלמוני, מנסה להבין את העולם דרך המכונות שהוא בונה.', NULL) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('בית לשלושה', 'בית-לשלושה', 'תיאטרון החנות', 80, 'בית לשלושה מזמין את הקהל לסיור במוזיאון אוטומטות ייחודי, בו נחשפים לסיפור חיים מלא יצירה, ארוטיקה ואובדן.', 'ההצגה מציעה ביקור במוזיאון האוטומטות של מאדאם לוין, הכולל אוסף מכונות משוכללות המספרות את סיפורה הסנסציוני של אישה עם מיניות שוברת מוסכמות.', 'נדיה קוצ''ר, עמית גור, פיתוח מחזה: רוני ברודצקי (כחלק מקבוצת מילאטיס)') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('MuZeum', 'MuZeum', 'תיאטרון החנות', 80, 'MuZeum מציע סיור יוצא דופן במוזיאון המוקדש לאפוקליפסת זומבים, שבו מתארים את המאבק לשיקום הזומבים בחברה הישראלית.', 'המוזיאון מציג את סיפור ההתפרצות וההתפשטות של מגיפת הזומבים, מתאר את גבורת השורדים ומנציח את סיפורם, תוך שימוש בשיטות מדעיות מתקדמות לשיקום זומבים.', NULL) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('Radio Play', 'Radio-Play', 'תיאטרון החנות', 60, 'Radio Play מציע עיבוד בימתי חתרני לסיפורו של הסוכן החשאי פטריק קים, עם חוויות קומיות ומרגשות בשילוב חפצים וסאונד.', 'סיפורו האלמותי של הסוכן החשאי פטריק קים בעיבוד בימתי חתרני ומשעשע עם חפצים, שחקנים, סאונד ומה שביניהם.', NULL) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('THE CIRCUS of NOTHINGNESS', 'THE-CIRCUS-of-NOTHINGNESS', 'תיאטרון החנות', 80, 'הקרקס של הלא כלום מציע חוויה תיאטרונית מרגשת על אובדן, עם מעל 80 בובות ופרפורמרים שמחפשים נחמה בעזרת זיכרונות ורגשות.', 'כיצד מתמודדים עם אובדן? קרקס הלא כלום הוא המטא-עולם בו הלוליינית היא זיכרון מרחף, הפילים הם רעדות כעס, הליצנים געגוע והסוסים צהלות שגעון. רוחה של מרי מובילה את צ''ארלי דרך זכרונות, רגשות ופנטזיה בדרכו למצוא את עצמו מחדש.', NULL) ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'Boxed' AND g.name = 'פנטזיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'Machine-Man' AND g.name = 'דרמה קומית' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'בית-לשלושה' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'בית-לשלושה' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'MuZeum' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'MuZeum' AND g.name = 'סאטירה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'Radio-Play' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'Radio-Play' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'THE-CIRCUS-of-NOTHINGNESS' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'THE-CIRCUS-of-NOTHINGNESS' AND g.name = 'פנטזיה' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
