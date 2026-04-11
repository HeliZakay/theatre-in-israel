-- Recovery migration: re-insert 20 shows wrongly deleted by ID-based migration,
-- then delete 21 remaining target shows using slugs.

-- ============================================================
-- PART 1: Re-insert 20 shows wrongly deleted from production
-- (ON CONFLICT DO NOTHING makes this safe if already present)
-- ============================================================

INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast", "webReviewSummary", "avgRating", "reviewCount") VALUES ('?Can you beat the KGB', 'Can-you-beat-the-KGB', 'תיאטרון תמונע', 120, 'אירוע תיאטרוני חתרני המשלב משחק שולחן, בו הקהל מתמודד עם שאלות מוסריות ויוצר רשת סוכנים למען חברה טובה יותר.', 'משחק שולחן השתתפותי בעקבות חייו ומותו של אלכסיי נבלני. באירוע תיאטרוני חתרני בשיתוף הקהל נתחקה אחרי פעולותיו ונבצע משימות שכל אחת מהן תקרב אותנו אל המטרה – הקמת רשת סוכנים לבניית חברה סולידרית, הפועלת בכבוד, צדק ואהבה.', NULL, NULL, 4, 1) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast", "webReviewSummary", "avgRating", "reviewCount") VALUES ('לא סוף העולם', 'לא-סוף-העולם', 'תיאטרון תמונע', 75, 'פנטזיה רומנטית על מורה שמתאהב בתלמידה לשעבר, במסע מדעי להוכחת תיאוריה על העולם השטוח.', 'מיכאל, מורה למדעים, מתאהב בנועה, תלמידה לשעבר, המאוהבת בכוכב רשת. הם יוצאים למסע אל סוף העולם כדי להוכיח שהעולם שטוח, בעוד זוהר שואף לקריירה פוליטית. ההצגה מציעה פנטזיה רומנטית עם נגיעות מדעיות.', 'מעין בלום, אברהם סלקטר, מעין קילצ''בסקי ותמיר גינזבורג', NULL, 3, 1) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast", "webReviewSummary", "avgRating", "reviewCount") VALUES ('שיר של אמונה וכפירה', 'שיר-של-אמונה-וכפירה', 'תיאטרון האינקובטור', 80, 'חוויה תיאטרלית בלתי רגילה המשלבת הומור עם שאלות עמוקות על אמונה ומשמעות החיים.', 'מחזה נונסנס מוזיקלי המוביל את הצופה במסע מבריאת העולם ועד לאחרית הימים. דמויות שונות חוברות יחד למסע קומי ופואטי בעקבות האמונה, עם שאלות קיומיות שיכולות להפתיע.', 'עמרי הכהן, אילון פרבר, רני אלון, שרי עציץ, עידו גולן ואוריה ג''ורג''י', NULL, 0, 0) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast", "webReviewSummary", "avgRating", "reviewCount") VALUES ('הכל נשאר חי', 'הכל-נשאר-חי', 'תיאטרון תמונע', 60, 'הכל נשאר חי הוא סיפור אינטימי על אהבה והתמודדות עם פוסט טראומה, המציע מבט ייחודי על ההשפעה של מלחמה על הלוחם ובני משפחתו.', 'אישה אוהבת יוצאת למסע למצוא תרופה לבעלה ששב זועף משדה הקרב. דרך אגדה יפנית עתיקה, ההצגה עוסקת בטראומה משנית ומציעה מבט ייחודי על פוסט טראומה דרך עיניה של בת הזוג.', NULL, NULL, 4, 1) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast", "webReviewSummary", "avgRating", "reviewCount") VALUES ('איך ג''ירפה ישנה', 'איך-ג׳ירפה-ישנה', 'תיאטרון גשר', 50, 'הצגה קסומה לילדים על אהבה בלתי אפשרית בין ג''ירפה לקרנף, שמגלה את כוחות הקסם והתקווה בעולם מלא הבדלים.', 'סיפור על אהבה בלתי אפשרית בין ג''ירפה לקרנף בסוואנה של אפריקה. המפגש הראשון בין השניים מתגלה כמאתגר בשל ההבדלים העצומים ביניהם, אך הם מוצאים פתרון שיאפשר להם להיפגש.', NULL, NULL, 3, 2) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast", "webReviewSummary", "avgRating", "reviewCount") VALUES ('אסתר', 'אסתר', 'תיאטרון האינקובטור', 70, 'קומדיה אוטוביוגרפית-מוסיקלית על מסע של אישה כל הדרך מפסגת זאב לפסגה', 'לא בכל יום מחפשים את “עופרה חזה”. בדרך כלל מחפשים “לייזה”, או “ג’ני” או “מאשה”.
זאת ההזדמנות של אסתר. זה האודישן הראשון שבו התלתלים שלה הם נכס ולא בלת”ם.
בחדר מחכות כבר 900 בנות שחרחרות, מתולתלות, בשמלות פרחוניות ועגילי נחושת. מהבמה ניתן לשמוע ביצוע של “לאורך הים”.
ואז עוד ביצוע של “לאורך הים”.
40 ביצועים ברצף. “לאורך הים”.
מה לא עושים בשביל תפקיד.

והרי יש את הקול הזה מילדות שלוחש “לשם את שייכת…”, ורוח גבית שדוחפת ללהקה צבאית, לכוכב נולד, לרילוקיישן, לעשות ילדים, לברוח ממלחמות או להיות יוליה.
משהו כל הזמן קורא, ועדיין זה לא קורה.
והכל יקרה עוד רגע, ובסוף זאת עדיין אותה אסתר, בסלון בפסגת זאב, מנסה להצחיק את אבא.', NULL, NULL, 4, 1) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast", "webReviewSummary", "avgRating", "reviewCount") VALUES ('האמת', 'האמת', 'תיאטרון באר שבע', 75, 'קומדיה חדה וסקסית על סודות ושקרים בחיים, מאת המחזאי הצרפתי פלוריאן זלר.', 'מישל מנהל רומן עם אליס, נשואה לפול, חברו הטוב. החבורה מסתבכת בשקרים ואמיתות, והשאלה היא האם לשקר זה דבר רע.', NULL, NULL, 4, 1) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast", "webReviewSummary", "avgRating", "reviewCount") VALUES ('הסוף', 'הסוף', 'תיאטרון צוותא', 120, 'מחזמר מצחיק ומותח על מדען הנלחם נגד המוות במטרה להציל את אהובתו, תוך חקירה של החיים והמוות.', 'מדען גאון ושבור לב משתף פעולה עם המוות בכבודו ובעצמו בשביל למצוא פתרון לחיי נצח ולהציל את חייה של אהובתו.', 'עידן אלתרמן, ג׳וי ריגר / דנה פרידר, אבי דנגור, הראל ליסמן / עמית רייס , רפאל עבאס , מרב צברי / עופרי סלומון, אביב הורוביץ, גיא וינטרוב / אלעד פרץ, אלעד טל / דורון ברנס', NULL, 0, 0) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast", "webReviewSummary", "avgRating", "reviewCount") VALUES ('לילה – סיפורה של לילה מוראד', 'לילה-–-סיפורה-של-לילה-מוראד', 'תיאטרון בית ליסין', 75, 'סיפור חייה של לילה מוראד, כוכבת קולנוע וזמרת, המשלב בין נוסטלגיה למוזיקה מרגשת.', 'דרמה מוזיקלית בהשראת חייה של לילה מוראד, כוכבת-על יהודייה במצרים. הסיפור נוגע בתהילה, השבר והבחירות שהובילו אותה עד הלום, עם מוזיקה משיריה וקטעי שירה חיה על הבמה.', 'יפה תוסיה כהן, אסף אברהם ניב', NULL, 0, 0) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast", "webReviewSummary", "avgRating", "reviewCount") VALUES ('פימה ג''קסון ולהקתו', 'פימה-ג׳קסון-ולהקתו', 'תיאטרון צוותא', 60, 'פימה ג''קסון ולהקתו היא מופע מוזיקלי מרגש על חברות ואתגרים, המשלב קאברים ברוסית עם סיפור מרתק.', 'להקה של וובה, ולדי ופימה מבצעת קאברים איכותיים ברוסית לשירי פופ מוכרים. כאשר מכשף מעניק לפימה מתנה מסתורית, מאזן הכוחות בלהקה מתערער.', NULL, NULL, 3, 1) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast", "webReviewSummary", "avgRating", "reviewCount") VALUES ('בילבי', 'בילבי', 'תיאטרון תמונע', 60, 'הצגה קסומה על אחים שמגלים את הכוח של דמיון וחברות דרך בילבי, ילדה שמביאה צבע לעולם האפור שלהם.', 'טומי ואנה, שני אחים בעולם שחור לבן, פוגשים את בילבי, ילדה מצחיקה עם קוף מדבר, שמביאה צבע לחייהם ופותחת בפניהם עולם של הרפתקאות ודמיון.', 'מאיה ליבני, יובל קנין נחמיאס / נדב ארטשיק, עדי שור', NULL, 4.5, 2) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast", "webReviewSummary", "avgRating", "reviewCount") VALUES ('לדפוק', 'לדפוק', 'תיאטרון צוותא', 70, 'לדפוק היא קומדיה שנונה על גוף האדם, המשלבת הומור עם ביקורת חברתית על החיים המודרניים והאתגרים הבריאותיים.', 'ברוכים הבאים לגוף האדם. שלומי הוא גבר בן 53 עם הרגלי חיים מפוקפקים. האיברים הפנימיים שלו מנהלים ביניהם יחסים טעונים, בזמן שהמתח בגוף גובר. קומדיה פרועה המגלגלת אותנו במדרון הבריאותי של שלומי ומציעה מבט אחר על הגוף האנושי כמיקרוקוסמוס של חברה על סף קריסה.', NULL, NULL, 3, 1) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast", "webReviewSummary", "avgRating", "reviewCount") VALUES ('כשאמא באה הנה - אריאל הורוביץ ו״האחיות שמר 24״', 'כשאמא-באה-הנה-אריאל-הורוביץ-ו״האחיות-שמר-24״', 'תיאטרון חיפה', 80, 'אריאל הורוביץ ו״האחיות שמר 24״ שרים ומספרים נעמי שמר', 'המוזיקאי והיוצר אריאל הורוביץ במסע מוזיקלי מרגש מלא באהבה, געגוע ואופטימיות במחוזות היצירה של אימו המלחינה והמשוררת נעמי שמר, בסדרת מופעים משיריה שעיצבו את פס הקול הישראלי המשותף לכולנו.
המופע, הוא דיאלוג מוזיקלי בין הורוביץ, בנה של נעמי שמר, לקבוצה נבחרת של זמרות יוצרות מהדור הצעיר בארץ שמרכיבות יחד את ״האחיות שמר 24״.
הורוביץ, עם ההומור האופייני לו, נותן הצצה לסיפורים האישיים שמאחורי שיריה של אימו ויחד עם הלהקה, הם מצדיעים לשמר, בפרשנות עכשווית לשיריה, כפי שהיתה רוצה לשמוע את השירים שלה ב – 2025 ועם זאת מאפשרת לקהל להצטרף, לשיר, לצחוק, להתגעגע ולהרגיש ש"ארץ ישראל האבודה והיפהפייה והנשכחת", הנוכחת כל כך בשיריה של נעמי בכל זאת איננה אבודה.
המופע ״כשאימא באה הנה״ מאפשר לנו להתרפק על שמר היוצרת ובאותו הזמן להכיר את נעמי הפרטית.
השם "האחיות שמר 24" מהדהד את הרכב הנשים החלוצי שהקימה שמר באמצע שנות השישים.
אור אדרי, דניאל רובין, קרן טננבאום, נילי פינק ועינת הראל, הן מהזמרות היוצרות והמוזיקאיות הצעירות הבולטות והמקוריות בדורן ויחד - כלהקת הבית של המופע, הן מביאות לבמה את הרוח הנשית המהפכנית והרעננה שהביאה נעמי שמר בזמנה למוזיקה הישראלית כולה.

זכרונות הילדות והסיפורים מאחורי השירים: אריאל הורוביץ', NULL, NULL, 0, 0) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast", "webReviewSummary", "avgRating", "reviewCount") VALUES ('קסמים בשחקים', 'קסמים-בשחקים', 'תיאטרון תמונע', 60, 'מופע קסמים וקרקס המשלב אשליות מרהיבות ולוליינות, המוביל את הקהל לעולם לא מוכר שבו ההגיוני והלא הגיוני מתערבבים.', 'ברוכים הבאים לעולם האשליות! עולם שבו ההגיוני נהיה לא הגיוני, והלא הגיוני הופך למציאות. רק קוסם עם רגליים על הקרקע ופייה מתעופפת, שלא ממש מסתדרים ביניהם, יצליחו לגרום לכם לא ללכת לגמרי לאיבוד. הצטרפו אלינו למסע קסום וקרקסי בין אשליות מופלאות ולוליינות מפעימה.', NULL, NULL, 4, 1) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast", "webReviewSummary", "avgRating", "reviewCount") VALUES ('מצבים בפוטנציה', 'מצבים-בפוטנציה', 'תיאטרון צוותא', 90, 'מופע מוזיקלי המשלב שירה ודיבור, חוקר את מורכבות האהבה והאובדן בעזרת שירים מוכרים וטקסטים נוגעים ללב.', 'מופע מהורהר, מצחיק ומרגש המבוסס על קטעים מתוך ספריו של בני ברבש. הוא עוסק באהבה ושכול, עם שירים מפנתיאון הקלאסיקה הישראלית וטקסטים מרגשים.', NULL, NULL, 2, 1) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast", "webReviewSummary", "avgRating", "reviewCount") VALUES ('ארטיסט', 'ארטיסט', 'תיאטרון צוותא', 60, 'הצגת יחיד כנה ומרגשת על אתגרי החיים של אדם עם תסמונת אספרגר, המשלבת הומור ודרמה במסע של קבלה והעצמה.', 'בהצגת היחיד החדשה שלו, עמרי לייבוביץ'', שחקן ויוצר, המאובחן עם תסמונת אספרגר, מגלם את עצמו ומספר בגוף ראשון, בשפה ישירה וכנה, על האתגרים האישיים והחברתיים שמלווים אותו. עמרי שוזר רגעים דרמטיים ונוגעים ללב באתנחתות של הומור ואופטימיות. הוא מחפש בת זוג, נזכר באהבה הראשונה, חולם על העתיד וגם עוסק במפגש המורכב שלו עם סביבתו. דרך סיפורו האישי, הוא מתמודד עם קבלת האבחנה ומראה לנו את ההיבטים החיוביים שבהיותו מיוחד.', NULL, NULL, 0, 0) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast", "webReviewSummary", "avgRating", "reviewCount") VALUES ('לאונרד', 'לאונרד', 'תיאטרון תמונע', 70, 'לאונרד הוא מופע תיאטרוני מרגש המשלב שירה וכתיבה של לאונרד כהן, המציע מבט מעמיק על חייו ועל השפעתם על התרבות.', 'מסע אל תוך הכתיבה של לאונרד כהן המשורר, שמציג את חייו וחוויותיו דרך שיריו המוכרים, ומזמין את הקהל להרהר במלחמות, אהבה ואלוהים.', NULL, NULL, 4, 2) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast", "webReviewSummary", "avgRating", "reviewCount") VALUES ('הגבירה מאבו דיס', 'הגבירה-מאבו-דיס', 'תיאטרון תמונע', 90, 'ערב הוקרה מרגש למנטורית התיאטרון נירה לילי רוסו, המשלב קטעים נבחרים מיצירותיה ומזמין את הקהל למסע חווייתי ומרגש.', 'בערב הוקרה מרגש, השחקנית חדווה לוי־גושן מציגה קטעים נבחרים מיצירותיה של המנטורית נירה לילי רוסו, חוגגת ארבעה עשורים של יצירה תיאטרונית, ומזמינה את הקהל למסע אל תת המודע הקולקטיבי.', 'עדילי ליברמן, נדב בושם, אורה מאירסון וליאם שניצר', NULL, 0, 0) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast", "webReviewSummary", "avgRating", "reviewCount") VALUES ('יהושולה', 'יהושולה', 'תיאטרון תמונע', 70, 'הצגה ייחודית על זוג פנסיונרים המגלים את הסדקים בזוגיותם, באמצעות מסכות ובובות, ללא מילים.', 'זוג פנסיונרים חווים שגרה אינטימית עד שהמציאות פורצת לעולמם. הסדקים ביניהם נחשפים דרך מסכות ובובות, ללא מילים. ההצגה נוגעת בנושאים של זוגיות, כאב ותשוקה, ומביאה לקהל חוויה רגשית עמוקה.', NULL, NULL, 4, 1) ON CONFLICT (slug) DO NOTHING;
INSERT INTO "Show" (title, slug, theatre, "durationMinutes", summary, description, "cast", "webReviewSummary", "avgRating", "reviewCount") VALUES ('מיינדפאק', 'מיינדפאק', 'תיאטרון צוותא', 60, 'אורית זפרן במופע קומי-דרמטי על ניצחון אישי, חקירת זהות ושורשים משפחתיים, המשלב צחוק עם רגעים נוגעים ללב.', 'מופע המשלב סטנד אפ וסטנד דאון, בו אורית זפרן חוגגת את ניצחונה על הנאצים, פושטת את זהותה כדור שני לשואה ומביאה זכרונות משפחתיים תוך כדי חקירה של נשיות ואמהות.', 'אורית זפרן', NULL, 3, 1) ON CONFLICT (slug) DO NOTHING;

-- Genres for recovered shows
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 8 FROM "Show" s WHERE s.slug = 'Can-you-beat-the-KGB' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 5 FROM "Show" s WHERE s.slug = 'Can-you-beat-the-KGB' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 14 FROM "Show" s WHERE s.slug = 'לא-סוף-העולם' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 11 FROM "Show" s WHERE s.slug = 'לא-סוף-העולם' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 5 FROM "Show" s WHERE s.slug = 'לא-סוף-העולם' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 7 FROM "Show" s WHERE s.slug = 'שיר-של-אמונה-וכפירה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 1 FROM "Show" s WHERE s.slug = 'שיר-של-אמונה-וכפירה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 3 FROM "Show" s WHERE s.slug = 'הכל-נשאר-חי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 34 FROM "Show" s WHERE s.slug = 'הכל-נשאר-חי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 5 FROM "Show" s WHERE s.slug = 'הכל-נשאר-חי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 11 FROM "Show" s WHERE s.slug = 'איך-ג׳ירפה-ישנה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 10 FROM "Show" s WHERE s.slug = 'איך-ג׳ירפה-ישנה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 7 FROM "Show" s WHERE s.slug = 'אסתר' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 1 FROM "Show" s WHERE s.slug = 'אסתר' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 2 FROM "Show" s WHERE s.slug = 'אסתר' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 5 FROM "Show" s WHERE s.slug = 'האמת' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 7 FROM "Show" s WHERE s.slug = 'האמת' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 4 FROM "Show" s WHERE s.slug = 'הסוף' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 7 FROM "Show" s WHERE s.slug = 'הסוף' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 12 FROM "Show" s WHERE s.slug = 'הסוף' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 5 FROM "Show" s WHERE s.slug = 'לילה-–-סיפורה-של-לילה-מוראד' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 3 FROM "Show" s WHERE s.slug = 'לילה-–-סיפורה-של-לילה-מוראד' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 1 FROM "Show" s WHERE s.slug = 'לילה-–-סיפורה-של-לילה-מוראד' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 1 FROM "Show" s WHERE s.slug = 'פימה-ג׳קסון-ולהקתו' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 1 FROM "Show" s WHERE s.slug = 'בילבי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 10 FROM "Show" s WHERE s.slug = 'בילבי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 7 FROM "Show" s WHERE s.slug = 'לדפוק' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 8 FROM "Show" s WHERE s.slug = 'לדפוק' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 2 FROM "Show" s WHERE s.slug = 'כשאמא-באה-הנה-אריאל-הורוביץ-ו״האחיות-שמר-24״' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 1 FROM "Show" s WHERE s.slug = 'כשאמא-באה-הנה-אריאל-הורוביץ-ו״האחיות-שמר-24״' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 11 FROM "Show" s WHERE s.slug = 'קסמים-בשחקים' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 10 FROM "Show" s WHERE s.slug = 'קסמים-בשחקים' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 1 FROM "Show" s WHERE s.slug = 'מצבים-בפוטנציה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 5 FROM "Show" s WHERE s.slug = 'מצבים-בפוטנציה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 3 FROM "Show" s WHERE s.slug = 'ארטיסט' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 7 FROM "Show" s WHERE s.slug = 'ארטיסט' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 5 FROM "Show" s WHERE s.slug = 'ארטיסט' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 3 FROM "Show" s WHERE s.slug = 'לאונרד' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 5 FROM "Show" s WHERE s.slug = 'הגבירה-מאבו-דיס' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 3 FROM "Show" s WHERE s.slug = 'הגבירה-מאבו-דיס' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 5 FROM "Show" s WHERE s.slug = 'יהושולה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 3 FROM "Show" s WHERE s.slug = 'יהושולה' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 34 FROM "Show" s WHERE s.slug = 'מיינדפאק' ON CONFLICT DO NOTHING;
INSERT INTO "ShowGenre" ("showId", "genreId") SELECT s.id, 7 FROM "Show" s WHERE s.slug = 'מיינדפאק' ON CONFLICT DO NOTHING;

-- Actors for recovered shows
INSERT INTO "Actor" (name, slug) VALUES ('ג׳וי ריגר', 'ג׳וי-ריגר') ON CONFLICT (name) DO NOTHING;
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s.id, a.id FROM "Show" s, "Actor" a WHERE s.slug = 'הסוף' AND a.name = 'ג׳וי ריגר' ON CONFLICT DO NOTHING;
INSERT INTO "Actor" (name, slug) VALUES ('רפאל עבאס', 'רפאל-עבאס') ON CONFLICT (name) DO NOTHING;
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s.id, a.id FROM "Show" s, "Actor" a WHERE s.slug = 'הסוף' AND a.name = 'רפאל עבאס' ON CONFLICT DO NOTHING;
INSERT INTO "Actor" (name, slug) VALUES ('עידן אלתרמן', 'עידן-אלתרמן') ON CONFLICT (name) DO NOTHING;
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s.id, a.id FROM "Show" s, "Actor" a WHERE s.slug = 'הסוף' AND a.name = 'עידן אלתרמן' ON CONFLICT DO NOTHING;

-- ============================================================
-- PART 2: Delete 21 target shows still remaining on production
-- ============================================================

DELETE FROM "Review" WHERE "showId" IN (
  SELECT id FROM "Show" WHERE slug IN (
    'החברות-של-אלוהים',
    'אין-לי-ארץ-אחרת-מופע-הצדעה-לאהוד-מנור',
    'אהבה-וחושך',
    'אמא-שלי-קראה-לי-רוטוויילר',
    'אקורד-סיום-למלחמה',
    'דמות-אב',
    'העורף',
    'מפי-שמירה-אימבר',
    'עצבים',
    'שחקן-מחפש-במה',
    'Mix-Match',
    'אדום',
    'דירה-לא-להשכיר',
    'הפצוע-הישראלי',
    'כביסה-מלוכלכת-TAKE-3',
    'לא-שקט',
    'מהפכניות',
    'According-to-Law',
    'דיסקו,-בייבי-!',
    'Mamachine',
    'את-מדברת.-אני-מדברת'
  )
);

DELETE FROM "Watchlist" WHERE "showId" IN (
  SELECT id FROM "Show" WHERE slug IN (
    'החברות-של-אלוהים',
    'אין-לי-ארץ-אחרת-מופע-הצדעה-לאהוד-מנור',
    'אהבה-וחושך',
    'אמא-שלי-קראה-לי-רוטוויילר',
    'אקורד-סיום-למלחמה',
    'דמות-אב',
    'העורף',
    'מפי-שמירה-אימבר',
    'עצבים',
    'שחקן-מחפש-במה',
    'Mix-Match',
    'אדום',
    'דירה-לא-להשכיר',
    'הפצוע-הישראלי',
    'כביסה-מלוכלכת-TAKE-3',
    'לא-שקט',
    'מהפכניות',
    'According-to-Law',
    'דיסקו,-בייבי-!',
    'Mamachine',
    'את-מדברת.-אני-מדברת'
  )
);

DELETE FROM "Show" WHERE slug IN (
  'החברות-של-אלוהים',
  'אין-לי-ארץ-אחרת-מופע-הצדעה-לאהוד-מנור',
  'אהבה-וחושך',
  'אמא-שלי-קראה-לי-רוטוויילר',
  'אקורד-סיום-למלחמה',
  'דמות-אב',
  'העורף',
  'מפי-שמירה-אימבר',
  'עצבים',
  'שחקן-מחפש-במה',
  'Mix-Match',
  'אדום',
  'דירה-לא-להשכיר',
  'הפצוע-הישראלי',
  'כביסה-מלוכלכת-TAKE-3',
  'לא-שקט',
  'מהפכניות',
  'According-to-Law',
  'דיסקו,-בייבי-!',
  'Mamachine',
  'את-מדברת.-אני-מדברת'
);
