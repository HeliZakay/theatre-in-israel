-- Delete the duplicate show "הזמנה מהירה" which was mistakenly inserted
-- as a separate show. It is actually "סיפור הפרברים – המחזמר" (ID 60).

DELETE FROM "ShowGenre"
WHERE "showId" = (SELECT id FROM "Show" WHERE slug = 'הזמנה-מהירה');

DELETE FROM "Review"
WHERE "showId" = (SELECT id FROM "Show" WHERE slug = 'הזמנה-מהירה');

DELETE FROM "Watchlist"
WHERE "showId" = (SELECT id FROM "Show" WHERE slug = 'הזמנה-מהירה');

DELETE FROM "Show"
WHERE slug = 'הזמנה-מהירה';
