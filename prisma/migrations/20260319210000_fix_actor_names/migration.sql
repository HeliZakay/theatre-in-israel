-- Fix actor name spellings to match corrected photo filenames

-- משי קליינשטיין → משי קלינשטיין
UPDATE "Actor"
SET "name" = 'משי קלינשטיין',
    "slug" = 'משי-קלינשטיין',
    "image" = '/actors/משי-קלינשטיין.webp'
WHERE "name" = 'משי קליינשטיין';

-- נעם קלינשטיין → נועם קלינשטיין
UPDATE "Actor"
SET "name" = 'נועם קלינשטיין',
    "slug" = 'נועם-קלינשטיין',
    "image" = '/actors/נועם-קלינשטיין.webp'
WHERE "name" = 'נעם קלינשטיין';

-- Link משי קלינשטיין and נועם קלינשטיין to אפס ביחסי אנוש
INSERT INTO "ShowActor" ("showId", "actorId")
SELECT s."id", a."id" FROM "Show" s, "Actor" a
WHERE s."slug" = 'אפס-ביחסי-אנוש' AND a."name" = 'משי קלינשטיין'
ON CONFLICT DO NOTHING;

INSERT INTO "ShowActor" ("showId", "actorId")
SELECT s."id", a."id" FROM "Show" s, "Actor" a
WHERE s."slug" = 'אפס-ביחסי-אנוש' AND a."name" = 'נועם קלינשטיין'
ON CONFLICT DO NOTHING;

-- Remove קרן מור from אפס ביחסי אנוש
DELETE FROM "ShowActor"
WHERE "showId" = (SELECT "id" FROM "Show" WHERE "slug" = 'אפס-ביחסי-אנוש')
  AND "actorId" = (SELECT "id" FROM "Actor" WHERE "name" = 'קרן מור');
