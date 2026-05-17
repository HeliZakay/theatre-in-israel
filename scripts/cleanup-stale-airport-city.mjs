// Cleanup: merge stale "היכל התרבות חבל מודיעין - איירפורט סיטי" venue row into
// the canonical "היכל התרבות איירפורט סיטי" row (both city = "איירפורט סיטי").
// The hashaa touring scraper emitted the long-form name; without an alias entry
// this created a duplicate Venue and showed duplicate events on show pages.
//
// Dry-run by default; --apply to commit.

import { PrismaClient } from "@prisma/client";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

neonConfig.webSocketConstructor = ws;
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const APPLY = process.argv.includes("--apply");

const CANONICAL = { name: "היכל התרבות איירפורט סיטי", city: "איירפורט סיטי" };
const STALE_NAMES = [
  "היכל התרבות חבל מודיעין - איירפורט סיטי",
];
const STALE_CITY = "איירפורט סיטי";

async function main() {
  console.log(`Mode: ${APPLY ? "APPLY (writes)" : "DRY-RUN (no writes)"}\n`);

  const canonical = await prisma.venue.findFirst({ where: CANONICAL });
  if (!canonical) throw new Error(`Canonical venue not found: ${CANONICAL.name} | ${CANONICAL.city}`);
  console.log(`Canonical: venueId=${canonical.id} ${canonical.name} | ${canonical.city}`);

  const stales = await prisma.venue.findMany({
    where: { name: { in: STALE_NAMES }, city: STALE_CITY },
  });
  if (stales.length === 0) {
    console.log("No stale rows found — nothing to do.");
    await prisma.$disconnect();
    return;
  }

  const moves = [];
  for (const stale of stales) {
    const events = await prisma.event.findMany({
      where: { venueId: stale.id },
      select: { id: true, showId: true, date: true, hour: true },
    });
    console.log(`\nStale venueId=${stale.id} (${stale.name} | ${stale.city}) — ${events.length} events`);

    for (const e of events) {
      const dup = await prisma.event.findUnique({
        where: {
          showId_venueId_date_hour: {
            showId: e.showId,
            venueId: canonical.id,
            date: e.date,
            hour: e.hour,
          },
        },
        select: { id: true },
      });
      const date = e.date.toISOString().slice(0, 10);
      if (dup) {
        console.log(`  [delete-dup] eventId=${e.id} show=${e.showId} ${date} ${e.hour} (canonical already has eventId=${dup.id})`);
        moves.push({ eventId: e.id, staleVenueId: stale.id, action: "delete-dup" });
      } else {
        console.log(`  [update]     eventId=${e.id} show=${e.showId} ${date} ${e.hour} → venueId=${canonical.id}`);
        moves.push({ eventId: e.id, staleVenueId: stale.id, action: "update" });
      }
    }
  }

  if (!APPLY) {
    console.log("\nDry-run complete. Re-run with --apply to commit.");
    await prisma.$disconnect();
    return;
  }

  console.log("\nApplying changes…");
  await prisma.$transaction(async (tx) => {
    for (const m of moves) {
      if (m.action === "delete-dup") {
        await tx.event.delete({ where: { id: m.eventId } });
      } else {
        await tx.event.update({ where: { id: m.eventId }, data: { venueId: canonical.id } });
      }
    }
    for (const stale of stales) {
      const count = await tx.event.count({ where: { venueId: stale.id } });
      if (count === 0) {
        await tx.venue.delete({ where: { id: stale.id } });
        console.log(`  Deleted stale venueId=${stale.id}`);
      } else {
        console.warn(`  Skipping venueId=${stale.id} delete — still has ${count} events`);
      }
    }
  });
  console.log("Done.");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
