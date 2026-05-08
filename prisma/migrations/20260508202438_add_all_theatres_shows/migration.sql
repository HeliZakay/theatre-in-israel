-- Migration: Add new all_theatres shows
-- Generated on 2026-05-08T20:24:38.350Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('דרמה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('דרמה קומית') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('ילדים') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('ישראלי') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מחזמר') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מרגש') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('סאטירה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קומדיה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('רומנטי') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('ד"ר סטריינג''לאב', 'ד-ר-סטריינג׳לאב', 'תיאטרון הקאמרי', 90, 'קומדיה נבואית על טירוף מלחמתי, בה הגנרל והנשיא נאבקים במצב חירום גרעיני, בעיבוד בימתי של יצירת המופת של סטנלי קובריק.', 'גנרל אמריקאי תמהוני נותן פקודה למתקפה גרעינית על ברית המועצות, בעוד הנשיא מנסה לעצור את הטירוף. בעיבוד בימתי מצחיק ורלוונטי, המתח עולה כאשר הרוסים מציבים מכשיר להשמדת החיים על פני כדור הארץ.', 'יניב ביטון, מיכה סלקטר, יואב לוי, נוי הלפרין, מוטי כץ, אוהד שחר, אבי טרמין, תום חודורוב') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('שיכורינגו', 'שיכורינגו', 'תיאטרון הקאמרי', 110, 'מחזמר קומי פרוע על אהבה ואינטימיות, בו איבר מין נעלם מתגייס לצה"ל, והשחקנים חוגגים עם צ''ייסרים בכל אזכור מצחיק.', 'דני דינגוט מגלה שאיבר המין שלו נעלם לאחר הצעת נישואים, בעוד האיבר שלו, ''רינגו'', חוגג עצמאות בעיר. מיקה מתאהבת ברינגו, והמצב מסתבך כשזה מתגייס לצה"ל. מחזמר קומי פרוע על אהבה ואינטימיות.', 'אלעד אטרקצ''י, תם גל, נעמה שטרית, בן פרי, תום חודורוב, אוריה יבלונובסקי, גל סרי, רוני נתנאל, מאיה קורן, יעלי רוזנבליט') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('רעיון גדול', 'רעיון-גדול', 'תיאטרון באר שבע', 90, 'קומדיה מפתיעה על כפילים, טעויות וצירופי מקרים, בה ארנו מתמודד עם בלבול זהויות וקשיים רומנטיים בלתי צפויים.', 'רעיון אחד, שלושה כפילים, מיליון טעויות. כשארנו מתחיל לחשוד שמריאן נדלקה על המתווך, הוא פוגש את כפילו ומבקש ממנו להתחזות אליו. הכל מסתבך כשמתווך מזויף פוגש את האמיתי ואח תאום נוחת.', 'מיכאל מושונוב, יואב דונט, פלורנס בלוך, דנה מיינרט') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('כוכבים תועים', 'כוכבים-תועים', 'תיאטרון החאן', 90, 'כוכבים תועים הוא עיבוד תיאטרוני מרגש ליצירה של שלום עליכם, המשלב בין חלום למציאות במסע חיפוש עצמי בין תרבויות.', 'לייבל ורייזל, צעירים מלאי תשוקה, עוזבים את כפרם היהודי הקטן ומבצעים מסע בין יבשות, שפות ותקופות, במאבק בין זהות קהילתית לחופש אישי. המחזה עוסק בתיאטרון, אהבה וגעגוע, ומעלה שאלות על שייכות ויצירה.', NULL) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('לב רעב', 'לב-רעב', 'קבוצת התיאטרון הירושלמי', 90, 'לב רעב היא הצגת תיאטרון מרגשת המפגישה את הצופה עם סיפורים אנושיים עמוקים על רצון ותשוקה, בעיבוד מרהיב של אשכול נבו.', 'ההצגה ''לב רעב'' מביאה את סיפוריהם המרגשים של הדמויות השונות, כשהן מתמודדות עם רצונות, געגועים ותשוקות. כל סיפור מציע הצצה לעולם הפנימי של הדמויות ומזמין את הצופה למסע רגשי מעורר השראה.', 'אייל שכטר, צהלה מיכאלי, רן כהן, מיקה פילבסקי') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('"הילדה והים" – הצגה ילדים', 'הילדה-והים-–-הצגה-ילדים', 'תיאטרון הסימטה', 60, '"הילדה והים" היא הצגה מוזיקלית עכשווית ומרגשת לילדים גילאי 4+ ולכל המשפחה', 'העלילה עוסקת בהתמודדות של משפחת מילואים עם געגוע וחוסר ודאות – מנקודת מבטה של ימית, ילדה בת 7, שאביה משרת במילואים בחיל הים.

כשימית מבינה שאבא לא יגיע ליום הולדתה שמתקיים מחר, למרות שהבטיח. היא מנסה בכל דרך לתקשר איתו ולא מצליחה. היא מתקשה להתמודד עם הגעגוע וגורמת צרות לאמא שלה. אמה אדווה, אשת קריירה, שטרודה בעבודה ובחששות משלה, מתקשה להרגיע אותה.

אחרי מפגש עם סבתה, ("סבתא מאביסה"-סבתא בשלנית שמספרת לה סיפורים על המשפחה) ימית מבינה שהיא חייבת להביא אותו בעצמה. היא מחליטה לצאת למסע כדי להגיע אליו ולהחזיר אותו הביתה. במהלך המחזה, ע"י מפגשים עם דמויות צבעוניות ומפתיעות (פיראט שמחפש אוצר אבוד, ופליסיה, מנקת בית הספר הקסומה והחכמה) היא לומדת שיעורים על הכח הפנימי שלה להתמודד עם געגוע. וגם על הכרת הטוב הנוסף בחייה ועל כמה שהיא מוקפת באהבה.

המחזה משלב שירים מקוריים, דיאלוגים מלאי הומור, דמיון ותנועה בימתית עשירה, ויוצר חוויה תיאטרלית רב-חושית שמדברת אל ליבם של ילדים והורים כאחד. זהו סיפור ישראלי, רלוונטי לתקופה המאתגרת שהעם שלנו חווה. על תקווה, משפחה, שייכות וכוחה של ילדה קטנה להתמודד עם אתגרים גדולים.', 'אלון לשם, ענת מידן') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('פרדוקס', 'פרדוקס', 'תיאטרון הסימטה', 80, 'פרדוקס הוא מחזה המשלב הומור ורגש, עוקב אחרי דמויות בתחנת אוטובוס המנסות למצוא את מקומן בעולם המודד הצלחה, תוך חקירת שאלות של זהות ושינוי.', 'המחזה ''התחנה'' עוסק בחלל שבין מה שאנחנו עכשיו לבין מה שאנחנו רוצים להיות. שישה גיבורים וגיבורות נאבקים להוכיח את ערכם לעצמם. הספסל בתחנת האוטובוס הוא מקום המפגש שלהם, שמחבר בין עלילותיהם השזורות. הדמויות עוברות תהליכים של זיהוי עצמי בתוך עולם שמתקשה להכיל את מי שמבקש לסטות מהמסלול. המחזה מציע לשהות באי הוודאות, אולי שם נמצא את עצמנו.', 'אלון לשם, יובל רהב, יעל בר שביט, נטע טרוים, רמי שוורץ, נוי אליאסי') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('להוריד את הכלב', 'להוריד-את-הכלב', 'הפקות עצמאיות', 80, 'דרמה קומית על זוגיות, נישואים וגירושין, המתרקמת בגינת כלבים ומזמינה את הצופים למסע מרגש ומפתיע.', 'שני זרים בגינת כלבים נפגשים ומפתחים מערכת יחסים מפתיעה וסוערת, שמביאה אותם להתמודד עם נישואים, גירושין ופנטזיות שלא מתגשמות.', 'אוהד בן-אבי') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'ד-ר-סטריינג׳לאב' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'ד-ר-סטריינג׳לאב' AND g.name = 'סאטירה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'שיכורינגו' AND g.name = 'מחזמר' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'שיכורינגו' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'רעיון-גדול' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'רעיון-גדול' AND g.name = 'רומנטי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'רעיון-גדול' AND g.name = 'דרמה קומית' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'כוכבים-תועים' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'כוכבים-תועים' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'כוכבים-תועים' AND g.name = 'ישראלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'לב-רעב' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'לב-רעב' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הילדה-והים-–-הצגה-ילדים' AND g.name = 'ילדים' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'פרדוקס' AND g.name = 'דרמה קומית' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'פרדוקס' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'להוריד-את-הכלב' AND g.name = 'דרמה קומית' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'להוריד-את-הכלב' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
