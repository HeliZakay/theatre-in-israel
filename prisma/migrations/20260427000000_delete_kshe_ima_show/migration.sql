-- Delete show "כשאמא באה הנה - אריאל הורוביץ ו״האחיות שמר 24״" (slug-based, ID-portable).
-- Reviews and Watchlist have onDelete: Restrict — must remove first.
-- Events, ShowGenre, ShowActor cascade automatically.

DELETE FROM "Review" WHERE "showId" IN (
  SELECT id FROM "Show" WHERE slug = 'כשאמא-באה-הנה-אריאל-הורוביץ-ו״האחיות-שמר-24״'
);

DELETE FROM "Watchlist" WHERE "showId" IN (
  SELECT id FROM "Show" WHERE slug = 'כשאמא-באה-הנה-אריאל-הורוביץ-ו״האחיות-שמר-24״'
);

DELETE FROM "Show" WHERE slug = 'כשאמא-באה-הנה-אריאל-הורוביץ-ו״האחיות-שמר-24״';
