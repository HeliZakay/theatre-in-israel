// Cleanup the 2 remaining "לא ידוע" stale events:
//   Case 1 — Theatron Yokneam: only one venue row exists; just fix the city.
//   Case 2 — Spy Rivlin: re-point the 1 event to the נתניה sibling row,
//            then delete the empty obsolete rows.
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

// ---- Case 1: just update the city on the existing venue row ----
const CASE1 = {
  venueId: 19647,
  expectedName: "תיאטרון יוקנעם",
  expectedOldCity: "לא ידוע",
  newCity: "יוקנעם",
};

// ---- Case 2: re-point event(s) from stale row → canonical row, then drop empty rows ----
const CASE2 = {
  expectedName: 'היכל התרבות "ספי ריבלין" מרכז קהילתי קריית השרון',
  canonicalVenueId: 18365, // city=נתניה
  staleVenueIds: [18670, 16662], // לא ידוע (has event), תל אביב (empty)
};

async function main() {
  console.log(`Mode: ${APPLY ? "APPLY (writes)" : "DRY-RUN (no writes)"}\n`);

  // ---------- CASE 1 ----------
  console.log("========== Case 1: תיאטרון יוקנעם ==========");
  const c1Venue = await prisma.venue.findUnique({ where: { id: CASE1.venueId } });
  if (!c1Venue) throw new Error(`Case 1 venue ${CASE1.venueId} not found`);
  if (c1Venue.name !== CASE1.expectedName) throw new Error(`Case 1 name mismatch: ${c1Venue.name}`);
  if (c1Venue.city !== CASE1.expectedOldCity) {
    console.log(`  Skipping — venueId=${CASE1.venueId} city is already "${c1Venue.city}" (not "${CASE1.expectedOldCity}")`);
  } else {
    console.log(`  Plan: venueId=${CASE1.venueId} (${c1Venue.name}) city "${c1Venue.city}" → "${CASE1.newCity}"`);
  }

  // Sanity: any other venue rows with same name? (would mean we need merge logic instead)
  const c1Siblings = await prisma.venue.findMany({
    where: { name: CASE1.expectedName, NOT: { id: CASE1.venueId } },
    select: { id: true, name: true, city: true },
  });
  if (c1Siblings.length > 0) {
    console.log(`  ⚠ Other rows with same name exist — review before applying:`);
    for (const s of c1Siblings) console.log(`    venueId=${s.id} city=${s.city}`);
  } else {
    console.log(`  ✓ No sibling rows — safe to just update city in place.`);
  }

  // ---------- CASE 2 ----------
  console.log("\n========== Case 2: היכל התרבות ספי ריבלין ==========");
  const canonical = await prisma.venue.findUnique({ where: { id: CASE2.canonicalVenueId } });
  if (!canonical) throw new Error(`Case 2 canonical ${CASE2.canonicalVenueId} not found`);
  console.log(`  Canonical: venueId=${canonical.id} ${canonical.name} | ${canonical.city}`);

  const moves = [];
  for (const staleId of CASE2.staleVenueIds) {
    const stale = await prisma.venue.findUnique({ where: { id: staleId } });
    if (!stale) {
      console.log(`  venueId=${staleId} not found — skipping`);
      continue;
    }
    const events = await prisma.event.findMany({
      where: { venueId: staleId },
      select: { id: true, showId: true, date: true, hour: true },
    });
    console.log(`\n  Stale venueId=${staleId} (${stale.name} | ${stale.city}) — ${events.length} events`);

    for (const e of events) {
      // Does the canonical venue already have an event for this slot?
      const dup = await prisma.event.findUnique({
        where: {
          showId_venueId_date_hour: {
            showId: e.showId,
            venueId: CASE2.canonicalVenueId,
            date: e.date,
            hour: e.hour,
          },
        },
        select: { id: true },
      });
      const date = e.date.toISOString().slice(0, 10);
      if (dup) {
        console.log(`    [delete-dup] eventId=${e.id} show=${e.showId} ${date} ${e.hour} (canonical already exists: eventId=${dup.id})`);
        moves.push({ eventId: e.id, action: "delete-dup" });
      } else {
        console.log(`    [update]     eventId=${e.id} show=${e.showId} ${date} ${e.hour} → venueId=${CASE2.canonicalVenueId}`);
        moves.push({ eventId: e.id, action: "update" });
      }
    }
  }

  if (!APPLY) {
    console.log("\nDry-run complete. Re-run with --apply to commit.");
    await prisma.$disconnect();
    return;
  }

  // ---------- APPLY ----------
  console.log("\nApplying changes…");
  await prisma.$transaction(async (tx) => {
    // Case 1
    if (c1Venue.city === CASE1.expectedOldCity) {
      await tx.venue.update({ where: { id: CASE1.venueId }, data: { city: CASE1.newCity } });
    }

    // Case 2: event moves / deletes
    for (const m of moves) {
      if (m.action === "delete-dup") {
        await tx.event.delete({ where: { id: m.eventId } });
      } else {
        await tx.event.update({ where: { id: m.eventId }, data: { venueId: CASE2.canonicalVenueId } });
      }
    }

    // Case 2: drop now-empty stale venue rows
    for (const id of CASE2.staleVenueIds) {
      const count = await tx.event.count({ where: { venueId: id } });
      if (count === 0) {
        await tx.venue.delete({ where: { id } });
      } else {
        console.warn(`  Skipping venueId=${id} delete — still has ${count} events`);
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
