-- Migration: Add new haifa shows
-- Generated on 2026-02-26T23:57:31.298Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('דרמה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('ישראלי') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מוזיקלי') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מרגש') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('"אין לי ארץ אחרת" - מופע הצדעה לאהוד מנור', 'אין-לי-ארץ-אחרת-מופע-הצדעה-לאהוד-מנור', 'תיאטרון חיפה', 90, 'מופע מחווה ליצירתו של אהוד מנור בהנחיית נתן דטנר', 'שישי ישראלי - סדרת זמר עברי

"אין לי ארץ אחרת"
מופע הצדעה לחתן פרס ישראל לזמר עברי
אהוד מנור') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('כשאמא באה הנה - אריאל הורוביץ ו״האחיות שמר 24״', 'כשאמא-באה-הנה-אריאל-הורוביץ-ו״האחיות-שמר-24״', 'תיאטרון חיפה', 80, 'אריאל הורוביץ ו״האחיות שמר 24״ שרים ומספרים נעמי שמר', 'המוזיקאי והיוצר אריאל הורוביץ במסע מוזיקלי מרגש מלא באהבה, געגוע ואופטימיות במחוזות היצירה של אימו המלחינה והמשוררת נעמי שמר, בסדרת מופעים משיריה שעיצבו את פס הקול הישראלי המשותף לכולנו.
המופע, הוא דיאלוג מוזיקלי בין הורוביץ, בנה של נעמי שמר, לקבוצה נבחרת של זמרות יוצרות מהדור הצעיר בארץ שמרכיבות יחד את ״האחיות שמר 24״.
הורוביץ, עם ההומור האופייני לו, נותן הצצה לסיפורים האישיים שמאחורי שיריה של אימו ויחד עם הלהקה, הם מצדיעים לשמר, בפרשנות עכשווית לשיריה, כפי שהיתה רוצה לשמוע את השירים שלה ב – 2025 ועם זאת מאפשרת לקהל להצטרף, לשיר, לצחוק, להתגעגע ולהרגיש ש"ארץ ישראל האבודה והיפהפייה והנשכחת", הנוכחת כל כך בשיריה של נעמי בכל זאת איננה אבודה.
המופע ״כשאימא באה הנה״ מאפשר לנו להתרפק על שמר היוצרת ובאותו הזמן להכיר את נעמי הפרטית.
השם "האחיות שמר 24" מהדהד את הרכב הנשים החלוצי שהקימה שמר באמצע שנות השישים.
אור אדרי, דניאל רובין, קרן טננבאום, נילי פינק ועינת הראל, הן מהזמרות היוצרות והמוזיקאיות הצעירות הבולטות והמקוריות בדורן ויחד - כלהקת הבית של המופע, הן מביאות לבמה את הרוח הנשית המהפכנית והרעננה שהביאה נעמי שמר בזמנה למוזיקה הישראלית כולה.

זכרונות הילדות והסיפורים מאחורי השירים: אריאל הורוביץ') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('מישהו לרוץ איתו', 'מישהו-לרוץ-איתו', 'תיאטרון חיפה', 100, 'עיבוד מרגש לספרו של דויד גרוסמן, המגולל סיפור אהבה ראשונה ומסע נעורים מלא הרפתקאות בירושלים.', 'אסף בן ה-16 מתבקש לאתר את הבעלים של כלבה שנמצאה משוטטת. הכלבה מובילה אותו בסיפור חייה של תמר, נערה בודדה, שיצאה למשימה מסוכנת כדי להציל את אחיה מהסיפור האפל שבו הסתבך.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('ערב שקופיות', 'ערב-שקופיות', 'תיאטרון חיפה', 75, 'מחזה אישי ומרגש על חיי זוגיות, המשלב זיכרונות ותחושות מהשגרה, עם ביקורות מהללות על כנות ואותנטיות.', 'נילי וירון נשואים 15 שנים, אך השגרה והחיים מביאים לריחוק ביניהם. ההצגה מציעה הצצה לחיים של זוגות, מהעליות והירידות ועד לזיכרונות מימי הקשר הראשונים.') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אין-לי-ארץ-אחרת-מופע-הצדעה-לאהוד-מנור' AND g.name = 'מוזיקלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'כשאמא-באה-הנה-אריאל-הורוביץ-ו״האחיות-שמר-24״' AND g.name = 'ישראלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'כשאמא-באה-הנה-אריאל-הורוביץ-ו״האחיות-שמר-24״' AND g.name = 'מוזיקלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מישהו-לרוץ-איתו' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מישהו-לרוץ-איתו' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'ערב-שקופיות' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'ערב-שקופיות' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
