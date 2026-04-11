-- Restore 18 reviews recovered from Neon PITR branch.
-- These were deleted by migration 20260411000000 which removed reviews
-- before deleting shows (onDelete: Restrict). The shows were recovered
-- in migration 20260411120000, but the reviews were not.
--
-- Uses slugs to look up showId (not IDs) since IDs differ between environments.
-- Uses subquery for userId so it resolves to NULL if the user doesn't exist locally.

-- 1/18: הסוף / Liraz Bamberger
INSERT INTO "Review" ("showId", author, title, text, rating, date, "userId", ip, "anonToken", "createdAt", "updatedAt")
SELECT s.id, 'Liraz Bamberger', 'ראיתי פעמיים ורוצה שוב',
  'מחזמר קורע עם קאסט מושלם (צפיתי בשתי הגרסאות של הקאסט). אבי דנגור פשוט מופלא. השירים כיפיים וקליטים. פאן במקסימום, גם למי שלא אוהבת מחזמרים.',
  5, '2026-03-03'::timestamp,
  (SELECT id FROM "User" WHERE id = 'cmmafjyx0000004l1xs6xtxpw'),
  NULL, NULL,
  '2026-03-03 10:49:05.382'::timestamp, '2026-03-03 10:49:05.382'::timestamp
FROM "Show" s WHERE s.slug = 'הסוף'
ON CONFLICT DO NOTHING;

-- 2/18: לילה / אסי נחום
INSERT INTO "Review" ("showId", author, title, text, rating, date, "userId", ip, "anonToken", "createdAt", "updatedAt")
SELECT s.id, 'אסי נחום', 'הצגה מופלאה',
  'יפה תוסיה כהן עושה זאת שוב . היא מביאה לקדמת הבמה את התפארת של חיי היהודים בארצות ערב , את יופיה של תרבות נשכחת , את הנוסטלגיה , את השירים , ובעיקר את הגאווה שלעיתים גרמו לכולנו לשכח בארץ ישראל היפה והחדשה . הצגה מקסימה ומופלאה',
  5, '2026-03-10'::timestamp,
  NULL, '85.64.6.37', NULL,
  '2026-03-10 16:55:10.279'::timestamp, '2026-03-10 16:55:10.279'::timestamp
FROM "Show" s WHERE s.slug = 'לילה-–-סיפורה-של-לילה-מוראד'
ON CONFLICT DO NOTHING;

-- 3/18: הסוף / אנונימי (rating 3)
INSERT INTO "Review" ("showId", author, title, text, rating, date, "userId", ip, "anonToken", "createdAt", "updatedAt")
SELECT s.id, 'אנונימי', 'הסוף',
  'מחזמר נחמד מרגיש טיפה כמו הצגת סיום בתיכון סך הכל נהניתי היה כיף',
  3, '2026-03-16'::timestamp,
  NULL, '77.137.70.137', NULL,
  '2026-03-16 09:28:44.307'::timestamp, '2026-03-16 09:28:44.307'::timestamp
FROM "Show" s WHERE s.slug = 'הסוף'
ON CONFLICT DO NOTHING;

-- 4/18: הסוף / אנונימי (rating 5, 14 פעמים)
INSERT INTO "Review" ("showId", author, title, text, rating, date, "userId", ip, "anonToken", "createdAt", "updatedAt")
SELECT s.id, 'אנונימי', 'מחזמר מדהים',
  'הייתי במחזמר 14 פעמים מחזמר מדהים ומטורף ממליץ מאוד אין שיר שהוא לא טוב ולא מדבק',
  5, '2026-03-16'::timestamp,
  NULL, '46.210.249.181', NULL,
  '2026-03-16 19:15:14.451'::timestamp, '2026-03-16 19:15:14.451'::timestamp
FROM "Show" s WHERE s.slug = 'הסוף'
ON CONFLICT DO NOTHING;

-- 5/18: הסוף / איציק
INSERT INTO "Review" ("showId", author, title, text, rating, date, "userId", ip, "anonToken", "createdAt", "updatedAt")
SELECT s.id, 'איציק', 'מחזמר מהנה',
  E'למרות הנושא הכבד של המוות, מחזמר קליל, עם שירים טובים ואווירה מבדרת.\r\nהסיפור עצמו סביר, הקאסט לא אחיד ברמתו, ואני אישית ממש סבלתי מהאולם עצמו בצוותא כי השורות צפופות מדי...\r\nבשורה התחתונה- ערב כיפי ושירים שנתקעים בראש. פעם הבאה אני מזמין לצוותא רק שורה ראשונה כדי שיהיה לי מקום לרגליים',
  3, '2026-03-29'::timestamp,
  (SELECT id FROM "User" WHERE id = 'cmnbgok74000004kynhcbwmvv'),
  NULL, NULL,
  '2026-03-29 12:06:20.31'::timestamp, '2026-03-29 12:06:20.31'::timestamp
FROM "Show" s WHERE s.slug = 'הסוף'
ON CONFLICT DO NOTHING;

-- 6/18: יהושולה / אנונימי
INSERT INTO "Review" ("showId", author, title, text, rating, date, "userId", ip, "anonToken", "createdAt", "updatedAt")
SELECT s.id, 'אנונימי', 'יהושולה',
  E'זה מאוד אישי. סבלתי בהצגה. הצגה משעממת וזה עומד בסתירה ליופי האסטתי שלה. \r\nהעלילה שלה מספיקה לתרגיל של 20 דקות. \r\nאולי יש כאלו שיאהבו. מדובר ביוצרת מאוד רצינית שאני מעריכה.',
  1, '2026-03-29'::timestamp,
  NULL, '84.229.100.152', NULL,
  '2026-03-29 16:46:56.206'::timestamp, '2026-03-29 16:46:56.206'::timestamp
FROM "Show" s WHERE s.slug = 'יהושולה'
ON CONFLICT DO NOTHING;

-- 7/18: הסוף / Tomer
INSERT INTO "Review" ("showId", author, title, text, rating, date, "userId", ip, "anonToken", "createdAt", "updatedAt")
SELECT s.id, 'Tomer', 'הסוף',
  'הכי טובה שראיתי',
  5, '2026-03-29'::timestamp,
  NULL, '84.229.100.152', NULL,
  '2026-03-29 20:01:13.975'::timestamp, '2026-03-29 20:01:13.975'::timestamp
FROM "Show" s WHERE s.slug = 'הסוף'
ON CONFLICT DO NOTHING;

-- 8/18: הסוף / Or Noy
INSERT INTO "Review" ("showId", author, title, text, rating, date, "userId", ip, "anonToken", "createdAt", "updatedAt")
SELECT s.id, 'Or Noy', 'הסוף',
  'מפתיע ונועז',
  4, '2026-03-30'::timestamp,
  NULL, '84.229.100.152', NULL,
  '2026-03-30 11:52:57.745'::timestamp, '2026-03-30 11:52:57.745'::timestamp
FROM "Show" s WHERE s.slug = 'הסוף'
ON CONFLICT DO NOTHING;

-- 9/18: הסוף / נביעה
INSERT INTO "Review" ("showId", author, title, text, rating, date, "userId", ip, "anonToken", "createdAt", "updatedAt")
SELECT s.id, 'נביעה', 'מעולה, מפתיע',
  'שומר את הקהל עירני, המוזיקה והשיח עם הקהל אדיר.',
  5, '2026-04-02'::timestamp,
  NULL, '31.210.181.199', NULL,
  '2026-04-02 19:01:54.072'::timestamp, '2026-04-02 19:01:54.072'::timestamp
FROM "Show" s WHERE s.slug = 'הסוף'
ON CONFLICT DO NOTHING;

-- 10/18: אסתר / Yossi Jozz Cohen
INSERT INTO "Review" ("showId", author, title, text, rating, date, "userId", ip, "anonToken", "createdAt", "updatedAt")
SELECT s.id, 'Yossi Jozz Cohen', 'אסתר',
  'הצגה מצחיקה ומיוחדת',
  5, '2026-03-31'::timestamp,
  NULL, '84.229.100.152', NULL,
  '2026-03-31 17:37:44.607'::timestamp, '2026-03-31 17:37:44.607'::timestamp
FROM "Show" s WHERE s.slug = 'אסתר'
ON CONFLICT DO NOTHING;

-- 11/18: בילבי / מיכל בר לב
INSERT INTO "Review" ("showId", author, title, text, rating, date, "userId", ip, "anonToken", "createdAt", "updatedAt")
SELECT s.id, 'מיכל בר לב', 'בילבי',
  'מתוק להפליא עם אינטרפטציה עכשווית',
  5, '2026-04-05'::timestamp,
  NULL, '81.5.57.23', 'fc4c59d4-b4f8-49a1-953c-094aac927088',
  '2026-04-05 20:21:34.81'::timestamp, '2026-04-05 20:21:34.81'::timestamp
FROM "Show" s WHERE s.slug = 'בילבי'
ON CONFLICT DO NOTHING;

-- 12/18: מיינדפאק / דני
INSERT INTO "Review" ("showId", author, title, text, rating, date, "userId", ip, "anonToken", "createdAt", "updatedAt")
SELECT s.id, 'דני', 'מיינדפאק',
  'פחות התחברתי',
  2, '2026-04-06'::timestamp,
  NULL, '77.137.71.111', 'c21b4e88-4a7b-46d7-8f23-53e1c13f589d',
  '2026-04-06 19:07:39.479'::timestamp, '2026-04-06 19:07:39.479'::timestamp
FROM "Show" s WHERE s.slug = 'מיינדפאק'
ON CONFLICT DO NOTHING;

-- 13/18: הסוף / אנונימי (rating 5, ip 84.229.214.145)
INSERT INTO "Review" ("showId", author, title, text, rating, date, "userId", ip, "anonToken", "createdAt", "updatedAt")
SELECT s.id, 'אנונימי', 'הסוף',
  'מומלצת. מיוחדת אחרת , הומור שחור. משחק מושלם',
  5, '2026-04-08'::timestamp,
  NULL, '84.229.214.145', '5c927368-8d0f-4eb1-9f35-ea23016343d5',
  '2026-04-08 11:31:54.109'::timestamp, '2026-04-08 11:31:54.109'::timestamp
FROM "Show" s WHERE s.slug = 'הסוף'
ON CONFLICT DO NOTHING;

-- 14/18: הסוף / אנונימי (rating 5, ip 2.54.55.51)
INSERT INTO "Review" ("showId", author, title, text, rating, date, "userId", ip, "anonToken", "createdAt", "updatedAt")
SELECT s.id, 'אנונימי', 'הסוף',
  'מומלצת, משחק מעולה',
  5, '2026-04-08'::timestamp,
  NULL, '2.54.55.51', '94c753fe-7260-4f69-888a-8af8108b12d2',
  '2026-04-08 11:45:37.647'::timestamp, '2026-04-08 11:45:37.647'::timestamp
FROM "Show" s WHERE s.slug = 'הסוף'
ON CONFLICT DO NOTHING;

-- 15/18: מיינדפאק / אנונימי (rating 3)
INSERT INTO "Review" ("showId", author, title, text, rating, date, "userId", ip, "anonToken", "createdAt", "updatedAt")
SELECT s.id, 'אנונימי', 'מיינדפאק',
  'מומלצת',
  3, '2026-04-08'::timestamp,
  NULL, '79.177.153.254', '3ea4dd56-bbb4-4ce3-8127-702d6a8bae98',
  '2026-04-08 16:32:01.871'::timestamp, '2026-04-08 16:32:01.871'::timestamp
FROM "Show" s WHERE s.slug = 'מיינדפאק'
ON CONFLICT DO NOTHING;

-- 16/18: לדפוק / אנונימי
INSERT INTO "Review" ("showId", author, title, text, rating, date, "userId", ip, "anonToken", "createdAt", "updatedAt")
SELECT s.id, 'אנונימי', 'לדפוק',
  'מומלצת',
  5, '2026-04-08'::timestamp,
  NULL, '109.186.131.127', 'efe01481-46e7-4183-ab62-b385cf23681f',
  '2026-04-08 20:32:22.575'::timestamp, '2026-04-08 20:32:22.575'::timestamp
FROM "Show" s WHERE s.slug = 'לדפוק'
ON CONFLICT DO NOTHING;

-- 17/18: מיינדפאק / אנונימי (rating 4)
INSERT INTO "Review" ("showId", author, title, text, rating, date, "userId", ip, "anonToken", "createdAt", "updatedAt")
SELECT s.id, 'אנונימי', 'מיינדפאק',
  'מומלצת',
  4, '2026-04-08'::timestamp,
  NULL, '147.235.199.57', '4a81d0fe-a09f-4b2b-8c58-5cdda754f3e3',
  '2026-04-08 20:54:19.232'::timestamp, '2026-04-08 20:54:19.232'::timestamp
FROM "Show" s WHERE s.slug = 'מיינדפאק'
ON CONFLICT DO NOTHING;

-- 18/18: האמת / אנונימי
INSERT INTO "Review" ("showId", author, title, text, rating, date, "userId", ip, "anonToken", "createdAt", "updatedAt")
SELECT s.id, 'אנונימי', 'האמת',
  'כיפית, קלילה, זורמת. משחק טוב, קאסט מעולה. שווה צפייה',
  4, '2026-04-09'::timestamp,
  NULL, '89.138.174.147', '9f9fd78d-25c7-4c0a-bdad-5e0cd1b4fe85',
  '2026-04-09 12:30:49.499'::timestamp, '2026-04-09 12:30:49.499'::timestamp
FROM "Show" s WHERE s.slug = 'האמת'
ON CONFLICT DO NOTHING;

-- Recalculate avgRating and reviewCount for all affected shows
UPDATE "Show" SET
  "reviewCount" = (SELECT COUNT(*) FROM "Review" WHERE "showId" = "Show".id),
  "avgRating" = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2)::float FROM "Review" WHERE "showId" = "Show".id), 0)
WHERE slug IN (
  'הסוף',
  'לילה-–-סיפורה-של-לילה-מוראד',
  'יהושולה',
  'אסתר',
  'בילבי',
  'מיינדפאק',
  'לדפוק',
  'האמת'
);
