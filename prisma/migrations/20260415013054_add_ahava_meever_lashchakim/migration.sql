-- Migration: Add show אהבה מעבר לשחקים to הפקות עצמאיות
-- Generated on 2026-04-15
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres (idempotent)
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('מחזמר') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('דרמה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מרגש') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Show
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('אהבה מעבר לשחקים', 'אהבה-מעבר-לשחקים', 'הפקות עצמאיות', 90, 'מחזמר במחווה לשירי אריק איינשטיין וצביקה פיק', E'אהבה מעבר לשחקים הוא מחזה מוזיקלי מרגש וסוחף, המשלב עלילה דרמטית עם השירים האהובים של אריק איינשטיין וצביקה פיק.\nעל רקע קיץ 1998, חמישה טייסי קרב צעירים נבחרים להוביל פעילות מבצעית מורכבת. אך כשהמבצע משתבש, הם מוצאים את עצמם בתוך מציאות של אובדן, חברות, כאב ואהבה גדולה.\nזהו סיפור עוצמתי על אנשים צעירים ברגעים ששינו את חייהם, לצד שירים בלתי נשכחים שהופכים את העלילה למופע מוזיקלי מרגש, נוסטלגי ועוצר נשימה.\nבין השירים: יושב על הגדר, תוצרת הארץ, צל עץ תמר, שיר אחרי מלחמה, אהבה בסוף הקיץ גבריאל ועוד.', 'אור שמריהו, עדי גרינברג, שחף אלחמיאס, אביב קשת, נועם עברון') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אהבה-מעבר-לשחקים' AND g.name = 'מחזמר' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אהבה-מעבר-לשחקים' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אהבה-מעבר-לשחקים' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Insert Events (venue resolved by name+city, safe across envs)
-- ============================================================
INSERT INTO "Event" ("showId", "venueId", date, hour) SELECT s.id, v.id, DATE '2026-05-20', '20:00' FROM "Show" s, "Venue" v WHERE s.slug = 'אהבה-מעבר-לשחקים' AND v.name = 'בית ציוני אמריקה ת״א' AND v.city = 'תל אביב' ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
SELECT setval(pg_get_serial_sequence('"Event"', 'id'), (SELECT MAX(id) FROM "Event"));
