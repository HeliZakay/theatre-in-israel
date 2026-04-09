-- Remove "נישואים גרעיניים" from תיאטרון צוותא (incorrectly attributed; belongs to תיאטרון toMix)
DELETE FROM "Event" WHERE "showId" = (SELECT id FROM "Show" WHERE slug = 'נישואים-גרעיניים' AND theatre = 'תיאטרון צוותא');
DELETE FROM "ShowGenre" WHERE "showId" = (SELECT id FROM "Show" WHERE slug = 'נישואים-גרעיניים' AND theatre = 'תיאטרון צוותא');
DELETE FROM "ShowActor" WHERE "showId" = (SELECT id FROM "Show" WHERE slug = 'נישואים-גרעיניים' AND theatre = 'תיאטרון צוותא');
DELETE FROM "Review" WHERE "showId" = (SELECT id FROM "Show" WHERE slug = 'נישואים-גרעיניים' AND theatre = 'תיאטרון צוותא');
DELETE FROM "Watchlist" WHERE "showId" = (SELECT id FROM "Show" WHERE slug = 'נישואים-גרעיניים' AND theatre = 'תיאטרון צוותא');
DELETE FROM "Show" WHERE slug = 'נישואים-גרעיניים' AND theatre = 'תיאטרון צוותא';
