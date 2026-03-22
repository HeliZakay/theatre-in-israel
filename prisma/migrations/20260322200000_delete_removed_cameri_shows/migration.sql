-- Delete 3 Cameri shows that are no longer on the theatre's website

-- 1. AI וחדשנות ספרותית – דוד אבידן ועוד
DELETE FROM "Review" WHERE "showId" = (SELECT id FROM "Show" WHERE slug = 'AI-וחדשנות-ספרותית-–-דוד-אבידן-ועוד');
DELETE FROM "Watchlist" WHERE "showId" = (SELECT id FROM "Show" WHERE slug = 'AI-וחדשנות-ספרותית-–-דוד-אבידן-ועוד');
DELETE FROM "Show" WHERE slug = 'AI-וחדשנות-ספרותית-–-דוד-אבידן-ועוד';

-- 2. מחווה לנעמי שמר
DELETE FROM "Review" WHERE "showId" = (SELECT id FROM "Show" WHERE slug = 'מחווה-לנעמי-שמר');
DELETE FROM "Watchlist" WHERE "showId" = (SELECT id FROM "Show" WHERE slug = 'מחווה-לנעמי-שמר');
DELETE FROM "Show" WHERE slug = 'מחווה-לנעמי-שמר';

-- 3. אבידן ואלייזה – מופע ספרותי
DELETE FROM "Review" WHERE "showId" = (SELECT id FROM "Show" WHERE slug = 'אבידן-ואלייזה-–-מופע-ספרותי');
DELETE FROM "Watchlist" WHERE "showId" = (SELECT id FROM "Show" WHERE slug = 'אבידן-ואלייזה-–-מופע-ספרותי');
DELETE FROM "Show" WHERE slug = 'אבידן-ואלייזה-–-מופע-ספרותי';
