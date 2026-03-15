#!/usr/bin/env node
/**
 * One-time production fix:
 *  1. Rename אייפורט סיטי → איירפורט סיטי (typo fix) + set region=center
 *  2. Fix venues with city "אקספו ת"א" → city "תל אביב" + region=center
 *  3. Fix venues with city מודיעין → region=jerusalem (was shfela)
 *  4. Fix venues with city איירפורט סיטי → region=center (was shfela)
 *
 * Runs inside a transaction — all-or-nothing.
 */

import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

dotenv.config({ path: ".env.production.local", override: true });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const allVenues = await prisma.venue.findMany({ orderBy: { id: "asc" } });

  console.log(`Total venues: ${allVenues.length}\n`);

  // --- 1. Find venues with the typo אייפורט סיטי ---
  const typoVenues = allVenues.filter((v) => v.city === "אייפורט סיטי");
  console.log(`Venues with city "אייפורט סיטי" (typo): ${typoVenues.length}`);
  for (const v of typoVenues) console.log(`  [${v.id}] ${v.name} | ${v.city} | region=${v.region}`);

  // --- 2. Find venues with city "אקספו ת"א" or "אקספו ת״א" ---
  const expoVenues = allVenues.filter((v) => v.city === 'אקספו ת"א' || v.city === "אקספו ת״א");
  console.log(`\nVenues with city "אקספו ת"א": ${expoVenues.length}`);
  for (const v of expoVenues) console.log(`  [${v.id}] ${v.name} | ${v.city} | region=${v.region}`);

  // --- 3. Find venues with city מודיעין ---
  const modiinVenues = allVenues.filter((v) => v.city === "מודיעין");
  console.log(`\nVenues with city "מודיעין": ${modiinVenues.length}`);
  for (const v of modiinVenues) console.log(`  [${v.id}] ${v.name} | ${v.city} | region=${v.region}`);

  // --- 4. Find venues with city איירפורט סיטי (correct spelling, wrong region) ---
  const airportCorrectVenues = allVenues.filter((v) => v.city === "איירפורט סיטי");
  console.log(`\nVenues with city "איירפורט סיטי" (correct spelling): ${airportCorrectVenues.length}`);
  for (const v of airportCorrectVenues) console.log(`  [${v.id}] ${v.name} | ${v.city} | region=${v.region}`);

  // Check if canonical venue already exists for typo venues
  for (const tv of typoVenues) {
    const canonicalName = tv.name.replace("אייפורט סיטי", "איירפורט סיטי");
    const existing = allVenues.find((v) => v.name === canonicalName && v.city === "איירפורט סיטי");
    if (existing) {
      console.log(`\n⚠ Canonical venue already exists: [${existing.id}] ${existing.name} | ${existing.city}`);
      console.log(`  Will move events from [${tv.id}] to [${existing.id}] and delete [${tv.id}]`);
    }
  }

  // Check if canonical venue already exists for expo venues
  for (const ev of expoVenues) {
    const existing = allVenues.find((v) => v.name === ev.name && v.city === "תל אביב");
    if (existing) {
      console.log(`\n⚠ Canonical venue already exists: [${existing.id}] ${existing.name} | ${existing.city}`);
      console.log(`  Will move events from [${ev.id}] to [${existing.id}] and delete [${ev.id}]`);
    }
  }

  console.log("\n--- Applying fixes in transaction ---\n");

  await prisma.$transaction(async (tx) => {
    // Fix 1: Rename אייפורט → איירפורט venues
    for (const tv of typoVenues) {
      const canonicalName = tv.name.replace("אייפורט סיטי", "איירפורט סיטי");
      const existing = allVenues.find((v) => v.name === canonicalName && v.city === "איירפורט סיטי");

      if (existing) {
        // Move events from typo venue to canonical venue
        const moved = await tx.event.updateMany({
          where: { venueId: tv.id },
          data: { venueId: existing.id },
        });
        console.log(`  Moved ${moved.count} events from [${tv.id}] to [${existing.id}]`);

        // Update canonical venue region
        await tx.venue.update({
          where: { id: existing.id },
          data: { region: "center" },
        });
        console.log(`  Updated [${existing.id}] region → center`);

        // Delete typo venue
        await tx.venue.delete({ where: { id: tv.id } });
        console.log(`  Deleted typo venue [${tv.id}] "${tv.name}"`);
      } else {
        // Just rename in place
        await tx.venue.update({
          where: { id: tv.id },
          data: { name: canonicalName, city: "איירפורט סיטי", region: "center" },
        });
        console.log(`  Renamed [${tv.id}] → "${canonicalName}" | "איירפורט סיטי" | center`);
      }
    }

    // Fix 2: Fix אקספו ת"א venues → city תל אביב
    for (const ev of expoVenues) {
      const existing = allVenues.find((v) => v.name === ev.name && v.city === "תל אביב");

      if (existing) {
        // Move events from expo venue to existing תל אביב venue
        const moved = await tx.event.updateMany({
          where: { venueId: ev.id },
          data: { venueId: existing.id },
        });
        console.log(`  Moved ${moved.count} events from [${ev.id}] to [${existing.id}]`);

        // Ensure region is center
        await tx.venue.update({
          where: { id: existing.id },
          data: { region: "center" },
        });

        // Delete expo venue
        await tx.venue.delete({ where: { id: ev.id } });
        console.log(`  Deleted expo venue [${ev.id}] "${ev.name}" | "${ev.city}"`);
      } else {
        // Just fix city
        await tx.venue.update({
          where: { id: ev.id },
          data: { city: "תל אביב", region: "center" },
        });
        console.log(`  Fixed [${ev.id}] city → "תל אביב" | center`);
      }
    }

    // Fix 3: מודיעין → region jerusalem
    for (const mv of modiinVenues) {
      await tx.venue.update({
        where: { id: mv.id },
        data: { region: "jerusalem" },
      });
      console.log(`  Fixed [${mv.id}] "${mv.name}" region → jerusalem`);
    }

    // Fix 4: איירפורט סיטי (correct spelling) → region center
    for (const av of airportCorrectVenues) {
      await tx.venue.update({
        where: { id: av.id },
        data: { region: "center" },
      });
      console.log(`  Fixed [${av.id}] "${av.name}" region → center`);
    }
  });

  // Verify
  console.log("\n--- Verification ---\n");
  const updatedVenues = await prisma.venue.findMany({
    where: {
      OR: [
        { city: "איירפורט סיטי" },
        { city: "מודיעין" },
        { city: "אייפורט סיטי" },
        { city: 'אקספו ת"א' },
        { city: "אקספו ת״א" },
      ],
    },
    orderBy: { id: "asc" },
  });

  for (const v of updatedVenues) {
    console.log(`  [${v.id}] ${v.name} | ${v.city} | region=${v.region}`);
  }

  const remainingTypo = updatedVenues.filter((v) => v.city === "אייפורט סיטי");
  const remainingExpo = updatedVenues.filter((v) => v.city === 'אקספו ת"א' || v.city === "אקספו ת״א");

  if (remainingTypo.length > 0 || remainingExpo.length > 0) {
    console.error("❌ Some venues still have old values!");
  } else {
    console.log("\n✅ All venue fixes applied successfully.");
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
