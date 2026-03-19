-- Remove actors incorrectly added to בוסתן ספרדי 2021

DELETE FROM "ShowActor"
WHERE "showId" = (SELECT "id" FROM "Show" WHERE "slug" = 'בוסתן-ספרדי-2021')
  AND "actorId" = (SELECT "id" FROM "Actor" WHERE "name" = 'יעל לבנטל');

DELETE FROM "ShowActor"
WHERE "showId" = (SELECT "id" FROM "Show" WHERE "slug" = 'בוסתן-ספרדי-2021')
  AND "actorId" = (SELECT "id" FROM "Actor" WHERE "name" = 'ריקי בליך');

DELETE FROM "ShowActor"
WHERE "showId" = (SELECT "id" FROM "Show" WHERE "slug" = 'בוסתן-ספרדי-2021')
  AND "actorId" = (SELECT "id" FROM "Actor" WHERE "name" = 'נורמן עיסא');
