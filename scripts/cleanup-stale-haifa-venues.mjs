// Cleanup stale Haifa Theatre venue rows + their events.
// Dry-run by default; pass --apply to commit.
//
// Run:
//   set -a; source .env.production; set +a
//   node scripts/cleanup-stale-haifa-venues.mjs          # dry-run
//   node scripts/cleanup-stale-haifa-venues.mjs --apply  # commit

import { PrismaClient } from "@prisma/client";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

neonConfig.webSocketConstructor = ws;
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const APPLY = process.argv.includes("--apply");

// Canonical Haifa Theatre venue
const CANONICAL = { id: 21, name: "תיאטרון חיפה", city: "חיפה" };

// Stale venue rows to merge into CANONICAL
const STALE_VENUE_IDS = [
  12791, // במה ראשית | לא ידוע
  17301, // במה ראשית | חיפה
  15269, // במה 3 | לא ידוע
];

async function main() {
  console.log(`Mode: ${APPLY ? "APPLY (writes)" : "DRY-RUN (no writes)"}`);
  console.log(`Canonical target: venueId=${CANONICAL.id} ${CANONICAL.name} | ${CANONICAL.city}\n`);

  // Sanity: confirm canonical exists
  const canonical = await prisma.venue.findUnique({ where: { id: CANONICAL.id } });
  if (!canonical || canonical.name !== CANONICAL.name || canonical.city !== CANONICAL.city) {
    throw new Error(`Canonical venue ${CANONICAL.id} mismatch in DB: ${JSON.stringify(canonical)}`);
  }

  // ---- Step 1: re-point events from stale venues to canonical ----
  let updateCount = 0;
  let deleteDupCount = 0;
  const moves = []; // {eventId, fromVenueId, action: "update"|"delete-dup"}
  // Track (show,date,hour) tuples that will exist at the canonical venue after
  // earlier moves in this run, so a second stale event for the same slot is
  // correctly treated as a duplicate (avoiding a unique-constraint crash).
  const plannedCanonical = new Set();

  for (const staleId of STALE_VENUE_IDS) {
    const staleVenue = await prisma.venue.findUnique({ where: { id: staleId } });
    const staleEvents = await prisma.event.findMany({
      where: { venueId: staleId },
      select: { id: true, showId: true, date: true, hour: true, sourceUrl: true, ticketUrl: true },
    });
    console.log(`\nStale venue ${staleId} (${staleVenue?.name} | ${staleVenue?.city}) — ${staleEvents.length} events`);

    for (const e of staleEvents) {
      // Does a canonical-venue event already exist for (showId, date, hour)?
      const existing = await prisma.event.findUnique({
        where: {
          showId_venueId_date_hour: {
            showId: e.showId,
            venueId: CANONICAL.id,
            date: e.date,
            hour: e.hour,
          },
        },
        select: { id: true, sourceUrl: true, ticketUrl: true },
      });

      const slotKey = `${e.showId}|${e.date.toISOString()}|${e.hour}`;

      if (existing) {
        // Canonical row already there → drop the stale duplicate.
        moves.push({ eventId: e.id, fromVenueId: staleId, showId: e.showId, date: e.date.toISOString().slice(0, 10), hour: e.hour, action: "delete-dup", canonicalEventId: existing.id });
        deleteDupCount++;
      } else if (plannedCanonical.has(slotKey)) {
        // An earlier stale event in this same run will become the canonical
        // row for this slot — treat this one as a duplicate of that plan.
        moves.push({ eventId: e.id, fromVenueId: staleId, showId: e.showId, date: e.date.toISOString().slice(0, 10), hour: e.hour, action: "delete-dup", canonicalEventId: "(planned in this run)" });
        deleteDupCount++;
      } else {
        // Move the event to canonical.
        moves.push({ eventId: e.id, fromVenueId: staleId, showId: e.showId, date: e.date.toISOString().slice(0, 10), hour: e.hour, action: "update" });
        plannedCanonical.add(slotKey);
        updateCount++;
      }
    }
  }

  console.log(`\nPlanned event changes: ${updateCount} re-pointed, ${deleteDupCount} dropped as duplicates`);
  // Annotate each move with the show slug for readability
  const showIds = [...new Set(moves.map((m) => m.showId))];
  const shows = await prisma.show.findMany({ where: { id: { in: showIds } }, select: { id: true, slug: true } });
  const slugById = new Map(shows.map((s) => [s.id, s.slug]));

  console.log(`\nDetail (all ${moves.length}):`);
  for (const m of moves) {
    const slug = slugById.get(m.showId) || `show=${m.showId}`;
    console.log(`  [${m.action}] eventId=${m.eventId} ${slug} ${m.date} ${m.hour} (from venue ${m.fromVenueId}${m.canonicalEventId ? `, dup of eventId=${m.canonicalEventId}` : ""})`);
  }

  // ---- Step 2: identify empty "לא ידוע" venue rows to delete ----
  const emptyUnknownVenues = await prisma.venue.findMany({
    where: { city: "לא ידוע", events: { none: {} } },
    select: { id: true, name: true, city: true },
  });
  console.log(`\nEmpty 'לא ידוע' venue rows to delete: ${emptyUnknownVenues.length}`);
  for (const v of emptyUnknownVenues) console.log(`  venueId=${v.id}  ${v.name} | ${v.city}`);

  // Plus the 3 stale venue rows themselves, if they become empty after step 1
  console.log(`\nStale venue rows to delete after re-pointing (if empty): ${STALE_VENUE_IDS.join(", ")}`);

  if (!APPLY) {
    console.log("\nDry-run complete. Re-run with --apply to commit.");
    await prisma.$disconnect();
    return;
  }

  // ---- APPLY ----
  console.log("\nApplying changes…");
  await prisma.$transaction(async (tx) => {
    for (const m of moves) {
      if (m.action === "delete-dup") {
        await tx.event.delete({ where: { id: m.eventId } });
      } else {
        await tx.event.update({ where: { id: m.eventId }, data: { venueId: CANONICAL.id } });
      }
    }
    // Delete empty unknown-city venue rows
    if (emptyUnknownVenues.length > 0) {
      await tx.venue.deleteMany({ where: { id: { in: emptyUnknownVenues.map((v) => v.id) } } });
    }
    // Delete the now-empty stale venue rows
    for (const id of STALE_VENUE_IDS) {
      const count = await tx.event.count({ where: { venueId: id } });
      if (count === 0) {
        await tx.venue.delete({ where: { id } });
      } else {
        console.warn(`  Skipping venue ${id} delete — still has ${count} events`);
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
