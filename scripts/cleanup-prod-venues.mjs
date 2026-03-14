#!/usr/bin/env node
/**
 * Safely removes orphaned stale venue records from production.
 *
 * Safety guarantees:
 *  1. Only deletes venues whose name|city matches a known alias
 *  2. Aborts ALL changes if ANY stale venue still has events referencing it
 *  3. Runs inside a transaction — all-or-nothing
 *  4. Logs every step
 */

import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

dotenv.config({ path: ".env.production.local", override: true });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const VENUE_ALIASES = new Map([
  ['בית החייל ת"א|תל אביב', { name: "בית החייל תל אביב", city: "תל אביב" }],
  ["בית ציוני אמריקה|תל אביב", { name: "בית ציוני אמריקה ת״א", city: "תל אביב" }],
  ["בית ציוני אמריקה|תל אביב-יפו", { name: "בית ציוני אמריקה ת״א", city: "תל אביב" }],
  ["בית ציוני אמריקה תל אביב-אולם מאירהוף|תל אביב", { name: "בית ציוני אמריקה ת״א", city: "תל אביב" }],
  ["היכל אומנוית הבמה - הרצליה|הרצליה", { name: "היכל אמנויות הבמה הרצליה", city: "הרצליה" }],
  ["היכל התיאטרון מוצקין|קריית מוצקין", { name: "היכל התיאטרון קריית מוצקין", city: "קריית מוצקין" }],
  ["היכל התרבות איירפורט סיטי|קריית שדה התעופה", { name: "היכל התרבות אייפורט סיטי", city: "אייפורט סיטי" }],
  ["היכל התרבות בית העם רחובות|רחובות", { name: "בית העם רחובות", city: "רחובות" }],
]);

async function main() {
  const allVenues = await prisma.venue.findMany({ orderBy: { id: "asc" } });

  // Step 1: Identify stale venues
  const staleVenues = [];
  for (const v of allVenues) {
    const key = `${v.name}|${v.city}`;
    if (VENUE_ALIASES.has(key)) {
      staleVenues.push(v);
    }
  }

  console.log(`Found ${staleVenues.length} stale venue(s) to remove.`);

  if (staleVenues.length === 0) {
    console.log("Nothing to do.");
    await prisma.$disconnect();
    return;
  }

  // Step 2: Validate EVERY stale venue has 0 events — abort if not
  for (const sv of staleVenues) {
    const eventCount = await prisma.event.count({ where: { venueId: sv.id } });
    console.log(`  Venue ${sv.id} "${sv.name}" (${sv.city}) — ${eventCount} events`);

    if (eventCount > 0) {
      console.error(`\n❌ ABORTING: venue ${sv.id} still has ${eventCount} events. No changes made.`);
      await prisma.$disconnect();
      process.exit(1);
    }
  }

  console.log("\nAll stale venues have 0 events. Proceeding with deletion in a transaction...\n");

  // Step 3: Delete inside a transaction
  const staleIds = staleVenues.map((v) => v.id);

  await prisma.$transaction(async (tx) => {
    // Final safety check inside the transaction
    const eventsInTransaction = await tx.event.count({
      where: { venueId: { in: staleIds } },
    });

    if (eventsInTransaction > 0) {
      throw new Error(
        `ABORTING inside transaction: ${eventsInTransaction} events found referencing stale venues. Rolling back.`
      );
    }

    const result = await tx.venue.deleteMany({ where: { id: { in: staleIds } } });
    console.log(`Deleted ${result.count} stale venue records: [${staleIds.join(", ")}]`);
  });

  // Step 4: Verify final state
  const remaining = await prisma.venue.findMany({
    where: { id: { in: staleIds } },
  });

  if (remaining.length > 0) {
    console.error("❌ Verification failed — some venues still exist:", remaining);
  } else {
    console.log("✅ Verified: all stale venues removed. Production is clean.");
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
