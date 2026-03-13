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

  // Delete stale events for this theatre's shows that are no longer in the JSON.
  // Scoped by theatre (not venue) so that: (1) shows removed entirely from the
  // scrape get cleaned up, and (2) other theatres' events at this venue are not
  // accidentally deleted.
  const jsonShowIds = [...new Set(data.events.map((e) => e.showId))];
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
  const existingEvents = await prisma.event.findMany({
    where: { showId: { in: allShowIds } },
    select: { id: true, showId: true, venueId: true, date: true, hour: true },
  });

  const staleIds = existingEvents
    .filter(
      (e) => !expectedKeys.has(`${e.showId}|${e.venueId}|${e.date.toISOString()}|${e.hour}`),
    )
    .map((e) => e.id);

  if (staleIds.length > 0) {
    await prisma.event.deleteMany({ where: { id: { in: staleIds } } });
    console.log(`  Removed ${staleIds.length} stale events`);
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
async function main() {
  const prisma = createPrismaClient();

  try {
    // Cameri events (required — fail if missing)
    const cameriPath = path.join(__dirname, "data", "events.json");
    const cameriResult = await syncEvents(prisma, cameriPath);
    if (cameriResult === null) {
      console.error("Failed to read events.json");
      process.exit(1);
    }

    // Lessin events (optional — skip gracefully if not present)
    const lessinPath = path.join(__dirname, "data", "events-lessin.json");
    if (fs.existsSync(lessinPath)) {
      const lessinResult = await syncEvents(prisma, lessinPath);
      if (lessinResult === null) {
        console.error(
          "Failed to read events-lessin.json (file exists but could not be parsed)",
        );
      }
    } else {
      console.log("No events-lessin.json found — skipping Lessin sync.");
    }

    // Hebrew Theatre events (optional — touring format)
    const hebrewTheatrePath = path.join(
      __dirname,
      "data",
      "events-hebrew-theatre.json",
    );
    if (fs.existsSync(hebrewTheatrePath)) {
      const htResult = await syncEvents(prisma, hebrewTheatrePath);
      if (htResult === null) {
        console.error(
          "Failed to read events-hebrew-theatre.json (file exists but could not be parsed)",
        );
      }
    } else {
      console.log(
        "No events-hebrew-theatre.json found — skipping Hebrew Theatre sync.",
      );
    }

    // Khan Theatre events (optional — touring format, fixed venue)
    const khanPath = path.join(__dirname, "data", "events-khan.json");
    if (fs.existsSync(khanPath)) {
      const khanResult = await syncEvents(prisma, khanPath);
      if (khanResult === null) {
        console.error(
          "Failed to read events-khan.json (file exists but could not be parsed)",
        );
      }
    } else {
      console.log("No events-khan.json found — skipping Khan Theatre sync.");
    }

    // Gesher Theatre events (optional — touring format, fixed venue)
    const gesherPath = path.join(__dirname, "data", "events-gesher.json");
    if (fs.existsSync(gesherPath)) {
      const gesherResult = await syncEvents(prisma, gesherPath);
      if (gesherResult === null) {
        console.error(
          "Failed to read events-gesher.json (file exists but could not be parsed)",
        );
      }
    } else {
      console.log("No events-gesher.json found — skipping Gesher Theatre sync.");
    }

    // Haifa Theatre events (optional — touring format, fixed venue)
    const haifaPath = path.join(__dirname, "data", "events-haifa-theatre.json");
    if (fs.existsSync(haifaPath)) {
      const haifaResult = await syncEvents(prisma, haifaPath);
      if (haifaResult === null) {
        console.error(
          "Failed to read events-haifa-theatre.json (file exists but could not be parsed)",
        );
      }
    } else {
      console.log("No events-haifa-theatre.json found — skipping Haifa Theatre sync.");
    }

    // Tmuna Theatre events (optional — touring format, fixed venue)
    const tmunaPath = path.join(__dirname, "data", "events-tmuna-theatre.json");
    if (fs.existsSync(tmunaPath)) {
      const tmunaResult = await syncEvents(prisma, tmunaPath);
      if (tmunaResult === null) {
        console.error(
          "Failed to read events-tmuna-theatre.json (file exists but could not be parsed)",
        );
      }
    } else {
      console.log("No events-tmuna-theatre.json found — skipping Tmuna Theatre sync.");
    }

    // Beer Sheva Theatre events (optional — touring format, fixed venue)
    const beerShevaPath = path.join(__dirname, "data", "events-beer-sheva-theatre.json");
    if (fs.existsSync(beerShevaPath)) {
      const beerShevaResult = await syncEvents(prisma, beerShevaPath);
      if (beerShevaResult === null) {
        console.error(
          "Failed to read events-beer-sheva-theatre.json (file exists but could not be parsed)",
        );
      }
    } else {
      console.log("No events-beer-sheva-theatre.json found — skipping Beer Sheva Theatre sync.");
    }

    // Tzavta Theatre events (optional — touring format, fixed venue)
    const tzavtaPath = path.join(__dirname, "data", "events-tzavta-theatre.json");
    if (fs.existsSync(tzavtaPath)) {
      const tzavtaResult = await syncEvents(prisma, tzavtaPath);
      if (tzavtaResult === null) {
        console.error(
          "Failed to read events-tzavta-theatre.json (file exists but could not be parsed)",
        );
      }
    } else {
      console.log("No events-tzavta-theatre.json found — skipping Tzavta Theatre sync.");
    }

    // Habima Theatre events (optional — touring format, fixed venue)
    const habimaPath = path.join(__dirname, "data", "events-habima-theatre.json");
    if (fs.existsSync(habimaPath)) {
      const habimaResult = await syncEvents(prisma, habimaPath);
      if (habimaResult === null) {
        console.error(
          "Failed to read events-habima-theatre.json (file exists but could not be parsed)",
        );
      }
    } else {
      console.log("No events-habima-theatre.json found — skipping Habima Theatre sync.");
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
