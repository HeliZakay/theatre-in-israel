// Read-only diagnostic — no writes.
// Run with: dotenv -e .env.production -- node scripts/diagnose-haifa-stale.mjs

import { PrismaClient } from "@prisma/client";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

neonConfig.webSocketConstructor = ws;
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SLUG = "היומן";

const show = await prisma.show.findUnique({
  where: { slug: SLUG },
  select: { id: true, slug: true, theatre: true },
});
console.log("Show:", show);

// All venues that have any event for this show
const eventsForShow = await prisma.event.findMany({
  where: { showId: show.id },
  select: { id: true, date: true, hour: true, venue: { select: { id: true, name: true, city: true } } },
  orderBy: [{ date: "asc" }, { hour: "asc" }],
});

console.log(`\nTotal events for ${SLUG}: ${eventsForShow.length}`);

const byVenue = new Map();
for (const e of eventsForShow) {
  const key = `${e.venue.id}|${e.venue.name}|${e.venue.city}`;
  byVenue.set(key, (byVenue.get(key) || 0) + 1);
}
console.log("\nPer venue:");
for (const [k, n] of byVenue) console.log(`  ${n.toString().padStart(3)}  ${k}`);

// Events on 2026-05-15 12:00 specifically
const may15 = eventsForShow.filter(
  (e) => e.date.toISOString().slice(0, 10) === "2026-05-15" && e.hour === "12:00",
);
console.log(`\nEvents on 2026-05-15 12:00 (the duplicates):`);
for (const e of may15) console.log(`  id=${e.id}  venue=${e.venue.name} | ${e.venue.city} (venueId=${e.venue.id})`);

// Wipe protection check: total events for ALL shows of the same theatre
if (show.theatre) {
  const showsInTheatre = await prisma.show.findMany({
    where: { theatre: show.theatre },
    select: { id: true, slug: true },
  });
  const showIds = showsInTheatre.map((s) => s.id);
  const totalEventsForTheatre = await prisma.event.count({
    where: { showId: { in: showIds } },
  });
  console.log(`\nTheatre: ${show.theatre}`);
  console.log(`  ${showsInTheatre.length} shows in this theatre`);
  console.log(`  ${totalEventsForTheatre} total events in DB for those shows`);
  console.log(`  Wipe-protection threshold (existing * 0.3): ${(totalEventsForTheatre * 0.3).toFixed(1)}`);
  console.log(`  Latest scrape size: 22 events → wipe protection ${22 < totalEventsForTheatre * 0.3 ? "TRIGGERS (skip deletion)" : "does NOT trigger"}`);
}

// All venue rows whose name contains "במה ראשית" or city is "לא ידוע"
const suspectVenues = await prisma.venue.findMany({
  where: {
    OR: [
      { name: { contains: "במה ראשית" } },
      { city: "לא ידוע" },
    ],
  },
  select: { id: true, name: true, city: true, _count: { select: { events: true } } },
});
console.log(`\nSuspect venue rows (במה ראשית* or city=לא ידוע):`);
for (const v of suspectVenues) {
  console.log(`  venueId=${v.id}  ${v.name} | ${v.city}  (${v._count.events} events)`);
}

// How many events sit on those suspect venues, grouped by show, to size the blast radius
const suspectVenueIds = suspectVenues.map((v) => v.id);
if (suspectVenueIds.length > 0) {
  const staleEvents = await prisma.event.findMany({
    where: { venueId: { in: suspectVenueIds } },
    select: { showId: true, venue: { select: { name: true, city: true } }, show: { select: { slug: true, theatre: true } } },
  });
  const grouped = new Map();
  for (const e of staleEvents) {
    const k = `${e.show.slug} (${e.show.theatre || "—"})  →  ${e.venue.name} | ${e.venue.city}`;
    grouped.set(k, (grouped.get(k) || 0) + 1);
  }
  console.log(`\nStale events grouped by show → venue:`);
  for (const [k, n] of [...grouped.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${n.toString().padStart(3)}  ${k}`);
  }
}

await prisma.$disconnect();
