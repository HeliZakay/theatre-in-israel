-- Migration: Add new hashaa shows
-- Generated on 2026-04-19T18:34:42.748Z
-- This migration is idempotent (uses ON CONFLICT DO NOTHING).

-- ============================================================
-- 1. Insert Genres
-- ============================================================
INSERT INTO "Genre" (name) VALUES ('דרמה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('דרמה קומית') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('ילדים') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מוזיקלי') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מותחן') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מחזמר') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('מרגש') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('פנטזיה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קומדיה') ON CONFLICT (name) DO NOTHING;
INSERT INTO "Genre" (name) VALUES ('קלאסיקה') ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. Insert Shows
-- ============================================================
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('אחרי החגים', 'אחרי-החגים', 'תיאטרון השעה הישראלי', 60, 'דרמה מרגשת על שלושה צעירים על הספקטרום האוטיסטי המנסים להשתלב בחברה, אך נתקלים בקשיים ובשקרים המובילים לאסון.', 'שי, נטע ויואל, הנמצאים על הספקטרום האוטיסטי, חולמים לצאת מההוסטל ולעבור לדירה רגילה. ניסיונותיהם להשתלב בחברה מול ניסיונותיה של יעל להסתיר את הקשר בינה ובין אחיה, גורמים לה להסתבך בכדור שלג של שקרים המוביל לאסון. ההצגה פותחת צוהר לעולם של בעלי הצרכים המיוחדים המנסים להשתלב בחברה, על כל חלומותיהם, חששותיהם ותקוותיהם להרגיש שייכים ורצויים.', 'אורי אוריין, אוריה יבלונובסקי / אייל צ''יובנו, אמנון וולף / יפתח קמינר, חן אוחיון, חן גרטי / סיוון מאסט / ספיר רוזנפלד, יהונתן שוורצברג / אורי סממה / נמרוד פלג.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('בגדי המלך החדשים', 'בגדי-המלך-החדשים', 'תיאטרון השעה הישראלי', 60, 'הצגה קסומה ומלאת צבעים המביאה לחיים את הסיפור הקלאסי על בגדי המלך החדשים, עם מסרים על אמת ואומץ.', 'תושבי הממלכה זועמים, המלך המנותק אוהב רק בגדים. העניינים מתחילים להסתבך כשלממלכה מגיעים אבא שמתחזה למעצב בגדים מפורסם, וביתו ששונאת לשקר.

הצגה מרתקת ומלאת הומור, המעודדת את הצופים הצעירים לפתח חשיבה עצמאית ומקורית משל עצמם, ולא לפחד ללכת עם האמת הפנימית שלהם גם אם נראה שאולי לא תתקבל על ידי החברה.', '| אביב ונטורה / נועה באיער , גיא מאור / דן טויטו , דביר מזיא / ליאור אביבי , עודד מנסטר / ארז וייס , גיל קפטן / שמוליק כהן , רן קפלן / עמית מוריס') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('גִּ''ינְגִּ''י', 'גִּ׳ינְגִּ׳י', 'תיאטרון השעה הישראלי', 60, 'הרפתקה בלשית סוחפת על ארבעה ילדים בירושלים המנסים לחשוף גניבה מסתורית וללמוד על מנהיגות אמיתית.', 'בלב ירושלים גרים ארבעה ילדים שונים כל כך – אך מחוברים. כשאביו של מושיק מושעה מתפקידו בעקבות גניבה מסתורית של מדליון עתיק, ג''ינג''י מחליט להקים חבורה סודית כדי לפתור את התעלומה. ההצגה היא הרפתקה בלשית סוחפת, שכולה דמיון, מתח, צחוק ורגש – ובעיקר סיפור התבגרות של ילד שמגלה שמנהיגות אמתית לא מתבטאת בצעקה – אלא בהקשבה.', '| רועי קקון, רועי ואקנין , חגי ויה , מיטל נוטיק , אופיר סול שבבו') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('הדודה שלי מרחוב הנביאים', 'הדודה-שלי-מרחוב-הנביאים', 'תיאטרון השעה הישראלי', 60, 'הצגה קסומה על שלושה אחים המגלים את עולמה המיוחד של הדודה שלהם, ולומדים שיעורים חשובים על כבוד ואמונה.', 'שלושת האחים ירמיהו, אליהו ודבורה הקטנה מגיעים אל הדודה שלהם מרחוב הנביאים, אותה הם כלל לא זוכרים, כדי שתשמור עליהם בזמן שהוריהם נסעו. הם מפחדים ממנה ומחליטים לעשות הכול כדי לחזור הביתה, אך מגלים שהדברים אינם כפי שהם נראים. הדודה מלמדת אותם שיעור חשוב על כבוד הדדי ואמונה עצמית.', ': ליז רביאן / מיטל סלקמן , רועי מעוז , אמיר מרציאנו , תאי לגזיאל , עדי אייזנמן') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('הדייג ודג הזהב', 'הדייג-ודג-הזהב', 'תיאטרון השעה הישראלי', 60, 'מחזה קסום ומלא הומור הממחיש את הסכנות שבחמדנות דרך סיפורו של הדייג ודג הזהב.', 'הסיפור על דג הזהב הממלא משאלות עוסק בחמדנות ללא גבול ותאוות בצע המובילה לאסון. ההצגה היא משל לתקופותינו, הממחיש את השאיפות החומריות והשפעתן על החיים. יחד עם הדמויות, הצופים חווים את שכרון הכוח ואת האסון המתרחש כשאין גבול לתאוות הבצע.', 'אודי בן דוד/יובל ברגר, דוריס נמני, יערה פלציג, יהונתן שוורצברג/גיא עקיבא, ליאור מיכאלי/אורי זעירא, מאיר טולדנו/טל דנינו/איתי צ''מה, פלורנס בלוך/ כרמל קנדל/הדר דדון') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('הכוכבים של סבא', 'הכוכבים-של-סבא', 'תיאטרון השעה הישראלי', 60, 'חגיגה מוסיקלית מרגשת על חברות וארץ ישראל, בליווי שיריה של נורית הירש.', 'חבורת ילדים וסבתא אחת יוצאים לטיול בשבילי ארץ ישראל היפה. ההצגה מלווה בשירי המופת של נורית הירש ומגלה את ערכה של החברות וארץ ישראל הישנה והטובה.', 'מאיה מדג''ר / ירדן גוז, מירב בן שיטרית , אלינור מלמד , איציק מלמד, חנן שוורצברג / עדן אמסילי') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('הנסיך', 'הנסיך', 'תיאטרון השעה הישראלי', 60, 'הרפתקה מוסיקלית צבעונית על נסיך המגלה את כוחותיו הפנימיים בדרך למלוכה.', 'פנטזיה צבעונית ומוסיקלית לכל המשפחה! הנסיך ניל, המיועד להחליף את אביו, מתמודד עם חששותיו ומגמגומו בדרך למלוכה. סיפורו מלמד על כוח פנימי, התמודדות ורצון להתגבר על אתגרים.', '| ארז וייס, גבריאל דמידוב / ליאור מורדוך , גיל וייס / דן פרידמן , עמית פרטוק, אמיר בנאי') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('הענק וגנו', 'הענק-וגנו', 'תיאטרון השעה הישראלי', 60, 'הצגה מרהיבה המפיחה חיים בסיפור הקלאסי של אוסקר ווילד, חקר של אהבה, קבלה והחיים בגינה קסומה.', 'זה הוא סיפור על ידידות מופלאה ומפתיעה בין ילד קטן ורגיש לבין ענק שלמראית עין נראה מפחיד אך בתוך תוכו עדין וחושש מפני הילדים.
חום ליבו ותבונתו של הילד ימיסו גם את ליבו הקפוא של הענק  - וגנו של הענק יהפוך לגן המשחקים של כל ילדי השכונה.
זו הצגה מלאת רגש והומור המוכיחה שמי ששופט לפי מראה חיצוני עלול להפסיד חבר אמיתי וכי טוב לב ודאגה לזולת היא המתכון הטוב ביותר לידידות אמיתית.', 'של כל ילדי השכונה., זו הצגה מלאת רגש והומור המוכיחה שמי ששופט לפי מראה חיצוני עלול להפסיד חבר אמיתי וכי טוב לב ודאגה לזולת היא המתכון הטוב ביותר לידידות אמיתית.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('הקוסם מארץ עוץ | המחזמר', 'הקוסם-מארץ-עוץ-המחזמר', 'תיאטרון השעה הישראלי', 60, 'מחזמר מרהיב שמביא את הקסם של ארץ עוץ לחיים, עם דמויות בלתי נשכחות והרפתקאות מרגשות.', 'ההצגה מספרת את סיפורם של דורותי, ילדה מתוקה ותמימה וטוטו כלבה האהוב, הנסחפים בעקבות סופת ציקלון לארץ עוץ הרחוקה והקסומה.
דורותי, שכל רצונה הוא לחזור הביתה, פוגשת מכשפה טובה המייעצת לה ללכת אל הקוסם הגדול מעיר הברקת בתקווה שיוכל להגשים את משאלתה לחזור אל משפחתה.

הדרך לקוסם הופכת למסע הרפתקאות בארץ פנטזיה.
במהלכה פוגשת דורותי דמויות מצחיקות ומרגשות המבקשות להיעזר ביכולותיו של הקוסם להגשים את משאלות ליבן:
קשי – הדחליל החביב וחסר המוח, שכל רצונו הוא לזכות בחכמה.
פחי – איש הפח החולם לזכות בלב כדי להרגיש ולאהוב.
אריה – האריה הפחדן שמחפש אומץ.

מסעם של החברים רצוף מכשולים, ובמהלכו יילמדו על חברות, עזרה לזולת, טוב לב ואהבת הבית והמשפחה.
מה מצפה להם בעיר הברקת? מה יגלו על הקוסם מארץ עוץ? האם יצליחו להגשים את משאלותיהם?
', 'אור משיח/ חנן שוורצברג, גיא עקיבא/ עדן אמסילי, דניאל סבג, סיון קינר קיסינג''ר, אבירם קליך, עודד מנסטר/ מוטי וסרמן, נעמה פורת/ תמר עמית יוסף.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('יותר מסיפור אחד', 'יותר-מסיפור-אחד', 'תיאטרון השעה הישראלי', 60, 'דרמה מוסיקלית מרגשת על חברות בלתי צפויה בין לוחם פצוע לנער עם חלומות, המציעה מסר של זהות והזדמנות שנייה.', 'שאול, מפקד ביחידת 669 שנפצע במלחמה ומרותק לכיסא גלגלים,
פוגש את אמיר – תלמיד שמתקשה להסתדר עם המסגרת, מסתבך בגניבה והופך בעל כורחו לעוזר/מטפל של שאול.
בין עימותים, הומור ומוזיקה נחשפות שכבות שלא רואים מבחוץ: שאול הוא לא רק לוחם פצוע אלא גם אדם שנלחם על הזכות לאהבה,
ואמיר הוא לא רק נער עם קשיי תפקוד במסגרות אלא גם אמן עם לב גדול ושירים שמבקשים להישמע.
מחזה מרגש לנוער על זהות והזדמנות שנייה – ועל הרגע שבו מבינים שכל אחד מאיתנו הוא יותר מסיפור אחד.

 
בשילוב שיריהם האהובים של אמיר דדון , בניה ברבי ואברהם טל , טונה ועוד .. 

 ', '| אמיר קריאף , יניב גרוטס , אורי סדן ורפאל ואקנין') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('כובע קסמים', 'כובע-קסמים', 'תיאטרון השעה הישראלי', 60, 'הצגה קסומה המבוססת על ספרה של לאה גולדברג, המפגישה את הילדים עם הכוח של חלומות וקסמים.', 'איילת יוצאת להרפתקה מוסיקלית וצבעונית, בה היא לומדת שלעולם אסור לוותר על החלומות שלנו.', '| אביב ונטורה , מאיה מדג''ר , דביר מזיא , לירן מזרחי , גיא עקיבא') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('מעשה בשלושה אגוזים', 'מעשה-בשלושה-אגוזים', 'תיאטרון השעה הישראלי', 60, 'הצגה מוסיקלית חדשה המציעה חוויות מרגשות ועולמות קסומים, בהשראת הקלאסיקה האהובה.', '"מעשה בשלושה אגוזים
ובהם שלשה סודות ורזים
והיה - כל מי יפתור את סודם
אין כמותו מאשר בעולם".

בעזרת הילד אורי מצליחה לאה גולדברג לפרוץ את מחסום הכתיבה העוצר בעדה . 
שניהם יוצאים למסע בלשי ליער האגדות בו הם פוגשים את פיסוקי הגמד , סאני הסנאי ושפע רב של דמויות ססגוניות מהאגדות .
ביחד הם מגלים את כוחה של החברות ושהאושר נמצא ברגעים הקטנים והפשוטים הממלאים את ליבנו בפנים.

', '| שירן הוברמן , דביר מזיא , גיא בירגר , ניצן ליבוביץ , שגיא פומרנץ') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('פצפונת ואנטון', 'פצפונת-ואנטון', 'תיאטרון השעה הישראלי', 60, 'עיבוד מרגש לקלאסיקה של אריך קסטנר, חוקר את כוחות החברות והקבלה על רקע פערים חברתיים.', 'פצפונת היא ילדה רבת דמיון, סקרנית וטובת לב, שבאה ממשפחה עשירה. אנטון הוא ילד אחראי ושרדן, שבא ממשפחה ענייה ומטפל במסירות באמו החולה.

על רקע סיפור עלילה מותח ורב תהפוכות צומח סיפור החברות המופלא של פצפונת ואנטון. חברות שגוברת על פערים חברתיים ודעות קדומות ומלמדת אותנו שיעור חשוב באהבת אדם באשר הוא אדם.

ההצגה היא עיבוד לקלאסיקה המפורסמת ביותר של אריך קסטנר, שהיוותה השראה לילדים בכל העולם.

', 'אביב כרמי/ רונית אפל, דביר מזיא, הדר ברנשטיין, מאיה מדג''ר, מורדי גרשון/ איתי חיון, ניל משען, תומר ברש.') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('פרידות בע"מ', 'פרידות-בע-מ', 'תיאטרון השעה הישראלי', 75, 'קומדיה מפתיעה על פרידות לא צפויות, בהן איתן מתמודד עם אתגרים בלתי צפויים במהלך משימתו.', 'איתן, בעל חברת ''פרידות בע"מ'', מקבל משימה למסור הודעת פרידה בשם לקוח חדש. אך כאשר הוא מגיע לדירה, הוא נתקל בהפתעה לא צפויה.', 'עדי הימלבלוי , גיא אריאלי ודניאל סבג') ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast") VALUES ('שכונת חיים', 'שכונת-חיים', 'תיאטרון השעה הישראלי', 60, 'עיבוד תיאטרלי מרגש לסדרה המצליחה, חוגג חברות, מוזיקה וערכים בשכונה חמה.', 'הקלאסיקה האהובה „שכונת חיים”, על פי הסדרה המצליחה, מגיעה לבמה בעיבוד תיאטרלי חי ומרגש.
אלה מגיעה בעל כורחה לבלות את הקיץ אצל סבא שלה בשכונת חיים — ומה שנראה כמו הדבר האחרון שרצתה, הופך למסע של גילוי הקסם שבשכונה, בקהילה ובמועדון אחד שמאחד את כולם.
שכונה אחת, דמויות בלתי נשכחות וחגיגה סוחפת של חברות, מוזיקה וערכים שכולנו גדלנו עליהם.
', 'פיני קידרון / מיכאל כורש , מור ענטר , וורקו מקונן , ים טנא ולנסי , אביב ונטורה') ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 3. Insert ShowGenre join records
-- ============================================================
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אחרי-החגים' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'אחרי-החגים' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'בגדי-המלך-החדשים' AND g.name = 'קלאסיקה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'בגדי-המלך-החדשים' AND g.name = 'פנטזיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'בגדי-המלך-החדשים' AND g.name = 'ילדים' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'גִּ׳ינְגִּ׳י' AND g.name = 'ילדים' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'גִּ׳ינְגִּ׳י' AND g.name = 'מותחן' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הדודה-שלי-מרחוב-הנביאים' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הדודה-שלי-מרחוב-הנביאים' AND g.name = 'ילדים' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הדייג-ודג-הזהב' AND g.name = 'ילדים' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הדייג-ודג-הזהב' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הכוכבים-של-סבא' AND g.name = 'מוזיקלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הכוכבים-של-סבא' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הכוכבים-של-סבא' AND g.name = 'ילדים' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הנסיך' AND g.name = 'מוזיקלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הנסיך' AND g.name = 'פנטזיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הנסיך' AND g.name = 'ילדים' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הענק-וגנו' AND g.name = 'קלאסיקה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הענק-וגנו' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הענק-וגנו' AND g.name = 'ילדים' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הקוסם-מארץ-עוץ-המחזמר' AND g.name = 'מחזמר' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הקוסם-מארץ-עוץ-המחזמר' AND g.name = 'פנטזיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'הקוסם-מארץ-עוץ-המחזמר' AND g.name = 'ילדים' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'יותר-מסיפור-אחד' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'יותר-מסיפור-אחד' AND g.name = 'מוזיקלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'כובע-קסמים' AND g.name = 'ילדים' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'כובע-קסמים' AND g.name = 'מוזיקלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מעשה-בשלושה-אגוזים' AND g.name = 'מוזיקלי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'מעשה-בשלושה-אגוזים' AND g.name = 'ילדים' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'פצפונת-ואנטון' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'פצפונת-ואנטון' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'פרידות-בע-מ' AND g.name = 'קומדיה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'פרידות-בע-מ' AND g.name = 'דרמה קומית' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'שכונת-חיים' AND g.name = 'דרמה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, g.id FROM "Show" s, "Genre" g WHERE s.slug = 'שכונת-חיים' AND g.name = 'מרגש' ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Reset sequences
-- ============================================================
SELECT setval(pg_get_serial_sequence('"Show"', 'id'), (SELECT MAX(id) FROM "Show"));
SELECT setval(pg_get_serial_sequence('"Genre"', 'id'), (SELECT MAX(id) FROM "Genre"));
