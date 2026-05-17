// Cleanup: merge stale Venue rows created by the tomix scraper's naive
// comma-split (it treated a sub-location/city-suffix as the city):
//   - "אודיטוריום סמולרש" | "אוניברסיטת תל אביב"  →  "תל אביב"
//   - "צוותא"             | "תל אביב-יפו"          →  "תל אביב"
//
// For each stale row: if a canonical (same name, correct city) row exists,
// move its events over (skipping duplicates) and delete the stale row.
// Otherwise just update the city in place.
//
// Dry-run by default; --apply to commit.

import { PrismaClient } from "@prisma/client";

const url = process.env.DATABASE_URL;
const isNeon = !!url && new URL(url).hostname.endsWith(".neon.tech");

let adapter;
if (isNeon) {
  const { neonConfig } = await import("@neondatabase/serverless");
  const { PrismaNeon } = await import("@prisma/adapter-neon");
  const ws = (await import("ws")).default;
  neonConfig.webSocketConstructor = ws;
  adapter = new PrismaNeon({ connectionString: url });
} else {
  const { PrismaPg } = await import("@prisma/adapter-pg");
  adapter = new PrismaPg({ connectionString: url });
}
const prisma = new PrismaClient({ adapter });

const APPLY = process.argv.includes("--apply");

const FIXES = [
  { name: "אודיטוריום סמולרש", staleCity: "אוניברסיטת תל אביב", correctCity: "תל אביב" },
  { name: "צוותא", staleCity: "תל אביב-יפו", correctCity: "תל אביב" },
];

async function main() {
  console.log(`Mode: ${APPLY ? "APPLY (writes)" : "DRY-RUN (no writes)"}\n`);

  const plan = [];

  for (const fix of FIXES) {
    const stale = await prisma.venue.findFirst({
      where: { name: fix.name, city: fix.staleCity },
    });
    if (!stale) {
      console.log(`[skip] no stale row for ${fix.name} | ${fix.staleCity}`);
      continue;
    }

    const canonical = await prisma.venue.findFirst({
      where: { name: fix.name, city: fix.correctCity },
    });

    const events = await prisma.event.findMany({
      where: { venueId: stale.id },
      select: { id: true, showId: true, date: true, hour: true },
    });

    console.log(
      `\nStale venueId=${stale.id} (${stale.name} | ${stale.city}) — ${events.length} events`,
    );

    if (!canonical) {
      console.log(`  [rename] no canonical row exists → would set city = "${fix.correctCity}"`);
      plan.push({ kind: "rename", staleId: stale.id, newCity: fix.correctCity });
      continue;
    }

    console.log(`  Canonical venueId=${canonical.id} (${canonical.name} | ${canonical.city})`);
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
        console.log(`    [delete-dup] eventId=${e.id} show=${e.showId} ${date} ${e.hour} (canonical has eventId=${dup.id})`);
        plan.push({ kind: "delete-event", eventId: e.id });
      } else {
        console.log(`    [move]       eventId=${e.id} show=${e.showId} ${date} ${e.hour} → venueId=${canonical.id}`);
        plan.push({ kind: "move-event", eventId: e.id, toVenueId: canonical.id });
      }
    }
    plan.push({ kind: "delete-venue", venueId: stale.id });
  }

  if (!APPLY) {
    console.log(`\nDry-run complete (${plan.length} ops). Re-run with --apply to commit.`);
    await prisma.$disconnect();
    return;
  }

  console.log("\nApplying changes…");
  await prisma.$transaction(async (tx) => {
    for (const op of plan) {
      if (op.kind === "rename") {
        await tx.venue.update({ where: { id: op.staleId }, data: { city: op.newCity } });
      } else if (op.kind === "delete-event") {
        await tx.event.delete({ where: { id: op.eventId } });
      } else if (op.kind === "move-event") {
        await tx.event.update({ where: { id: op.eventId }, data: { venueId: op.toVenueId } });
      } else if (op.kind === "delete-venue") {
        const count = await tx.event.count({ where: { venueId: op.venueId } });
        if (count === 0) {
          await tx.venue.delete({ where: { id: op.venueId } });
          console.log(`  Deleted venueId=${op.venueId}`);
        } else {
          console.warn(`  Skipping venueId=${op.venueId} delete — still has ${count} events`);
        }
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
