-- Migration: Add new niko-nitai shows
-- Generated on 2026-04-10T21:11:42.293Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('דרמה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('ישראלי') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מוזיקלי') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מותחן') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מרגש') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('סאטירה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קומדיה') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('אומץ - פסטיבל האזרח כאן', 'אומץ-פסטיבל-האזרח-כאן', 'תיאטרון ניקו ניתאי', 60, 'פסטיבל האזרח כאן מציג את ''אומץ'', חוויה תיאטרונית מעוררת השראה המוקדשת לערכים של אזרחות פעילה.', ' השנה היא 1970 וברקע קולות מלחמת ההתשה. נערים נדרשים למבחן אומץ להוכיח את בגרותם, "שרק לא יגדל לנו דור חלשלוש ומפונק" , כתבו המייסדים.

למעלה בחצר הקיבוץ רבים מתווכחים בקולניות אם ועל מה ולמה זה חשוב.

המסע של כולם אל תוככי אפלת הפרדס תציג אותם באופן שונה והפוך, מיסטי וקסום, עד שהכל נע וזע מאז ואל האקטואליה של הימים האלה.', 'לירון לוי, אודליה סגל, גילעד אוחנה, ג''וש בלר, פז פרל, מורן רייכר') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('ארץ יחפה - הצגה חדשה', 'ארץ-יחפה-הצגה-חדשה', 'תיאטרון ניקו ניתאי', 75, 'ההצגה ''ארץ יחפה'' מציעה חקירה עמוקה של החיים בישראל, עם דמויות מרתקות וסיפורים נוגעים ללב.', 'בעיצומן של ההכנות לטקס החג בקיבוץ, בין שירה, צחוק וזיכרון, מתפרצת המציאות הישראלית על כל מורכבותה.
הניסיון לשמור על אופטימיות ואחדות מתנגש בהשפעות המלחמה, בכאב, בסדקים ובשאלות שעוד אין להן תשובה.

סיפור ההצגה נוצר כחוויה תיאטרלית ייחודית השוברת את הגבולות בין במה לקהל,

משולב בהומור ושירים, על הרוח הישראלית – ועל המאבק להמשיך ולצעוד בארץ יחפה.', 'ערן בוהם - חיים, דליה ריבר - לאה, ישראל מעוז - יוני, נוי יתום - אלונה, תומר קפלן - דניל, אופיר דואן - משה, מורן רייכר - נעמה') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('אשתי הנצחית לשעבר', 'אשתי-הנצחית-לשעבר', 'תיאטרון ניקו ניתאי', 75, 'ההצגה ''אשתי הנצחית לשעבר'' מציעה עיבוד מרגש ומעורר מחשבה של מערכת יחסים מורכבת ואהבה נכזבת.', 'לחייו של סופר מצליח בז''אנר ספרות רומנטית וספרות סאדו-מאזו, שחי את חייו כרווק מצליח ומקצועי, פורצת לפתע אשתו לשעבר.

היא מצליחה לערער אותו ולבלבל את עולמו, כשהיא מקלפת בזה אחר זה את כל שכבות ההגנה שבנה סביבו.

בין רגעים קומיים לרגעים מרגשים, נפגוש גם דמויות קיצוניות ומפתיעות.

 

הצגה מצחיקה, מרגשת ונטועת תקווה – על יחסים ועל האמונה בטוב שבאדם.', 'גל ישראלי, נעמה שלום עמיאל, תרזה פרחי, לאון נונין') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('הייתי והנני - אלכסנדר פן', 'הייתי-והנני-אלכסנדר-פן', 'תיאטרון ניקו ניתאי', 75, 'בהצגה ''הייתי והנני'' נגלה את חייו המורכבים של אלכסנדר פן, עם שירים שמלווים את סיפורו האישי והיצירתי.', 'הצגה מקורית מרגשת על הפרק האחרון, האינטימי והפחות מוכר בחייו של המשורר אלכסנדר פן, המשלבת את שיריו הידועים.', 'אייל שכטר, שירה פרבר, יפתח רווה, יואב סדובסקי, נוי יתום, מורן רייכר, ישראל מעוז.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('המבול', 'המבול', 'תיאטרון ניקו ניתאי', 75, 'המבול הוא דרמה מרתקת שחוקרת את הגבולות של נאמנות וחברות בעידן של שינוי.', 'במהלך עוד ערב שיגרתי בבר של סטרייטון, 
עימותים קטנים חוזרים ונשנים בין הלקוחות,
כמו בפנים גם בחוץ משתוללת סערה - מבול קיצוני ומסכן חיים עומד לפקוד את המקום.
הם מוצאים את הדרך להתאחד במלחמה על חייהם.
האם חייהם ינצלו וההרמוניה תחזיק מעמד?', 'אבנר מדואל בן יהודה, איריס הרפז, יולי מובצ''ן, דליה ריבר, אופיר דואן, אסף מור, אלון לשם, מרטין בלומנפלד ונעמי בן אסא.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('חדשות אחרונות', 'חדשות-אחרונות', 'תיאטרון ניקו ניתאי', 90, 'קומדיה שנונה המציעה מבט חכם על המציאות העכשווית, עם דמויות מצחיקות ואירועים בלתי צפויים.', 'מערכת של עיתון כושל שעסוק בעיקר בשערוריות קטנות מתגנב בטעות מאמר אקדמי, שגורר אחריו אי-הבנות קומיות רבות שבהן מעורבים בעל הון, פוליטיקאי מושחת, פרופסור להיסטוריה, סטודנטית צעירה וסיפור אהבה.

מיכאל סבסטיאן המחזאי המודרני שכתב את "כוכב בלי שם" במחזה האחרון שנכתב לפני מותו הטראגי – מחזה אקטואלי מתמיד, גם ממרחק של מעל 70 שנים.', 'אושר בית הלחמי, מרטין בלומנפלד, אופיר דואן, גל ישראלי, אבנר מדואל בן-יהודה, לירן נעמן/נעמי בן אסא, יואב סדובסקי, מורן רייכר, יפתח רווה/יוני לויתן') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('חמישה ערבים. ערב-ערב', 'חמישה-ערבים.-ערב-ערב', 'תיאטרון ניקו ניתאי', 100, 'אחרי 17 שנים הגיבור שלקח חלק במלחמת העולם השניה, חוזר לסנט פטרבורג ומוצא שם בית בו לפני המלחמה שכר חדר ונזכר בבחורה שאהב לפני המלחמה.', 'אחרי 17 שנים הגיבור שלקח חלק במלחמת העולם השניה, חוזר לסנט פטרבורג ומוצא שם בית בו לפני המלחמה שכר חדר ונזכר בבחורה שאהב לפני המלחמה.

הזוג מבלה חמישה ערבים יחד, מערכת היחסים מתפתחת עד לסיום המפתיע.', 'אנדריי קשקר, אנה גלנץ-מרגוליס, דנה קוצ''רובסקי, מיכאל לרנר, אלכסנדרה מקרסקי, איליה איבנוס') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('להיות ג''ובאני', 'להיות-ג׳ובאני', 'תיאטרון ניקו ניתאי', 60, 'יצירה דרמטית, חדה ואינטימית, הבוחנת את המפגש שבין זיכרון, וטראומה לאמנות.', 'המופע מוצג כעיבוד לשני שחקנים, המגלמים את הדינמיקה הטעונה שבין שמוליק להרמן - דמות טורפת ומכשפת מצד אחד, ודמות מבקשת הכרה מצד שני.

להיות ג''ובאני נע בין שנים וזמנים: מילאנו של שנות ה80 וה90, זיכרונות ילדות בהיכל התרבות בתל אביב, ואולם הרצאות עכשווי שבו שמוליק - כיום מרצה לפוסטטראומה - מוצף מחדש על ידי העבר שלא מרפה.

באמצעות סצנות מלאות הומור אכזרי, מוזיקה אופראית מפורקת וקירבה אנושית בלתי מתפשרת, ההצגה חושפת מסע מורכב של השפעה, כמיהה, תלות ושחרור.

הבמה מציגה מפגש חי ונוקב בין שני שחקנים הבוחנים את הגבול בין זיכרון למציאות, בין כוח לרוך, ובין "ניקיון" פנימי לבין מה שנטמע עמוק מדי כדי שיימחק.

 

להיות ג''ובאני מעזה להתבונן בעוצמה האנושית של יחסי מורה-תלמיד ובשאלה: האם אפשר באמת להשתחרר מן הקול של פעם, שעדיין מהדהד בתוכנו?

מסע רגשי מסעיר, מצחיק, כואב ומחייה - כזה שנשאר הרבה אחרי שהאור נכבה.

המחזה, מאת שאול קונטיני, עולה בבימויו של קיריל לבמן המשתף פעולה עם תאטרון ניקו ניתאי כבר שנים רבות. הבימאי מתגורר כיום בלונדון, וזוהי הזדמנות נדירה לצפות ביצירתיו בעברית.', 'מיכאל לרנר, אבי שוורצמן') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('לעוף אל החופש', 'לעוף-אל-החופש', 'תיאטרון ניקו ניתאי', 80, 'קבוצת בני אדם יוצאי דופן, שהממסד הרפואי שכח אותם במוסד נידח בהרי הבלקן, מתעוררת לחיים חדשים בזכות מתנה בלתי צפויה שנחתה עליהם מהשמיים, ומפלסת לעצמה דרך אל החופש.', 'המחזה בוחן את גבולות חופש הביטוי ומביא נקודת מבט חומלת ומשעשעת על תפקיד ה"משוגע" והשונה בהגשמת החלום האנושי.
המחזה זכה בפרס המחזה הטוב ביותר בתחרות הבינלאומית בבריטניה על היותו "מלא שמחה, קסום וייחודי. זהו משל קומי מלא השראה לימינו."
', 'אופיר דואן, אושר בית הלחמי, לאון נונין, גל ישראלי, יואב סדובסקי, דליה ריבר, אסף מור') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('מי רצח את אלמה?', 'מי-רצח-את-אלמה', 'תיאטרון ניקו ניתאי', 80, 'אלמה פרידמן נרצחה בחגיגות יום הולדתה. ', 'אלמה פרידמן נרצחה בחגיגות יום הולדתה. 
רבים עשויים היו לרצות במותה, אבל מי עשה זאת? ואיך משולש אהבה קשור לסיפור? תלוי את מי שואלים... 
הדמויות השרויות בחקירה, ייחשפו ווידויים מרתקים אשר יעזרו לקהל בגילוי האמת ופיצוח התעלומה.', 'יולי מובצ''ן, אבנר מדואל בן יהודה, איריס הרפז, אלי וגנר, נעמי בן אסא, דליה ריבר') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('מכתב אבוד', 'מכתב-אבוד', 'תיאטרון ניקו ניתאי', 90, 'סאטירה חריפה ומשעשעת על המבנה המושחת של הבחירות בחברה המודרנית.', 'מחזה גרוטסקי ומצחיק עד דמעות, אשר חושף באופן נוקב את אחורי הקלעים של מערכת בחירות.

אירועי העלילה כוללים התנגשויות בין שתי מפלגות גדולות המתחרות זו בזו כשלמפלגת השלטון הנוכחית יש רוב סיכויים לזכות בכיסא הנכסף. אבל מכתב אחד לא כל כך תמים גורם לתהפוכות ומסכן את הזכייה המובטחת.

הגיחוך והאבסורד של אמרות גבוהות שמאחוריהן מסתתרים החישובים הקטנוניים של כל צד. קרקס שלם של תככים ואינטריגות שאינו נופל מן המציאות.', 'אושר בית הלחמי, מרטין בלומנפלד, צביקה דולב, אריאלה ברונשטיין, גל ישראלי, יונתן לוויתן, רועי משיח, אבנר מדואל בן-יהודה, יואב סדובסקי ולאון נונין') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('סיפור אהבה - שלישייה במי במול', 'סיפור-אהבה-שלישייה-במי-במול', 'תיאטרון ניקו ניתאי', 60, 'קומדיה רומנטית קסומה המשלבת קטעי פסנתר מוכרים', 'תיאטרון ניקו ניתאי חובר אל הפסנתרן אור יששכר עם קטעי פסנתר ממיטב היצירות הקלאסיות של מוצארט לצד בטהובן, באך, שופן ואחרות שזורות ביצירה הקסומה של אריק רומהר ''שלישייה במי במול''.  
זו היא קומדיה רומנטית המתארת עליות ומורדות של מערכת יחסים זוגית. סודות וקשיים מעיבים על הקשר ומקור החיבור שלו מתגלה דרך המוסיקה, ובפרט ביצירה של מוצארט ''שלישיה במי במול''. ', 'אושר בית הלחמי, יולי מובצ''ן') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אומץ-פסטיבל-האזרח-כאן' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אומץ-פסטיבל-האזרח-כאן' AND g.name = 'ישראלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'ארץ-יחפה-הצגה-חדשה' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'ארץ-יחפה-הצגה-חדשה' AND g.name = 'ישראלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'ארץ-יחפה-הצגה-חדשה' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אשתי-הנצחית-לשעבר' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אשתי-הנצחית-לשעבר' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הייתי-והנני-אלכסנדר-פן' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הייתי-והנני-אלכסנדר-פן' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'המבול' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'חדשות-אחרונות' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'חדשות-אחרונות' AND g.name = 'סאטירה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'חמישה-ערבים.-ערב-ערב' AND g.name = 'ישראלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'להיות-ג׳ובאני' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'לעוף-אל-החופש' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מי-רצח-את-אלמה' AND g.name = 'מותחן' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מכתב-אבוד' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מכתב-אבוד' AND g.name = 'סאטירה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'סיפור-אהבה-שלישייה-במי-במול' AND g.name = 'מוזיקלי' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
