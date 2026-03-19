-- New actors: אילי עלמני, יחזקאל לזרוב, חני פירסטנברג
INSERT INTO "Actor" ("name", "slug", "image") VALUES ('אילי עלמני', 'אילי-עלמני', '/actors/אילי-עלמני.webp') ON CONFLICT ("name") DO UPDATE SET "slug" = EXCLUDED."slug", "image" = EXCLUDED."image";
INSERT INTO "Actor" ("name", "slug", "image") VALUES ('יחזקאל לזרוב', 'יחזקאל-לזרוב', '/actors/יחזקאל-לזרוב.webp') ON CONFLICT ("name") DO UPDATE SET "slug" = EXCLUDED."slug", "image" = EXCLUDED."image";
INSERT INTO "Actor" ("name", "slug", "image") VALUES ('חני פירסטנברג', 'חני-פירסטנברג', '/actors/חני-פירסטנברג.webp') ON CONFLICT ("name") DO UPDATE SET "slug" = EXCLUDED."slug", "image" = EXCLUDED."image";

-- Link אלעד אטרקצ׳י to טרטיף
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s."id", a."id" FROM "Show" s, "Actor" a WHERE s."slug" = 'טרטיף' AND a."name" = 'אלעד אטרקצ׳י' ON CONFLICT DO NOTHING;

-- Link יחזקאל לזרוב to פריסילה מלכת המדבר
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s."id", a."id" FROM "Show" s, "Actor" a WHERE s."slug" = 'פריסילה-מלכת-המדבר' AND a."name" = 'יחזקאל לזרוב' ON CONFLICT DO NOTHING;

-- Link חני פירסטנברג to קברט
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s."id", a."id" FROM "Show" s, "Actor" a WHERE s."slug" = 'קברט' AND a."name" = 'חני פירסטנברג' ON CONFLICT DO NOTHING;

-- Remove קרן מור from לילה ברומא
DELETE FROM "ShowActor"
WHERE "showId" = (SELECT "id" FROM "Show" WHERE "slug" = 'לילה-ברומא')
  AND "actorId" = (SELECT "id" FROM "Actor" WHERE "name" = 'קרן מור');

-- Link אילי עלמני to קזבלן, חתונה מאוחרת, מעגל הגיר הקווקזי, פריסילה מלכת המדבר, בוסתן ספרדי
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s."id", a."id" FROM "Show" s, "Actor" a WHERE s."slug" = 'קזבלן' AND a."name" = 'אילי עלמני' ON CONFLICT DO NOTHING;
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s."id", a."id" FROM "Show" s, "Actor" a WHERE s."slug" = 'חתונה-מאוחרת' AND a."name" = 'אילי עלמני' ON CONFLICT DO NOTHING;
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s."id", a."id" FROM "Show" s, "Actor" a WHERE s."slug" = 'מעגל-הגיר-הקווקזי' AND a."name" = 'אילי עלמני' ON CONFLICT DO NOTHING;
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s."id", a."id" FROM "Show" s, "Actor" a WHERE s."slug" = 'פריסילה-מלכת-המדבר' AND a."name" = 'אילי עלמני' ON CONFLICT DO NOTHING;
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s."id", a."id" FROM "Show" s, "Actor" a WHERE s."slug" = 'בוסתן-ספרדי-2021' AND a."name" = 'אילי עלמני' ON CONFLICT DO NOTHING;

-- Link משי קלינשטיין to מיקה שלי
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s."id", a."id" FROM "Show" s, "Actor" a WHERE s."slug" = 'מיקה-שלי' AND a."name" = 'משי קלינשטיין' ON CONFLICT DO NOTHING;

-- Remove קרן מור from אף מילה לאמא
DELETE FROM "ShowActor"
WHERE "showId" = (SELECT "id" FROM "Show" WHERE "slug" = 'אף-מילה-לאמא')
  AND "actorId" = (SELECT "id" FROM "Actor" WHERE "name" = 'קרן מור');

-- Link יונה אליאן קשת to אמא
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s."id", a."id" FROM "Show" s, "Actor" a WHERE s."slug" = 'אמא' AND a."name" = 'יונה אליאן קשת' ON CONFLICT DO NOTHING;
