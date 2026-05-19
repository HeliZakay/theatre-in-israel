-- Migration: Add show כמו פרפר at הקאמרי with 3 events
-- Generated on 2026-05-19
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres (idempotent — both already exist in prod)
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('דרמה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מרגש') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Show
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES (
  'כמו פרפר',
  'כמו-פרפר',
  'הקאמרי',
  60,
  'בתקופת הקורונה, שיחת טלפון אקראית מציתה מחדש אהבת נעורים ישנה: חן סער, המתמודדת עם מחלת הסרטן ומבודדת בדירתה, נסחפת לקראת מפגש טעון עם מיקי שרון — מפגש שבו עבר, הווה וגורל משתלבים זה בזה.',
  E'דרמה מרגשת על אהבה, חברות וגורל שמפגיש בין לבבות.\n\nחן סער, המתמודדת עם מחלת הסרטן, נמצאת לבדה בדירתה בתקופת הקורונה. שיחת טלפון אקראית מציתה את האש שכבתה בה. היא מניחה בצד את צרותיה ונשאבת לרגעי ההתרגשות והציפייה לקראת המפגש המרגש עם מיקי שרון.\nהאם תתעורר שוב אהבת הנעורים הגדולה? האם זיכרונות העבר יכסו על הדרמות המתחוללות בהווה? האם הגורל הוא זה שיחליט?',
  'אפרת בזר, אמיר מרציאנו, שיקמה הופמן-זיו'
) ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'כמו-פרפר' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'כמו-פרפר' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Insert Events (venue resolved by name+city, safe across envs)
-- ============================================================
INSERT INTO "Event" ("showId", "venueId", date, hour) SELECT s.id, v.id, DATE '2026-05-20', '20:30' FROM "Show" s, "Venue" v WHERE s.slug = 'כמו-פרפר' AND v.name = 'תיאטרון הקאמרי' AND v.city = 'תל אביב' ON CONFLICT DO NOTHING;
INSERT INTO "Event" ("showId", "venueId", date, hour) SELECT s.id, v.id, DATE '2026-06-24', '20:00' FROM "Show" s, "Venue" v WHERE s.slug = 'כמו-פרפר' AND v.name = 'תיאטרון הקאמרי' AND v.city = 'תל אביב' ON CONFLICT DO NOTHING;
INSERT INTO "Event" ("showId", "venueId", date, hour) SELECT s.id, v.id, DATE '2026-07-28', '20:30' FROM "Show" s, "Venue" v WHERE s.slug = 'כמו-פרפר' AND v.name = 'תיאטרון הקאמרי' AND v.city = 'תל אביב' ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
SELECT setval(pg_get_serial_sequence('"Event"', 'id'), (SELECT MAX(id) FROM "Event"));
