-- Delete false actor-show links caused by substring matching in seed-actors.mjs.
-- "תם גל" was a substring of "רותם גלזר" in the cast of אנני and מצחיקונת.
-- "קרן מור" was a substring of "קרן מור-מישורי" in the cast of חנאל ומכבית.

DELETE FROM "ShowActor"
WHERE "showId" = (SELECT id FROM "Show" WHERE slug = 'אנני')
  AND "actorId" = (SELECT id FROM "Actor" WHERE name = 'תם גל');

DELETE FROM "ShowActor"
WHERE "showId" = (SELECT id FROM "Show" WHERE slug = 'מצחיקונת-–-Funny-Girl')
  AND "actorId" = (SELECT id FROM "Actor" WHERE name = 'תם גל');

DELETE FROM "ShowActor"
WHERE "showId" = (SELECT id FROM "Show" WHERE slug = 'חנאל-ומכבית')
  AND "actorId" = (SELECT id FROM "Actor" WHERE name = 'קרן מור');
