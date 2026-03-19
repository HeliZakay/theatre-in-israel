-- Link לאורה ריבלין to קברט
INSERT INTO "ShowActor" ("showId", "actorId") SELECT s."id", a."id" FROM "Show" s, "Actor" a WHERE s."slug" = 'קברט' AND a."name" = 'לאורה ריבלין' ON CONFLICT DO NOTHING;
