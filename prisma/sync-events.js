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
// 2. Reusable sync function — reads one JSON file and upserts its events
// ---------------------------------------------------------------------------
async function syncFile(prisma, filePath) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    // Return null to signal the file couldn't be read
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

  // Upsert venue
  const venue = await prisma.venue.upsert({
    where: {
      name_city: { name: data.venue.name, city: data.venue.city },
    },
    create: { name: data.venue.name, city: data.venue.city },
    update: {},
  });

  // Build a set of expected composite keys from the JSON file
  const expectedKeys = new Set(
    data.events.map(
      (e) => `${e.showId}|${new Date(e.date).toISOString()}|${e.hour}`,
    ),
  );

  // Delete stale events for this venue's shows that are no longer in the JSON.
  // This handles cases like corrected hours replacing old wrong values.
  const showIds = [...new Set(data.events.map((e) => e.showId))];
  const existingEvents = await prisma.event.findMany({
    where: { venueId: venue.id, showId: { in: showIds } },
    select: { id: true, showId: true, date: true, hour: true },
  });

  const staleIds = existingEvents
    .filter(
      (e) => !expectedKeys.has(`${e.showId}|${e.date.toISOString()}|${e.hour}`),
    )
    .map((e) => e.id);

  if (staleIds.length > 0) {
    await prisma.event.deleteMany({ where: { id: { in: staleIds } } });
    console.log(
      `  Removed ${staleIds.length} stale events for ${data.venue.name}`,
    );
  }

  let synced = 0;

  // Upsert events
  for (const event of data.events) {
    try {
      await prisma.event.upsert({
        where: {
          showId_venueId_date_hour: {
            showId: event.showId,
            venueId: venue.id,
            date: new Date(event.date),
            hour: event.hour,
          },
        },
        create: {
          showId: event.showId,
          venueId: venue.id,
          date: new Date(event.date),
          hour: event.hour,
        },
        update: {},
      });
      synced++;
    } catch (err) {
      console.error(
        `Failed to upsert event (showId=${event.showId}, date=${event.date}, hour=${event.hour}):`,
        err.message,
      );
    }
  }

  console.log(
    `Synced ${synced} events for venue ${data.venue.name} from ${path.basename(filePath)}`,
  );
  return synced;
}

// ---------------------------------------------------------------------------
// 2b. Reusable sync function — touring format (per-event venues)
// ---------------------------------------------------------------------------
/**
 * Sync a touring-format JSON file.
 *
 * Unlike syncFile() (single venue), this handles per-event venue resolution.
 * JSON shape:
 *   { scrapedAt, touring: true, events: [{ showId, date, hour, venueName, venueCity }] }
 */
async function syncTouringFile(prisma, filePath) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    // Return null to signal the file couldn't be read
    return null;
  }

  if (
    !data.scrapedAt ||
    !data.touring ||
    !Array.isArray(data.events) ||
    data.events.length === 0
  ) {
    console.log(`No touring events to sync in ${path.basename(filePath)}`);
    return 0;
  }

  // Resolve showSlug → showId (makes JSON portable across DB instances)
  await resolveShowIds(prisma, data.events);

  // ── 1. Upsert all unique venues ──
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

  // ── 2. Build set of expected composite keys ──
  const expectedKeys = new Set(
    data.events.map((e) => {
      const venue = venueCache.get(`${e.venueName}|${e.venueCity}`);
      return `${e.showId}|${venue.id}|${new Date(e.date).toISOString()}|${e.hour}`;
    }),
  );

  // ── 3. Delete stale events ──
  // For touring shows, delete by showId without venue filter.
  // Safe because show IDs are globally unique to this theatre.
  const showIds = [...new Set(data.events.map((e) => e.showId))];
  const existingEvents = await prisma.event.findMany({
    where: { showId: { in: showIds } },
    select: { id: true, showId: true, venueId: true, date: true, hour: true },
  });

  const staleIds = existingEvents
    .filter(
      (e) =>
        !expectedKeys.has(
          `${e.showId}|${e.venueId}|${e.date.toISOString()}|${e.hour}`,
        ),
    )
    .map((e) => e.id);

  if (staleIds.length > 0) {
    await prisma.event.deleteMany({ where: { id: { in: staleIds } } });
    console.log(`  Removed ${staleIds.length} stale touring events`);
  }

  // ── 4. Upsert events ──
  let synced = 0;
  for (const ev of data.events) {
    const venue = venueCache.get(`${ev.venueName}|${ev.venueCity}`);
    try {
      await prisma.event.upsert({
        where: {
          showId_venueId_date_hour: {
            showId: ev.showId,
            venueId: venue.id,
            date: new Date(ev.date),
            hour: ev.hour,
          },
        },
        create: {
          showId: ev.showId,
          venueId: venue.id,
          date: new Date(ev.date),
          hour: ev.hour,
        },
        update: {},
      });
      synced++;
    } catch (err) {
      console.error(
        `Failed to upsert touring event (showId=${ev.showId}, venue=${ev.venueName}, date=${ev.date}, hour=${ev.hour}):`,
        err.message,
      );
    }
  }

  console.log(
    `Synced ${synced} touring events from ${path.basename(filePath)} (${venueCache.size} venues)`,
  );
  return synced;
}

// ---------------------------------------------------------------------------
// 3. Sync all event files
// ---------------------------------------------------------------------------
async function main() {
  const prisma = createPrismaClient();

  try {
    // One-time purge: delete ALL events before re-syncing.
    // This cleans up orphaned events that were linked to wrong showIds
    // due to auto-increment ID mismatches between local and production DBs.
    // Safe because: Event table contains only scraped data (no user content),
    // and all events will be re-created from the JSON files below.
    // TODO: Remove this block after the next successful deploy.
    const purged = await prisma.event.deleteMany({});
    console.log(
      `Purged all ${purged.count} existing events (one-time cleanup of ID mismatches)`,
    );

    // Cameri events (required — fail if missing)
    const cameriPath = path.join(__dirname, "data", "events.json");
    const cameriResult = await syncFile(prisma, cameriPath);
    if (cameriResult === null) {
      console.error("Failed to read events.json");
      process.exit(1);
    }

    // Lessin events (optional — skip gracefully if not present)
    const lessinPath = path.join(__dirname, "data", "events-lessin.json");
    if (fs.existsSync(lessinPath)) {
      const lessinResult = await syncFile(prisma, lessinPath);
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
      const htResult = await syncTouringFile(prisma, hebrewTheatrePath);
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
      const khanResult = await syncTouringFile(prisma, khanPath);
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
      const gesherResult = await syncTouringFile(prisma, gesherPath);
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
      const haifaResult = await syncTouringFile(prisma, haifaPath);
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
      const tmunaResult = await syncTouringFile(prisma, tmunaPath);
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
      const beerShevaResult = await syncTouringFile(prisma, beerShevaPath);
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
      const tzavtaResult = await syncTouringFile(prisma, tzavtaPath);
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
      const habimaResult = await syncTouringFile(prisma, habimaPath);
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
