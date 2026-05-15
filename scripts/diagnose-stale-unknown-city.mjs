// Read-only diagnostic for the 2 remaining "לא ידוע" stale events.
// Run: set -a; source .env.production; set +a; node scripts/diagnose-stale-unknown-city.mjs

import { PrismaClient } from "@prisma/client";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

neonConfig.webSocketConstructor = ws;
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const CASES = [
  { slug: "דרושה-עוזרת", staleVenueId: 19647 },        // תיאטרון יוקנעם | לא ידוע
  { slug: "זוגיות-AI", staleVenueId: 18670 },          // היכל התרבות ספי ריבלין... | לא ידוע
];

for (const { slug, staleVenueId } of CASES) {
  console.log(`\n========== ${slug} ==========`);
  const show = await prisma.show.findUnique({
    where: { slug },
    select: { id: true, slug: true, theatre: true },
  });
  console.log("Show:", show);

  const events = await prisma.event.findMany({
    where: { showId: show.id },
    select: {
      id: true,
      date: true,
      hour: true,
      venue: { select: { id: true, name: true, city: true } },
    },
    orderBy: [{ date: "asc" }, { hour: "asc" }],
  });
  console.log(`\nTotal events: ${events.length}`);

  const byVenue = new Map();
  for (const e of events) {
    const key = `${e.venue.id}|${e.venue.name}|${e.venue.city}`;
    byVenue.set(key, (byVenue.get(key) || 0) + 1);
  }
  console.log("Per venue:");
  for (const [k, n] of byVenue) console.log(`  ${n.toString().padStart(3)}  ${k}`);

  // The stale event(s) at the unknown-city venue
  const staleEvents = events.filter((e) => e.venue.id === staleVenueId);
  console.log(`\nStale event(s) at venueId=${staleVenueId}:`);
  for (const e of staleEvents) {
    console.log(`  id=${e.id}  ${e.date.toISOString().slice(0, 10)} ${e.hour}  venue=${e.venue.name} | ${e.venue.city}`);
  }

  // Look for sibling venue rows with same name (or similar) but a real city
  const staleVenue = await prisma.venue.findUnique({ where: { id: staleVenueId } });
  const candidates = await prisma.venue.findMany({
    where: {
      name: staleVenue.name,
      NOT: { id: staleVenueId },
    },
    select: { id: true, name: true, city: true, _count: { select: { events: true } } },
  });
  console.log(`\nOther venue rows with name="${staleVenue.name}":`);
  if (candidates.length === 0) console.log("  (none — this is the only row with this name)");
  for (const v of candidates) console.log(`  venueId=${v.id}  ${v.name} | ${v.city}  (${v._count.events} events)`);

  // For each stale event, check if a sibling-venue event at the same (date,hour) already exists
  if (candidates.length > 0 && staleEvents.length > 0) {
    console.log(`\nDuplicate check — is there already an event at a known-city sibling venue for the same (date,hour)?`);
    for (const e of staleEvents) {
      const dups = await prisma.event.findMany({
        where: {
          showId: show.id,
          date: e.date,
          hour: e.hour,
          venueId: { in: candidates.map((c) => c.id) },
        },
        select: { id: true, venue: { select: { name: true, city: true } } },
      });
      if (dups.length === 0) {
        console.log(`  eventId=${e.id} (${e.date.toISOString().slice(0, 10)} ${e.hour}): NO duplicate — re-pointing it to a real-city venue is safe.`);
      } else {
        for (const d of dups) {
          console.log(`  eventId=${e.id} (${e.date.toISOString().slice(0, 10)} ${e.hour}): DUPLICATE of eventId=${d.id} at ${d.venue.name} | ${d.venue.city} — stale row can be deleted.`);
        }
      }
    }
  }

  // Check the JSON file(s) for what the scraper currently emits for this venue
}

await prisma.$disconnect();
