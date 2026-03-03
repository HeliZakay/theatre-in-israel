-- Fix "Mix & Match" slug: bare & produces invalid XML in sitemap
UPDATE "Show" SET slug = 'Mix-Match' WHERE slug = 'Mix-&-Match';
