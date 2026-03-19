-- Fix actor-show link mistakes

-- 1. Remove רבקה מיכאלי and עופרי ביטרמן from רינגו (they don't play in it)
DELETE FROM "ShowActor"
WHERE "showId" = (SELECT "id" FROM "Show" WHERE "slug" = 'רינגו')
  AND "actorId" = (SELECT "id" FROM "Actor" WHERE "name" = 'רבקה מיכאלי');

DELETE FROM "ShowActor"
WHERE "showId" = (SELECT "id" FROM "Show" WHERE "slug" = 'רינגו')
  AND "actorId" = (SELECT "id" FROM "Actor" WHERE "name" = 'עופרי ביטרמן');

-- 2. Ensure יונה אליאן קשת is linked to אמא
INSERT INTO "ShowActor" ("showId", "actorId")
SELECT s."id", a."id" FROM "Show" s, "Actor" a
WHERE s."slug" = 'אמא' AND a."name" = 'יונה אליאן קשת'
ON CONFLICT DO NOTHING;

-- 3. Add missing actors to בוסתן ספרדי 2021
INSERT INTO "ShowActor" ("showId", "actorId")
SELECT s."id", a."id" FROM "Show" s, "Actor" a
WHERE s."slug" = 'בוסתן-ספרדי-2021' AND a."name" = 'יעל לבנטל'
ON CONFLICT DO NOTHING;

INSERT INTO "ShowActor" ("showId", "actorId")
SELECT s."id", a."id" FROM "Show" s, "Actor" a
WHERE s."slug" = 'בוסתן-ספרדי-2021' AND a."name" = 'ריקי בליך'
ON CONFLICT DO NOTHING;

INSERT INTO "ShowActor" ("showId", "actorId")
SELECT s."id", a."id" FROM "Show" s, "Actor" a
WHERE s."slug" = 'בוסתן-ספרדי-2021' AND a."name" = 'נורמן עיסא'
ON CONFLICT DO NOTHING;

-- 4. Add אלעד אטרקצ׳י to לנקות את הראש
INSERT INTO "ShowActor" ("showId", "actorId")
SELECT s."id", a."id" FROM "Show" s, "Actor" a
WHERE s."slug" = 'לנקות-את-הראש' AND a."name" = 'אלעד אטרקצ׳י'
ON CONFLICT DO NOTHING;

-- 5. Add נועם קלינשטיין to היומן
INSERT INTO "ShowActor" ("showId", "actorId")
SELECT s."id", a."id" FROM "Show" s, "Actor" a
WHERE s."slug" = 'היומן' AND a."name" = 'נועם קלינשטיין'
ON CONFLICT DO NOTHING;
