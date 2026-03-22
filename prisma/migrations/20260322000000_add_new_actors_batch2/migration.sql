-- Add new actors (batch 2)
INSERT INTO "Actor" ("name", "slug", "image") VALUES ('איה גרניט שבא', 'איה-גרניט-שבא', '/actors/איה-גרניט-שבא.webp') ON CONFLICT ("name") DO UPDATE SET "slug" = EXCLUDED."slug", "image" = EXCLUDED."image";
INSERT INTO "Actor" ("name", "slug", "image") VALUES ('אלון אופיר', 'אלון-אופיר', '/actors/אלון-אופיר.webp') ON CONFLICT ("name") DO UPDATE SET "slug" = EXCLUDED."slug", "image" = EXCLUDED."image";
INSERT INTO "Actor" ("name", "slug", "image") VALUES ('גלעד מרחבי', 'גלעד-מרחבי', '/actors/גלעד-מרחבי.webp') ON CONFLICT ("name") DO UPDATE SET "slug" = EXCLUDED."slug", "image" = EXCLUDED."image";
INSERT INTO "Actor" ("name", "slug", "image") VALUES ('ג׳וי ריגר', 'ג׳וי-ריגר', '/actors/ג׳וי-ריגר.webp') ON CONFLICT ("name") DO UPDATE SET "slug" = EXCLUDED."slug", "image" = EXCLUDED."image";
INSERT INTO "Actor" ("name", "slug", "image") VALUES ('דור אלמקייס', 'דור-אלמקייס', '/actors/דור-אלמקייס.webp') ON CONFLICT ("name") DO UPDATE SET "slug" = EXCLUDED."slug", "image" = EXCLUDED."image";
INSERT INTO "Actor" ("name", "slug", "image") VALUES ('הגר אנגל', 'הגר-אנגל', '/actors/הגר-אנגל.webp') ON CONFLICT ("name") DO UPDATE SET "slug" = EXCLUDED."slug", "image" = EXCLUDED."image";
INSERT INTO "Actor" ("name", "slug", "image") VALUES ('כרמל בין', 'כרמל-בין', '/actors/כרמל-בין.webp') ON CONFLICT ("name") DO UPDATE SET "slug" = EXCLUDED."slug", "image" = EXCLUDED."image";
INSERT INTO "Actor" ("name", "slug", "image") VALUES ('ליהי טולדנו', 'ליהי-טולדנו', '/actors/ליהי-טולדנו.webp') ON CONFLICT ("name") DO UPDATE SET "slug" = EXCLUDED."slug", "image" = EXCLUDED."image";
INSERT INTO "Actor" ("name", "slug", "image") VALUES ('מאיה לבני', 'מאיה-לבני', '/actors/מאיה-לבני.webp') ON CONFLICT ("name") DO UPDATE SET "slug" = EXCLUDED."slug", "image" = EXCLUDED."image";
INSERT INTO "Actor" ("name", "slug", "image") VALUES ('מאיה מעוז', 'מאיה-מעוז', '/actors/מאיה-מעוז.webp') ON CONFLICT ("name") DO UPDATE SET "slug" = EXCLUDED."slug", "image" = EXCLUDED."image";
INSERT INTO "Actor" ("name", "slug", "image") VALUES ('מיה לנדסמן', 'מיה-לנדסמן', '/actors/מיה-לנדסמן.webp') ON CONFLICT ("name") DO UPDATE SET "slug" = EXCLUDED."slug", "image" = EXCLUDED."image";
INSERT INTO "Actor" ("name", "slug", "image") VALUES ('מיכאל בן דוד', 'מיכאל-בן-דוד', '/actors/מיכאל-בן-דוד.webp') ON CONFLICT ("name") DO UPDATE SET "slug" = EXCLUDED."slug", "image" = EXCLUDED."image";
INSERT INTO "Actor" ("name", "slug", "image") VALUES ('מעיין תורג׳מן', 'מעיין-תורג׳מן', '/actors/מעיין-תורג׳מן.webp') ON CONFLICT ("name") DO UPDATE SET "slug" = EXCLUDED."slug", "image" = EXCLUDED."image";
INSERT INTO "Actor" ("name", "slug", "image") VALUES ('מרים זוהר', 'מרים-זוהר', '/actors/מרים-זוהר.webp') ON CONFLICT ("name") DO UPDATE SET "slug" = EXCLUDED."slug", "image" = EXCLUDED."image";
INSERT INTO "Actor" ("name", "slug", "image") VALUES ('מתן און ימי', 'מתן-און-ימי', '/actors/מתן-און-ימי.webp') ON CONFLICT ("name") DO UPDATE SET "slug" = EXCLUDED."slug", "image" = EXCLUDED."image";
INSERT INTO "Actor" ("name", "slug", "image") VALUES ('נמרוד גרינבוים', 'נמרוד-גרינבוים', '/actors/נמרוד-גרינבוים.webp') ON CONFLICT ("name") DO UPDATE SET "slug" = EXCLUDED."slug", "image" = EXCLUDED."image";
INSERT INTO "Actor" ("name", "slug", "image") VALUES ('נעמה שטרית', 'נעמה-שטרית', '/actors/נעמה-שטרית.webp') ON CONFLICT ("name") DO UPDATE SET "slug" = EXCLUDED."slug", "image" = EXCLUDED."image";
INSERT INTO "Actor" ("name", "slug", "image") VALUES ('עדי כהן', 'עדי-כהן', '/actors/עדי-כהן.webp') ON CONFLICT ("name") DO UPDATE SET "slug" = EXCLUDED."slug", "image" = EXCLUDED."image";
INSERT INTO "Actor" ("name", "slug", "image") VALUES ('עמי ויינברג', 'עמי-ויינברג', '/actors/עמי-ויינברג.webp') ON CONFLICT ("name") DO UPDATE SET "slug" = EXCLUDED."slug", "image" = EXCLUDED."image";
INSERT INTO "Actor" ("name", "slug", "image") VALUES ('ענת וקסמן', 'ענת-וקסמן', '/actors/ענת-וקסמן.webp') ON CONFLICT ("name") DO UPDATE SET "slug" = EXCLUDED."slug", "image" = EXCLUDED."image";
INSERT INTO "Actor" ("name", "slug", "image") VALUES ('פיני קדרון', 'פיני-קדרון', '/actors/פיני-קדרון.webp') ON CONFLICT ("name") DO UPDATE SET "slug" = EXCLUDED."slug", "image" = EXCLUDED."image";
INSERT INTO "Actor" ("name", "slug", "image") VALUES ('פנינה ברט צדקה', 'פנינה-ברט-צדקה', '/actors/פנינה-ברט-צדקה.webp') ON CONFLICT ("name") DO UPDATE SET "slug" = EXCLUDED."slug", "image" = EXCLUDED."image";
INSERT INTO "Actor" ("name", "slug", "image") VALUES ('קרן מור מישורי', 'קרן-מור-מישורי', '/actors/קרן-מור-מישורי.webp') ON CONFLICT ("name") DO UPDATE SET "slug" = EXCLUDED."slug", "image" = EXCLUDED."image";
INSERT INTO "Actor" ("name", "slug", "image") VALUES ('רויטל זלצמן', 'רויטל-זלצמן', '/actors/רויטל-זלצמן.webp') ON CONFLICT ("name") DO UPDATE SET "slug" = EXCLUDED."slug", "image" = EXCLUDED."image";
INSERT INTO "Actor" ("name", "slug", "image") VALUES ('תומר מחלוף', 'תומר-מחלוף', '/actors/תומר-מחלוף.webp') ON CONFLICT ("name") DO UPDATE SET "slug" = EXCLUDED."slug", "image" = EXCLUDED."image";

-- Link actors to shows
-- מאיה לבני -> החבדניקים, פריסילה מלכת המדבר
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s."id", a."id" FROM "Show" s, "Actor" a WHERE s."slug" = 'החבדניקים' AND a."name" = 'מאיה לבני' ON CONFLICT DO NOTHING;
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s."id", a."id" FROM "Show" s, "Actor" a WHERE s."slug" = 'פריסילה-מלכת-המדבר' AND a."name" = 'מאיה לבני' ON CONFLICT DO NOTHING;

-- מתן און ימי -> החבדניקים
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s."id", a."id" FROM "Show" s, "Actor" a WHERE s."slug" = 'החבדניקים' AND a."name" = 'מתן און ימי' ON CONFLICT DO NOTHING;

-- קרן מור מישורי -> אפס ביחסי אנוש, לילה ברומא
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s."id", a."id" FROM "Show" s, "Actor" a WHERE s."slug" = 'אפס-ביחסי-אנוש' AND a."name" = 'קרן מור מישורי' ON CONFLICT DO NOTHING;
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s."id", a."id" FROM "Show" s, "Actor" a WHERE s."slug" = 'לילה-ברומא' AND a."name" = 'קרן מור מישורי' ON CONFLICT DO NOTHING;

-- מעיין תורג׳מן -> אפס ביחסי אנוש
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s."id", a."id" FROM "Show" s, "Actor" a WHERE s."slug" = 'אפס-ביחסי-אנוש' AND a."name" = 'מעיין תורג׳מן' ON CONFLICT DO NOTHING;

-- אלון אופיר -> גבירתי הנאווה
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s."id", a."id" FROM "Show" s, "Actor" a WHERE s."slug" = 'גבירתי-הנאווה' AND a."name" = 'אלון אופיר' ON CONFLICT DO NOTHING;

-- פנינה ברט צדקה -> גבירתי הנאווה
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s."id", a."id" FROM "Show" s, "Actor" a WHERE s."slug" = 'גבירתי-הנאווה' AND a."name" = 'פנינה ברט צדקה' ON CONFLICT DO NOTHING;

-- נמרוד גרינבוים -> גבירתי הנאווה
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s."id", a."id" FROM "Show" s, "Actor" a WHERE s."slug" = 'גבירתי-הנאווה' AND a."name" = 'נמרוד גרינבוים' ON CONFLICT DO NOTHING;

-- איה גרניט שבא -> טרטיף
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s."id", a."id" FROM "Show" s, "Actor" a WHERE s."slug" = 'טרטיף' AND a."name" = 'איה גרניט שבא' ON CONFLICT DO NOTHING;

-- גלעד מרחבי -> טרטיף
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s."id", a."id" FROM "Show" s, "Actor" a WHERE s."slug" = 'טרטיף' AND a."name" = 'גלעד מרחבי' ON CONFLICT DO NOTHING;

-- עמי ויינברג -> קברט
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s."id", a."id" FROM "Show" s, "Actor" a WHERE s."slug" = 'קברט' AND a."name" = 'עמי ויינברג' ON CONFLICT DO NOTHING;

-- ליהי טולדנו -> קברט
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s."id", a."id" FROM "Show" s, "Actor" a WHERE s."slug" = 'קברט' AND a."name" = 'ליהי טולדנו' ON CONFLICT DO NOTHING;

-- מיכאל בן דוד -> פריסילה מלכת המדבר
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s."id", a."id" FROM "Show" s, "Actor" a WHERE s."slug" = 'פריסילה-מלכת-המדבר' AND a."name" = 'מיכאל בן דוד' ON CONFLICT DO NOTHING;

-- פיני קדרון -> פריסילה מלכת המדבר
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s."id", a."id" FROM "Show" s, "Actor" a WHERE s."slug" = 'פריסילה-מלכת-המדבר' AND a."name" = 'פיני קדרון' ON CONFLICT DO NOTHING;

-- עדי כהן -> פריסילה מלכת המדבר
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s."id", a."id" FROM "Show" s, "Actor" a WHERE s."slug" = 'פריסילה-מלכת-המדבר' AND a."name" = 'עדי כהן' ON CONFLICT DO NOTHING;

-- רויטל זלצמן -> פריסילה מלכת המדבר
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s."id", a."id" FROM "Show" s, "Actor" a WHERE s."slug" = 'פריסילה-מלכת-המדבר' AND a."name" = 'רויטל זלצמן' ON CONFLICT DO NOTHING;

-- ג׳וי ריגר -> מעגל הגיר הקווקזי, הסוף
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s."id", a."id" FROM "Show" s, "Actor" a WHERE s."slug" = 'מעגל-הגיר-הקווקזי' AND a."name" = 'ג׳וי ריגר' ON CONFLICT DO NOTHING;
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s."id", a."id" FROM "Show" s, "Actor" a WHERE s."slug" = 'הסוף' AND a."name" = 'ג׳וי ריגר' ON CONFLICT DO NOTHING;

-- תומר מחלוף -> מעגל הגיר הקווקזי
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s."id", a."id" FROM "Show" s, "Actor" a WHERE s."slug" = 'מעגל-הגיר-הקווקזי' AND a."name" = 'תומר מחלוף' ON CONFLICT DO NOTHING;

-- מאיה מעוז -> מעגל הגיר הקווקזי
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s."id", a."id" FROM "Show" s, "Actor" a WHERE s."slug" = 'מעגל-הגיר-הקווקזי' AND a."name" = 'מאיה מעוז' ON CONFLICT DO NOTHING;

-- כרמל בין -> מלכת היופי של ירושלים
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s."id", a."id" FROM "Show" s, "Actor" a WHERE s."slug" = 'מלכת-היופי-של-ירושלים' AND a."name" = 'כרמל בין' ON CONFLICT DO NOTHING;

-- מרים זוהר -> צ׳ילבות
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s."id", a."id" FROM "Show" s, "Actor" a WHERE s."slug" = 'צ׳ילבות' AND a."name" = 'מרים זוהר' ON CONFLICT DO NOTHING;

-- מיה לנדסמן -> צ׳ילבות
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s."id", a."id" FROM "Show" s, "Actor" a WHERE s."slug" = 'צ׳ילבות' AND a."name" = 'מיה לנדסמן' ON CONFLICT DO NOTHING;

-- ענת וקסמן -> מי בעד
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s."id", a."id" FROM "Show" s, "Actor" a WHERE s."slug" = 'מי-בעד' AND a."name" = 'ענת וקסמן' ON CONFLICT DO NOTHING;

-- נעמה שטרית -> לא הייתם צריכים
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s."id", a."id" FROM "Show" s, "Actor" a WHERE s."slug" = 'לא-הייתם-צריכים' AND a."name" = 'נעמה שטרית' ON CONFLICT DO NOTHING;

-- דור אלמקייס -> לילה ברומא
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s."id", a."id" FROM "Show" s, "Actor" a WHERE s."slug" = 'לילה-ברומא' AND a."name" = 'דור אלמקייס' ON CONFLICT DO NOTHING;

-- הגר אנגל -> לילה ברומא
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s."id", a."id" FROM "Show" s, "Actor" a WHERE s."slug" = 'לילה-ברומא' AND a."name" = 'הגר אנגל' ON CONFLICT DO NOTHING;
