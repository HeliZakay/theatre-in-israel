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
// 1. Read events.json
// ---------------------------------------------------------------------------
const dataPath = path.join(__dirname, "data", "events.json");
let data;
try {
  data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
} catch (err) {
  console.error("Failed to read events.json:", err.message);
  process.exit(1);
}

if (
  !data.scrapedAt ||
  !Array.isArray(data.events) ||
  data.events.length === 0
) {
  console.log("No events to sync");
  process.exit(0);
}

// ---------------------------------------------------------------------------
// 2. Create Prisma client with Neon / pg adapter detection (mirrors prisma.ts)
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
// 3. Sync
// ---------------------------------------------------------------------------
async function main() {
  const prisma = createPrismaClient();

  try {
    // Upsert venue
    const venue = await prisma.venue.upsert({
      where: {
        name_city: { name: data.venue.name, city: data.venue.city },
      },
      create: { name: data.venue.name, city: data.venue.city },
      update: {},
    });

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

    console.log(`Synced ${synced} events for venue ${data.venue.name}`);
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
