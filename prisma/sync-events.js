const WIPE_PROTECTION_THRESHOLD = 0.3;
const WIPE_PROTECTION_MIN_EXISTING = 5;

const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

// Load .env.local first (Next.js convention), then .env as fallback
dotenv.config({
  path: path.join(__dirname, "..", ".env.local"),
  override: true,
});
dotenv.config({ path: path.join(__dirname, "..", ".env") });
const { PrismaClient } = require("@prisma/client");

// ---------------------------------------------------------------------------
// 1. Create Prisma client with Neon / pg adapter detection (mirrors prisma.ts)
// ---------------------------------------------------------------------------
function isNeonUrl(url) {
  if (!url) return false;
  try {
    const host = new URL(url).hostname;
    return host.endsWith(".neon.tech");
  } catch {
    return false;
  }
}

function createPrismaClient() {
  if (isNeonUrl(process.env.DATABASE_URL)) {
    const { neonConfig } = require("@neondatabase/serverless");
    const { PrismaNeon } = require("@prisma/adapter-neon");
    const ws = require("ws");
    neonConfig.webSocketConstructor = ws;

    const adapter = new PrismaNeon({
      connectionString: process.env.DATABASE_URL,
    });
    return new PrismaClient({ adapter });
  }

  // Local / standard PostgreSQL
  const { PrismaPg } = require("@prisma/adapter-pg");
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  return new PrismaClient({ adapter });
}

// ---------------------------------------------------------------------------
// Helper: resolve showSlug → showId for all events in a batch.
// If an event has showSlug, we look up the Show by slug to get the real ID.
// This makes the JSON portable across database instances (local vs production)
// where auto-increment IDs may differ.
// Falls back to the numeric showId in the JSON if no slug is present.
// ---------------------------------------------------------------------------
async function resolveShowIds(prisma, events) {
  const slugs = [...new Set(events.map((e) => e.showSlug).filter(Boolean))];
  if (slugs.length === 0) return; // no slugs to resolve — use showId as-is

  const shows = await prisma.show.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true },
  });
  const slugToId = new Map(shows.map((s) => [s.slug, s.id]));

  for (const event of events) {
    if (event.showSlug) {
      const resolved = slugToId.get(event.showSlug);
      if (resolved) {
        event.showId = resolved;
      } else {
        console.warn(
          `  Warning: could not resolve slug "${event.showSlug}" — falling back to showId=${event.showId}`,
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Batched INSERT ... ON CONFLICT DO NOTHING for events
// ---------------------------------------------------------------------------
async function batchInsertEvents(prisma, rows, batchSize = 200) {
  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    try {
      const values = batch
        .map((_, idx) => {
          const off = idx * 4;
          return `($${off + 1}, $${off + 2}, $${off + 3}::date, $${off + 4})`;
        })
        .join(", ");

      const params = batch.flatMap((r) => [
        r.showId,
        r.venueId,
        r.date,
        r.hour,
      ]);

      const sql = `INSERT INTO "Event" ("showId", "venueId", "date", "hour")
        VALUES ${values}
        ON CONFLICT ("showId", "venueId", "date", "hour") DO NOTHING`;

      const result = await prisma.$executeRawUnsafe(sql, ...params);
      inserted += result;
    } catch (err) {
      console.error(
        `Batch insert failed (rows ${i}–${i + batch.length - 1}), falling back to individual inserts:`,
        err.message,
      );
      for (const row of batch) {
        try {
          await prisma.event.upsert({
            where: {
              showId_venueId_date_hour: {
                showId: row.showId,
                venueId: row.venueId,
                date: row.date,
                hour: row.hour,
              },
            },
            create: {
              showId: row.showId,
              venueId: row.venueId,
              date: row.date,
              hour: row.hour,
            },
            update: {},
          });
          inserted++;
        } catch (innerErr) {
          console.error(
            `  Failed: showId=${row.showId}, date=${row.date}, hour=${row.hour}: ${innerErr.message}`,
          );
          failed++;
        }
      }
    }
  }

  return { inserted, failed };
}

// ---------------------------------------------------------------------------
// 2. Reusable sync function — handles both fixed-venue and touring formats
// ---------------------------------------------------------------------------
/**
 * Sync an events JSON file (fixed-venue or touring format).
 *
 * Fixed-venue JSON:  { scrapedAt, venue: { name, city }, events: [...] }
 * Touring JSON:      { scrapedAt, touring: true, events: [{ ..., venueName, venueCity }] }
 *
 * Auto-detects format: if data.venue exists, stamps it onto each event so
 * both formats flow through a single venue-resolution path.
 */
async function syncEvents(prisma, filePath) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    return null;
  }

  if (
    !data.scrapedAt ||
    !Array.isArray(data.events) ||
    data.events.length === 0
  ) {
    console.log(`No events to sync in ${path.basename(filePath)}`);
    return 0;
  }

  // Resolve showSlug → showId (makes JSON portable across DB instances)
  await resolveShowIds(prisma, data.events);

  // Normalize: for fixed-venue format, stamp venue info onto each event
  // so both formats use the same per-event venue resolution below.
  if (data.venue) {
    for (const ev of data.events) {
      ev.venueName = ev.venueName || data.venue.name;
      ev.venueCity = ev.venueCity || data.venue.city;
    }
  }

  // Validate that every event has venue info (catches malformed touring files
  // that lack both a top-level venue and per-event venueName/venueCity).
  const missingVenue = data.events.some((e) => !e.venueName || !e.venueCity);
  if (missingVenue) {
    console.log(`No events to sync in ${path.basename(filePath)} (missing venue info)`);
    return 0;
  }

  // Upsert all unique venues
  const venueCache = new Map(); // "name|city" → venue row
  for (const ev of data.events) {
    const key = `${ev.venueName}|${ev.venueCity}`;
    if (!venueCache.has(key)) {
      const venue = await prisma.venue.upsert({
        where: { name_city: { name: ev.venueName, city: ev.venueCity } },
        create: { name: ev.venueName, city: ev.venueCity },
        update: {},
      });
      venueCache.set(key, venue);
    }
  }

  // Build a set of expected composite keys from the JSON file
  const expectedKeys = new Set(
    data.events.map((e) => {
      const venue = venueCache.get(`${e.venueName}|${e.venueCity}`);
      return `${e.showId}|${venue.id}|${new Date(e.date).toISOString()}|${e.hour}`;
    }),
  );

  // Delete stale events that are no longer in the JSON.
  // Two strategies depending on the source:
  //   - Theatre scrapers (default): scoped by theatre — expands to all shows from
  //     the same theatres so that shows removed from the scrape get cleaned up.
  //   - Venue scrapers (venueSource: true): scoped by venue — only deletes events
  //     at this specific venue for the shows in the JSON, preventing accidental
  //     deletion of events created by theatre-company scrapers at other venues.
  const jsonShowIds = [...new Set(data.events.map((e) => e.showId))];
  let existingEvents;

  if (data.venueSource) {
    // Venue-scoped: only look at events at this venue for the shows in the JSON
    const venueIds = [...venueCache.values()].map((v) => v.id);
    existingEvents = await prisma.event.findMany({
      where: {
        showId: { in: jsonShowIds },
        venueId: { in: venueIds },
      },
      select: { id: true, showId: true, venueId: true, date: true, hour: true },
    });
  } else {
    // Theatre-scoped: expand to all shows from the same theatres
    const resolvedShows = await prisma.show.findMany({
      where: { id: { in: jsonShowIds } },
      select: { id: true, theatre: true },
    });
    const theatreNames = [...new Set(resolvedShows.map((s) => s.theatre))];
    const allTheatreShows = theatreNames.length > 0
      ? await prisma.show.findMany({
          where: { theatre: { in: theatreNames } },
          select: { id: true },
        })
      : [];
    const allShowIds = [...new Set([
      ...jsonShowIds,
      ...allTheatreShows.map((s) => s.id),
    ])];
    existingEvents = await prisma.event.findMany({
      where: { showId: { in: allShowIds } },
      select: { id: true, showId: true, venueId: true, date: true, hour: true },
    });
  }

  // Wipe protection: if the scraped event count is suspiciously low compared
  // to what already exists in the DB, skip deletion to avoid data loss from
  // a broken or partial scrape.
  const scrapedCount = data.events.length;
  const existingCount = existingEvents.length;
  const skipDeletion =
    existingCount >= WIPE_PROTECTION_MIN_EXISTING &&
    scrapedCount < existingCount * WIPE_PROTECTION_THRESHOLD;

  if (skipDeletion) {
    console.warn(
      `  WIPE PROTECTION: ${path.basename(filePath)} has ${scrapedCount} events but DB has ${existingCount}. Skipping deletion of stale events.`,
    );
  } else {
    const staleIds = existingEvents
      .filter(
        (e) => !expectedKeys.has(`${e.showId}|${e.venueId}|${e.date.toISOString()}|${e.hour}`),
      )
      .map((e) => e.id);

    if (staleIds.length > 0) {
      await prisma.event.deleteMany({ where: { id: { in: staleIds } } });
      console.log(`  Removed ${staleIds.length} stale events`);
    }
  }

  // Build rows and batch insert
  const rows = data.events.map((ev) => {
    const venue = venueCache.get(`${ev.venueName}|${ev.venueCity}`);
    return {
      showId: ev.showId,
      venueId: venue.id,
      date: new Date(ev.date).toISOString().slice(0, 10),
      hour: ev.hour,
    };
  });

  const { inserted, failed } = await batchInsertEvents(prisma, rows);
  const synced = rows.length - failed;

  const venueLabel = venueCache.size === 1
    ? `venue ${[...venueCache.values()][0].name}`
    : `${venueCache.size} venues`;
  console.log(
    `Synced ${synced} events from ${path.basename(filePath)} (${venueLabel}, ${inserted} new, ${synced - inserted} existing)`,
  );
  return synced;
}

// ---------------------------------------------------------------------------
// 3. Sync all event files
// ---------------------------------------------------------------------------
const EVENT_FILES = [
  { file: "events.json", label: "Cameri", required: true },
  { file: "events-lessin.json", label: "Lessin" },
  { file: "events-hebrew-theatre.json", label: "Hebrew Theatre" },
  { file: "events-khan.json", label: "Khan Theatre" },
  { file: "events-gesher.json", label: "Gesher Theatre" },
  { file: "events-haifa-theatre.json", label: "Haifa Theatre" },
  { file: "events-tmuna-theatre.json", label: "Tmuna Theatre" },
  { file: "events-beer-sheva-theatre.json", label: "Beer Sheva Theatre" },
  { file: "events-tzavta-theatre.json", label: "Tzavta Theatre" },
  { file: "events-habima-theatre.json", label: "Habima Theatre" },
  { file: "events-nes-ziona.json", label: "Nes Ziona Venue" },
  { file: "events-ashdod.json", label: "Ashdod Venue" },
  { file: "events-beer-sheva-venue.json", label: "Beer Sheva Venue" },
  { file: "events-rishon-lezion.json", label: "Rishon LeZion Venue" },
  { file: "events-petah-tikva.json", label: "Petah Tikva Venue" },
  { file: "events-or-akiva.json", label: "Or Akiva Venue" },
  { file: "events-theatron-hazafon.json", label: "Theatron HaZafon Venue" },
  { file: "events-kfar-saba.json", label: "Kfar Saba Venue" },
  { file: "events-airport-city.json", label: "Airport City Venue" },
  { file: "events-ashkelon.json", label: "Ashkelon Venue" },
  { file: "events-holon.json", label: "Holon Venue" },
];

async function main() {
  const prisma = createPrismaClient();

  try {
    for (const { file, label, required } of EVENT_FILES) {
      const filePath = path.join(__dirname, "data", file);
      if (!fs.existsSync(filePath)) {
        console.log(`No ${file} found — skipping ${label} sync.`);
        continue;
      }
      const result = await syncEvents(prisma, filePath);
      if (result === null) {
        const msg = `Failed to read ${file} (file exists but could not be parsed)`;
        if (required) {
          console.error(msg);
          process.exit(1);
        }
        console.error(msg);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("sync-events failed:", err);
    process.exit(1);
  });
