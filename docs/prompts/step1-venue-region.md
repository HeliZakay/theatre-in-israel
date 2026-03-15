## Task: Add `region` column to Venue model and backfill

This is step 1 of building the `/events` page. The goal is to add a `region` field to the `Venue` table so we can filter events by geographic region later.

### What to do

**1. Schema change** — in `prisma/schema.prisma`, add `region String?` to the `Venue` model.

**2. Index change** — on the `Event` model:
- Add a composite index: `@@index([date, showId, venueId])`
- Remove the existing standalone `@@index([date])` since the composite covers date-range scans
- Keep `@@index([showId])` and `@@index([venueId])` as-is

**3. City→region mapping** — in `prisma/sync-events.js`, add this map near the top (after `VENUE_ALIASES`):

```js
const CITY_REGION_MAP = {
  'תל אביב': 'center', 'תל אביב-יפו': 'center', 'רמת גן': 'center', 'גבעתיים': 'center', 'חולון': 'center', 'בת ים': 'center', 'פתח תקווה': 'center', 'ראש העין': 'center', 'גני תקווה': 'center',
  'נתניה': 'sharon', 'כפר סבא': 'sharon', 'רעננה': 'sharon', 'הרצליה': 'sharon', 'רמת השרון': 'sharon', 'נווה ירק': 'sharon', 'תל מונד': 'sharon', 'גלילות': 'sharon', 'אריאל': 'sharon',
  'ראשון לציון': 'shfela', 'רחובות': 'shfela', 'נס ציונה': 'shfela', 'מודיעין': 'shfela', 'יבנה': 'shfela', 'מזכרת בתיה': 'shfela', 'גבעת ברנר': 'shfela', 'אייפורט סיטי': 'shfela', 'איירפורט סיטי': 'shfela', 'קריית שדה התעופה': 'shfela', 'אקספו תל אביב': 'shfela',
  'ירושלים': 'jerusalem', 'מעלה אדומים': 'jerusalem',
  'חיפה': 'north', 'עכו': 'north', 'כרמיאל': 'north', 'עפולה': 'north', 'קריית מוצקין': 'north', 'קרית מוצקין': 'north', 'זכרון יעקב': 'north', 'יגור': 'north', 'חוף הכרמל': 'north', 'אור עקיבא': 'north', 'מועצה אזורית עמק יזרעאל': 'north',
  'באר שבע': 'south', 'אשדוד': 'south', 'אשקלון': 'south',
};
```

**4. Set region during venue upsert** — in the `syncEvents()` function, where venues are upserted (the `prisma.venue.upsert` call around line 317), add region to both `create` and `update`:

```js
const region = CITY_REGION_MAP[ev.venueCity] || null;
const venue = await prisma.venue.upsert({
  where: { name_city: { name: ev.venueName, city: ev.venueCity } },
  create: { name: ev.venueName, city: ev.venueCity, region },
  update: { region },
});
```

Note: putting `region` in `update` ensures existing venues get backfilled on the next sync run — not just newly created ones.

**5. Run migration** — `npx prisma migrate dev --name add_venue_region`

**6. Run sync to backfill** — `node prisma/sync-events.js`

**7. Verify** — after sync, run a quick query to check regions were assigned:
```sql
SELECT region, COUNT(*) FROM "Venue" GROUP BY region ORDER BY region;
```
There should be venues in each region (center, sharon, shfela, jerusalem, north, south) and some with `NULL` (unmapped cities). Report the counts.

### Important constraints
- Do NOT change anything else in `sync-events.js` beyond adding the map and modifying the venue upsert
- Do NOT create any new files (no new lib files, no new scripts)
- Do NOT modify any frontend code
- This is a data-layer-only change
