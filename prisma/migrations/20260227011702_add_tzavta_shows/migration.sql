-- Migration: Add new tzavta shows
-- Generated on 2026-02-27T01:17:02.297Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('אבסורדי') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('אינטימי') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('דוקומנטרי') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('דרמה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('דרמה קומית') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('ילדים') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('ישראלי') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מוזיקלי') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מותחן') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מחזמר') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מרגש') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('סאטירה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קומדיה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קלאסיקה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('רומנטי') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('אהבה וחושך', 'אהבה-וחושך', 'תיאטרון צוותא', 90, 'דרמה מרגשת המבוססת על הספר ''סיפור על אהבה וחושך'', החושפת את חייה של פניה, אם הסופר עמוס עוז, בהקשר ההיסטורי של התקופה.', 'סיפורה של פניה, אמו של עמוס עוז, מיום בואה לארץ ישראל ועד יום מותה המחריד. דרך שנות ה -30 וה- 40 מתגלה על הבמה ההיסטוריה האישית והלאומית.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('אורות קטנות', 'אורות-קטנות', 'תיאטרון צוותא', 60, 'מחזמר הומוריסטי המעלה שאלות על האור והחושך בנפשנו, ומזמין את הצופים לחקור את הקיום בעידן המאתגר.', 'המחזמר עוסק במלחמה בין האור והחושך בנפשנו ובצורך שלהם אחד בשני על מנת להתקיים, תוך העלאת שאלות רלוונטיות בצורה היתולית והומוריסטית.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('אחינועם ואני', 'אחינועם-ואני', 'תיאטרון צוותא', 60, 'קומדיה מרגשת על אהבה, תום והתבגרות, כשמשחק חדש מערער את מערכת היחסים של זוג צעיר.', 'סיפור על אחינועם ותמיר, המבלים בגן עדן של משחקים, אך כאשר משחק חדש נכנס לחייהם, הם נאלצים להתמודד עם מערכת היחסים שלהם במסע גילוי עצמי.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('אירלנד', 'אירלנד', 'תיאטרון צוותא', 50, 'דרמה קומית על חיפוש אהבה באירלנד, המשלבת הומור עם כאב אישי, תוך התמודדות עם האתגרים של רווקות בעידן המודרני.', 'צעירה ישראלית מוצאת את עצמה באירלנד לאחר פרידה טראומטית, יוצאת לדייטים ומגלה שההרפתקה הרומנטית שלה מתפתחת למערבולת של הרס עצמי.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('אמא שלי קראה לי רוטוויילר', 'אמא-שלי-קראה-לי-רוטוויילר', 'תיאטרון צוותא', 60, 'מופע יחיד מצחיק ונוגע ללב, המשלב בין כאב אישי להומור, תוך חקירת הזהות המשפחתית והאישית.', 'מיה יוצאת למסע אישי, חד וכואב, בשאלה מה היא יותר - פודל או רוטוויילר, תוך חיפוש מרחב בו מותר לדבר על הכל, עם הרבה הומור וכנות.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('אני מכיר רק אחד שמתנהג ככה', 'אני-מכיר-רק-אחד-שמתנהג-ככה', 'תיאטרון צוותא', 50, 'פרפורמנס חודרני המשלב מונולוגים אישיים על זעם משפחתי, חרטה ורצון לריפוי, רגע לפני שהבן הופך לאב.', 'המופע עוסק בזעם הבין-דורי במשפחה, כאשר שלושה גברים מעבירים את הזעם בירושה, ומבצעים תהליך גמילה ממנו.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('אסתר', 'אסתר', 'תיאטרון צוותא', 70, 'קומדיה אוטוביוגרפית-מוסיקלית על מסע של אישה כל הדרך מפסגת זאב לפסגה', 'לא בכל יום מחפשים את “עופרה חזה”. בדרך כלל מחפשים “לייזה”, או “ג’ני” או “מאשה”.
זאת ההזדמנות של אסתר. זה האודישן הראשון שבו התלתלים שלה הם נכס ולא בלת”ם.
בחדר מחכות כבר 900 בנות שחרחרות, מתולתלות, בשמלות פרחוניות ועגילי נחושת. מהבמה ניתן לשמוע ביצוע של “לאורך הים”.
ואז עוד ביצוע של “לאורך הים”.
40 ביצועים ברצף. “לאורך הים”.
מה לא עושים בשביל תפקיד.

והרי יש את הקול הזה מילדות שלוחש “לשם את שייכת…”, ורוח גבית שדוחפת ללהקה צבאית, לכוכב נולד, לרילוקיישן, לעשות ילדים, לברוח ממלחמות או להיות יוליה.
משהו כל הזמן קורא, ועדיין זה לא קורה.
והכל יקרה עוד רגע, ובסוף זאת עדיין אותה אסתר, בסלון בפסגת זאב, מנסה להצחיק את אבא.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('אקורד סיום - למלחמה', 'אקורד-סיום-למלחמה', 'תיאטרון צוותא', 60, 'דרמה מוזיקלית מרגשת על זוג שמנסה לשנות את גורל ממלכתם בעזרת השירה, תוך חיפוש אחר תקווה וחירות.', 'נאפיסה ואבו חסן חיים בממלכת מהגרייה באפלוליות ובחוסר תקווה. אבו חסן הוא משורר החצר של השולטן, אבל את השירים לשולטן הוא מקבלת מאשתו נאפיסה. היא המשוררת שכל לילה חולמת את השיר לשולטן ומזמרת אותו בבוקר באוזני בעלה לפני שהוא יוצא לארמון. במהלך ההצגה נבדוק אם נאפיסה ואבו חסן יצליחו להשתמש בכוחה של השירה, על מנת לבטל את השררה ואת שלטון הדיכוי ולהניע שינוי בממלכה. מה בעצם יהיה אקורד הסיום?') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('ארטיסט', 'ארטיסט', 'תיאטרון צוותא', 60, 'הצגת יחיד כנה ומרגשת על אתגרי החיים של אדם עם תסמונת אספרגר, המשלבת הומור ודרמה במסע של קבלה והעצמה.', 'בהצגת היחיד החדשה שלו, עמרי לייבוביץ'', שחקן ויוצר, המאובחן עם תסמונת אספרגר, מגלם את עצמו ומספר בגוף ראשון, בשפה ישירה וכנה, על האתגרים האישיים והחברתיים שמלווים אותו. עמרי שוזר רגעים דרמטיים ונוגעים ללב באתנחתות של הומור ואופטימיות. הוא מחפש בת זוג, נזכר באהבה הראשונה, חולם על העתיד וגם עוסק במפגש המורכב שלו עם סביבתו. דרך סיפורו האישי, הוא מתמודד עם קבלת האבחנה ומראה לנו את ההיבטים החיוביים שבהיותו מיוחד.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('בוז''ולה', 'בוז׳ולה', 'תיאטרון צוותא', 60, 'מופע סאטירי ומוזיקלי שבו הקהל בוחר את המערכונים, מציע חוויה מצחיקה ואקטואלית עם שחקנים מוכשרים.', 'מופע מערכונים שבו הקהל בוחר את המערכונים. שישה צעירים עתירי כישורים מפגינים על הבמה השתוללות מתוכננת, מושרת, מתנועעת, מצחיקה, בוטה, מקורית וממזרית, מגובה באמירה על החיים כאן. במהלך המופע יש תוכן אקטואלי שכיף לצחוק עליו ושחקנים מוכשרים שמנגישים אותו בחן רב.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('גידול ושמו בועז קומדיה רומנטית בקטע דפוק', 'גידול-ושמו-בועז-קומדיה-רומנטית-בקטע-דפוק', 'תיאטרון צוותא', 90, 'קומדיה פרועה על רווקה המגלה שהאקס שלה הוא הגידול שעל הלב שלה, ומנסה להחליט בין אהבה לשחרור.', 'נועה, רווקה חסרת ביטחון עצמי, מתבשרת שיש לה גידול על הלב - בועז, האקס שלה מלפני 3 שנים. היא חשבה שהיא כבר מזמן התגברה עליו, אבל מסתבר שהוא עדיין שם. הדרך היחידה להסיר את הגידול ולמצוא אהבה היא להרוג אותו. העלילה מסתבכת כאשר נכנסת לתמונה הפסיכולוגית המוטרפת שלה, בחור נוירוטי וקטליזטור רפואי שדומה לבועז. עכשיו נועה צריכה לבחור: האם להישאר עם הגידול או להרוג את בועז ולנסות למצוא אהבה.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('דמות אב', 'דמות-אב', 'תיאטרון צוותא', 75, 'קומדיה סאטירית על השפעת דמות האב על חינוך ילדים בעידן המודרני, כששיטות חינוך לא צפויות מערערות את הסדר בבית.', 'בטי דראופר שוכרת את שירותיו של אדון שפיץ להיות דמות אב לבתה הטינאייג''רית. אך כאשר שיטות החינוך של האבא משתלטות על הבית ובתה המפונקת מתחילה להשתנות, בטי מוצאת שהתפקיד שלה כאמא בסכנה.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('המופע הגלוי של גל בנג''ו | The Banjo Show', 'המופע-הגלוי-של-גל-בנג׳ו-The-Banjo-Show', 'תיאטרון צוותא', 70, 'מופע דוקו-דרמה מרגש שבו גל בנג''ו חושף את הפחדים והאתגרים שלו, במסע של גילוי עצמי והבנה.', 'מופע אישי שבו גל בנג''ו משתף את המסע שלו דרך פחדים, חרדות וחוויות חיים קשות, תוך כדי חיפוש אחר האמת הפנימית שלו. המופע מציע חוויה מטלטלת של אומץ, עומק, הומור ותובנות לחיים אמיתיים.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('הסוף', 'הסוף', 'תיאטרון צוותא', 120, 'מחזמר מצחיק ומותח על מדען הנלחם נגד המוות במטרה להציל את אהובתו, תוך חקירה של החיים והמוות.', 'מדען גאון ושבור לב משתף פעולה עם המוות בכבודו ובעצמו בשביל למצוא פתרון לחיי נצח ולהציל את חייה של אהובתו.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('העורף', 'העורף', 'תיאטרון צוותא', 70, 'העורף הוא דרמה מרגשת על זוג קשישים המנסים להתמודד עם מלחמה, אהבה ומגבלות הגיל, תוך מסע פנימי שמאתגר את תודעתם.', 'בוקר שבת. רבקל''ה ואליהו צופים בטלוויזיה. בחדשות מודיעים שפרצה מלחמה. אליהו הקשיש נחוש לצאת לחזית ולהילחם על הבית. רבקל''ה מתעקשת לעבור לדיור מוגן. הם לא מבינים מדוע השעון נעצר, לאן נעלמה המכולת, ומהו הריח השרוף החודר את הסלון. רבקל''ה ואליהו הם זוג קשישים שכמו מרבית הישראלים חש בדחף לסייע מהעורף לעצירת הדימום שבחזית, אך רצונם נפגש פעם אחר פעם עם מגבלות הגיל. זהו מסע בזמן ברגע בו הוא עוצר מלכת. סיפור של אהבה ארוכת ימים בצל בגידת הגוף, התודעה והמולדת.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('הפנס הסגול', 'הפנס-הסגול', 'תיאטרון צוותא', 60, 'הפנס הסגול הוא הצגת ילדים קסומה על התמודדות עם פחדים וגילוי עצמי, המשלבת דמיון ודמויות מרתקות.', 'סיגלית עומדת להתחיל מחר את כיתה ב'' והיא לא מצליחה להירדם. היא נעזרת בפנס שמאיר בגוון סגול, אך הלילה הפנס מפסיק לעבוד ומפגיש אותה עם גוונים שונים. האור מוביל אותה לעולמות בצבעים שונים והיא פוגשת יצורים בחדרה החשוך: זאף - הזאב הזועף, נמללה - הנמלה האומללה וצמד כבשים. אלה מכוונים אותה בדרכה אל יום המחרת עם תובנות חדשות.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('התחנה האחרונה', 'התחנה-האחרונה', 'תיאטרון צוותא', 60, 'התחנה האחרונה היא דרמה קומית על מפגש בין חיים למוות, המאתגרת את הדמויות להתמודד עם העבר והזיכרונות בדרך לאי-ודאות.', 'בתחנת רכבת מסתורית, בנקודת המעבר בין החיים למוות, נפגשים טירון צעיר וחייל ותיק. שניהם נושאים עמם מטענים מהעבר, וממתינים לרכבת שתיקח אותם אל ''התחנה האחרונה''. במהלך ההמתנה המתוחה, על רקע שגרה צבאית אבסורדית, נאלצים השניים להתמודד עם הזיכרונות ולבטוח זה בזה. תחת עינה הפקוחה של קצינת קישור הם ייצאו למסע מפתיע, מצחיק ומעורר מחשבה.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('זה בסדר.?', 'זה-בסדר.', 'תיאטרון צוותא', 50, 'זה בסדר.? היא הצגה מעוררת מחשבה על זהות, שייכות והתמודדות עם כאב, המוצגת דרך חוויות אישיות של צעירים ישראלים.', 'שישה פרפורמרים צעירים בוחנים את אחת השאלות הבוערות של דורם: האם להישאר בארץ או לעזוב? דרך סיפוריהם האישיים מה-7.10.2023 ועד היום, הם בוחנים את הקשר שלהם למקום הזה, את הזהות שלהם במקום אחר ובעיקר נוברים בפצעיהם מאותה שבת. התמודדות עם שכול, פוסט טראומה וזוגיות לצד הלם קרב, כל אלו מובילים לשאלה - במה נשאר לנו להיאחז במקום הזה?') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('טובעים השניים', 'טובעים-השניים', 'תיאטרון צוותא', 60, 'טובעים השניים היא דרמה אינטימית על חיפוש משמעות וקשרים אנושיים, המוצגת דרך סיפוריהם המורכבים של ארבעה צעירים.', 'כל אחד מאיתנו מחפש את האדם שיביא לחייו משמעות. גם ספיר, פלג, אלינור ונועם מחפשים אחר האדם שיוכלו להישען עליו. פלג וספיר, זוג המושלם, טובעים תחת סודות שהסתירו אחת מהשנייה, בעוד אלינור ונועם, אחים שהפכו לאויבים, מתמודדים עם משבר משפחתי. הסיפורים משתלבים, והדמויות מתחברות לפאזל אחד מוזר וצבעוני.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('ככה יצאתי', 'ככה-יצאתי', 'תיאטרון צוותא', 50, 'ככה יצאתי היא הצגה אמיצה על חוויות יוצאי החברה החרדית, המציעה מבט אישי ומרגש על תהליך היציאה והחיים החדשים.', 'שני שחקנים יוצאי החברה החרדית מביאים לבמה סיפורים אמיתיים של אנשים שבחרו לעזוב את העולם החרדי. השחקנים מחליפים דמויות, נעים בין העולמות ומשתפים אותנו בסיפורם האישי. זהו מסע לתוך ''עולם היציאה''.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('לדפוק', 'לדפוק', 'תיאטרון צוותא', 70, 'לדפוק היא קומדיה שנונה על גוף האדם, המשלבת הומור עם ביקורת חברתית על החיים המודרניים והאתגרים הבריאותיים.', 'ברוכים הבאים לגוף האדם. שלומי הוא גבר בן 53 עם הרגלי חיים מפוקפקים. האיברים הפנימיים שלו מנהלים ביניהם יחסים טעונים, בזמן שהמתח בגוף גובר. קומדיה פרועה המגלגלת אותנו במדרון הבריאותי של שלומי ומציעה מבט אחר על הגוף האנושי כמיקרוקוסמוס של חברה על סף קריסה.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('מה שקרה לנו', 'מה-שקרה-לנו', 'תיאטרון צוותא', 80, 'הצגה קומית ומרגשת על זוגיות בעידן המודרני, המשלבת רגעים יומיומיים עם אבסורד החיים.', 'שירי ארצי ויפתח קליין, זוג נשוי, משתפים ברגעים יומיומיים מהמציאות האבסורדית של השנתיים האחרונות. הצגה כנה ואמיתית על איך ממשיכים לאהוב, לריב, לצחוק ולהישאר ביחד גם בתוך סערת חיינו.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('מכתב הקסם', 'מכתב-הקסם', 'תיאטרון צוותא', 50, 'הצגת ילדים מרגשת המשלבת תיאטרון, וידאו וספר פופ-אפ, המספרת על כוח המילים והקשרים בין בני משפחה.', 'ניתאי מגלה את נפלאות הכתיבה ומחליט לכתוב מכתב לאמו. המכתב יוצא למסע מרתק, עובר דרך דמויות מגוונות עד שהוא מתגלגל חזרה לידיו של ניתאי ברגע בו הוא הכי צריך אותו.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('מפי שמירה אימבר', 'מפי-שמירה-אימבר', 'תיאטרון צוותא', 65, 'דרמה עוצמתית על חיים, אהבה ומורשת, המספרת את סיפור חייה של שדרנית מיתולוגית רגע לפני סיום.', 'שמירה אימבר, שדרנית מיתולוגית, חולה בסרטן, מקליטה תוכנית רדיו מוסיקלית ביום האחרון של חייה. היא יוצאת למסע בחייה, מילדותה ועד ימיה כקריינית חדשות.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('מצבים בפוטנציה', 'מצבים-בפוטנציה', 'תיאטרון צוותא', 90, 'מופע מוזיקלי המשלב שירה ודיבור, חוקר את מורכבות האהבה והאובדן בעזרת שירים מוכרים וטקסטים נוגעים ללב.', 'מופע מהורהר, מצחיק ומרגש המבוסס על קטעים מתוך ספריו של בני ברבש. הוא עוסק באהבה ושכול, עם שירים מפנתיאון הקלאסיקה הישראלית וטקסטים מרגשים.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('מקליד/ה...', 'מקליד-ה...', 'תיאטרון צוותא', 80, 'דרמה קומית המשלבת רגעים של צחוק ודמעות, מציעה חוויה תיאטרונית ייחודית ומעוררת מחשבה.', 'מחזה מקורי, מצחיק, עצוב ומרגש בו זמנית.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('נישואים גרעיניים', 'נישואים-גרעיניים', 'תיאטרון צוותא', 60, 'קומדיה מרגשת על זוגיות בעידן המודרני, המראה כיצד אהבה והומור יכולים לעזור להתמודד עם אתגרים.', 'זוג נשוי עם אהבה גדולה מגיעים לאודישן לתוכנית ריאליטי חדשה, שם הם נאלצים לחשוף ריבים, סודות ורגעים רגשיים.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('סונטת קרויצר', 'סונטת-קרויצר', 'תיאטרון צוותא', 80, 'סונטת קרויצר מציעה חוויה מוזיקלית מעמיקה המשלבת קלאסיקה עם נרטיב מרגש, המגיעים לשיאים חדשים על הבמה.', 'יצירה המשלבת את המוזיקה של בטהובן עם קטעים מהנובלה של טולסטוי, בביצועו של ששון גבאי.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('עוברת בירושה', 'עוברת-בירושה', 'תיאטרון צוותא', 40, 'עוברת בירושה היא מונודרמה נוגעת ללב המציעה הצצה לעמקי הקשרים המשפחתיים והאתגרים שבין הדורות.', 'אישה צעירה עומדת בפני החלטה – להישאר או לקום וללכת. בעיצומה של פרידה, היא מתחילה לחקור את סיפור משפחתה, ובמרכזו דמות אחת – סבתא. קשר ייחודי ועמוק בין השתיים מתגלה לאט לאט ומלווה את המסע כולו.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('עצבים', 'עצבים', 'תיאטרון צוותא', 60, 'עצבים הוא אירוע סטוריטלינג כנה ומרגש המגלה את המחירים של עצבנות יתר על מערכות יחסים.', 'מאיה ודוד נפגשים בבית קפה שכונתי, ומתאהבים. אלא שאז מתגלה בעיה קטנה. "עצבים" הוא סיפור קטן, מהחיים, המציע זווית מרעננת על עצבנות יתר והשפעתה על זוגיות.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('ערוץ שטות עשרה', 'ערוץ-שטות-עשרה', 'תיאטרון צוותא', 50, 'ערוץ שטות עשרה הוא מופע קומי ומרגש המשלב ליצנות ובובות, בו הגיבורה מגלה את כוחותיה הפנימיים.', 'חוויה מטורפת של ליצנות, בובות והקרנת וידאו בלייב לכל המשפחה! גיבורת המופע מאבדת עבודה ומצב רוח, ונמשכת לטלוויזיה שם הכל קל ומושלם. היא מגלה שהיא יכולה להיות הגיבורה של חייה.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('פאק בסיסטם', 'פאק-בסיסטם', 'תיאטרון צוותא', 60, 'פאק בסיסטם הוא מניפסט אבסורדי ויזואלי המאתגר את תפיסת המושלמות והשלמות בחיים.', 'גרב שנכנסת לנעל, תחתונים שנכנסים לישבן, ופרטי לבוש סוררים נוספים מעוררים במוחו של גיא את החשד שהעולם לא מושלם. הוא יוצא למסע חסר פשרות בעקבות הדפקט.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('פימה ג''קסון ולהקתו', 'פימה-ג׳קסון-ולהקתו', 'תיאטרון צוותא', 60, 'פימה ג''קסון ולהקתו היא מופע מוזיקלי מרגש על חברות ואתגרים, המשלב קאברים ברוסית עם סיפור מרתק.', 'להקה של וובה, ולדי ופימה מבצעת קאברים איכותיים ברוסית לשירי פופ מוכרים. כאשר מכשף מעניק לפימה מתנה מסתורית, מאזן הכוחות בלהקה מתערער.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('פצעים', 'פצעים', 'תיאטרון צוותא', 60, 'דרמה מרגשת על מפגש בין שני אנשים שבורים שמנסים לשנות את חייהם בעזרת קשר בלתי צפוי.', 'אביחי, בתול בשנות העשרים לחייו, מגיע אל ניקי, זונה המכורה לסמים. תוך זמן קצר השניים מוצאים עצמם נעולים בחדרה, והם נדחקים לפתוח את תיבות הפנדורה שהיו נעולות זמן רב. האם יצליחו להיחלץ מהבדידות ולשנות את מסלול חייהם העגום?') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('קצר לילדים', 'קצר-לילדים', 'תיאטרון צוותא', 55, '3 הצגות קצרצרות לילדים', 'מכת כינים
מאת: אן הדר
ההורים של בן ופלאפי מתגרשים ואבא שלהם עובר לבית חדש, וממש קטן קטן.
וכאילו שזה לא מספיק, שניהם נדבקו בכינים ולא מפסיקים לגרד בראש.
חלפון, החבר של בן, טוען שהורים גרושים זו הזדמנות פז לקבל מלא מתנות, תשומת לב מהבנות ולחיות ללא גבולות.
האמנם ?
רונית הגרגרנית
מאת: תומר אברהם
רונית כל הזמן אוצ''ה: אוצ''ה ממתקים, אוצ''ה בובות, אוצ''ה ואוצ''ה ואוצ''ה... בטיול בנמל הוריה אומרים לה בפעם הראשונה, לא!
רונית נבהלת ובורחת. היא פוגשת חתולה ודג זהב ודרכן לומדת להעריך כמה קשה הוריה עובדים כדי לקנות לה את כל מה שהיא אוצ''ה.
נתנו את קולם להורים: דליק ויעל ווליניץ
הרפתקה בחלל
מאת: יערה רשף נהור
מסע בחללית אל כוכב לכת מרוחק משתבש. רגע לפני התרסקות, ילדה בת 10 ורובוט המיועד להריסה, מצילים את החללית ומגלים מהי חברות אמת.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('שותפים לנצח', 'שותפים-לנצח', 'תיאטרון צוותא', 90, 'קומדיה מופרעת על שקרים, חברות ואכזבות, המשלבת מוסיקה חיה ודרמה אישית.', 'יובל גרוסברג, הבעלים של החברה המצליחה ״נעלי בלוטות׳ בע״מ״, עומד לסגור את עסקת חייו - להחתים את הראפר הכי גדול במדינה להיות הפרזנטור של החברה. אבל רגע לפני החתימה, פורץ למשרד דור שמעוני, חברו הטוב מהילדות, לא בא לפרגן.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('שחקן מחפש במה', 'שחקן-מחפש-במה', 'תיאטרון צוותא', 60, 'דרמה קומית על חיפוש הכרה ואהבה לבמה, המפיחה חיים חדשים בשחקן מבוגר.', 'שחקן פנסיונר בורח מבית אבות על מנת לנצל הזדמנות בלתי חוזרת להופיע כשחקן מחליף. בינו לבין הקהל נרקמת ידידות נפלאה, והעמידה בפני קהל ממלאת אותו בעוצמות של אנרגיות חיוביות.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('שיר של אמונה וכפירה', 'שיר-של-אמונה-וכפירה', 'תיאטרון צוותא', 80, 'חוויה תיאטרלית בלתי רגילה המשלבת הומור עם שאלות עמוקות על אמונה ומשמעות החיים.', 'מחזה נונסנס מוזיקלי המוביל את הצופה במסע מבריאת העולם ועד לאחרית הימים. דמויות שונות חוברות יחד למסע קומי ופואטי בעקבות האמונה, עם שאלות קיומיות שיכולות להפתיע.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('תיכון מגשימים', 'תיכון-מגשימים', 'תיאטרון צוותא', 80, 'מחזמר מרהיב המשלב ראפ עם סיפור התבגרות, המציע חיבור ייחודי בין קהל אוהבי תיאטרון והיפ-הופ.', 'מחזמר ראפ המספר את סיפורו של יואב, תלמיד חדש בתיכון, הנקרע בין נאמנות לעצמו לרצון להיות שייך. המופע מציע מוסיקה חיה וטקסטים שנונים באווירת ראפ סוחפת.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description) VALUES ('Mix & Match', 'Mix-&-Match', 'תיאטרון צוותא', 50, 'דרמה מרגשת על זוגיות בעידן הדיגיטלי, המאתגרת את הגבולות בין מסכים למציאות ומביאה את הדמויות למסע של גילוי אינטימיות.', 'הצגה מתארת את מערכת היחסים הנבנית בין גבר ואישה באפליקציית היכרויות, כאשר הם מתמודדים עם האתגרים של האהבה והאמת במפגש עם המציאות.') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אהבה-וחושך' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אהבה-וחושך' AND g.name = 'ישראלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אהבה-וחושך' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אורות-קטנות' AND g.name = 'מחזמר' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אורות-קטנות' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אחינועם-ואני' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אחינועם-ואני' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אחינועם-ואני' AND g.name = 'רומנטי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אירלנד' AND g.name = 'דרמה קומית' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אירלנד' AND g.name = 'ישראלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אמא-שלי-קראה-לי-רוטוויילר' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אני-מכיר-רק-אחד-שמתנהג-ככה' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אסתר' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אסתר' AND g.name = 'מוזיקלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אסתר' AND g.name = 'ישראלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אקורד-סיום-למלחמה' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אקורד-סיום-למלחמה' AND g.name = 'מוזיקלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'ארטיסט' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'ארטיסט' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'ארטיסט' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'בוז׳ולה' AND g.name = 'מוזיקלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'בוז׳ולה' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'בוז׳ולה' AND g.name = 'סאטירה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'גידול-ושמו-בועז-קומדיה-רומנטית-בקטע-דפוק' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'דמות-אב' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'דמות-אב' AND g.name = 'סאטירה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'המופע-הגלוי-של-גל-בנג׳ו-The-Banjo-Show' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'המופע-הגלוי-של-גל-בנג׳ו-The-Banjo-Show' AND g.name = 'דוקומנטרי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הסוף' AND g.name = 'מחזמר' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הסוף' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הסוף' AND g.name = 'מותחן' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'העורף' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'העורף' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הפנס-הסגול' AND g.name = 'ילדים' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'התחנה-האחרונה' AND g.name = 'דרמה קומית' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'זה-בסדר.' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'זה-בסדר.' AND g.name = 'דוקומנטרי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'טובעים-השניים' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'טובעים-השניים' AND g.name = 'אינטימי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'ככה-יצאתי' AND g.name = 'אינטימי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'ככה-יצאתי' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'לדפוק' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'לדפוק' AND g.name = 'סאטירה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מה-שקרה-לנו' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מה-שקרה-לנו' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מה-שקרה-לנו' AND g.name = 'אינטימי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מכתב-הקסם' AND g.name = 'ילדים' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מפי-שמירה-אימבר' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מפי-שמירה-אימבר' AND g.name = 'דוקומנטרי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מצבים-בפוטנציה' AND g.name = 'מוזיקלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מצבים-בפוטנציה' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מקליד-ה...' AND g.name = 'דרמה קומית' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'נישואים-גרעיניים' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'נישואים-גרעיניים' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'סונטת-קרויצר' AND g.name = 'מוזיקלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'סונטת-קרויצר' AND g.name = 'קלאסיקה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'עוברת-בירושה' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'עוברת-בירושה' AND g.name = 'אינטימי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'עוברת-בירושה' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'עצבים' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'עצבים' AND g.name = 'אינטימי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'ערוץ-שטות-עשרה' AND g.name = 'ילדים' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'פאק-בסיסטם' AND g.name = 'אבסורדי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'פימה-ג׳קסון-ולהקתו' AND g.name = 'מוזיקלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'פצעים' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'פצעים' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'קצר-לילדים' AND g.name = 'ילדים' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'שותפים-לנצח' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'שחקן-מחפש-במה' AND g.name = 'דרמה קומית' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'שיר-של-אמונה-וכפירה' AND g.name = 'מוזיקלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'שיר-של-אמונה-וכפירה' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'תיכון-מגשימים' AND g.name = 'מחזמר' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'Mix-&-Match' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'Mix-&-Match' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
