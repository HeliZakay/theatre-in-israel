#!/usr/bin/env node
/**
 * READ-ONLY script — checks the production DB for stale/duplicate venue records.
 * Reports which venues are aliases of a canonical venue, how many events reference
 * them, and what the safe cleanup plan would be. Does NOT modify anything.
 *
 * Usage: node scripts/check-prod-venues.mjs
 */

import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

dotenv.config({ path: ".env.production.local", override: true });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Same alias map as sync-events.js
const VENUE_ALIASES = new Map([
  ['בית החייל ת"א|תל אביב', { name: "בית החייל תל אביב", city: "תל אביב" }],
  ["בית ציוני אמריקה|תל אביב-יפו", { name: "בית ציוני אמריקה", city: "תל אביב" }],
  ["בית ציוני אמריקה תל אביב-אולם מאירהוף|תל אביב", { name: "בית ציוני אמריקה", city: "תל אביב" }],
  ["היכל אומנוית הבמה - הרצליה|הרצליה", { name: "היכל אמנויות הבמה הרצליה", city: "הרצליה" }],
  ["היכל התיאטרון מוצקין|קריית מוצקין", { name: "היכל התיאטרון קריית מוצקין", city: "קריית מוצקין" }],
  ["היכל התרבות איירפורט סיטי|קריית שדה התעופה", { name: "היכל התרבות אייפורט סיטי", city: "אייפורט סיטי" }],
  ["היכל התרבות בית העם רחובות|רחובות", { name: "בית העם רחובות", city: "רחובות" }],
]);

async function main() {
  const allVenues = await prisma.venue.findMany({ orderBy: { id: "asc" } });

  console.log(`Total venues in production: ${allVenues.length}\n`);

  // Find stale venues (ones whose name|city matches an alias key)
  const staleVenues = [];
  for (const v of allVenues) {
    const key = `${v.name}|${v.city}`;
    const canonical = VENUE_ALIASES.get(key);
    if (canonical) {
      staleVenues.push({ ...v, canonical });
    }
  }

  if (staleVenues.length === 0) {
    console.log("No stale venue records found. Production is clean.");
    await prisma.$disconnect();
    return;
  }

  console.log(`Found ${staleVenues.length} stale venue(s):\n`);

  for (const sv of staleVenues) {
    const eventCount = await prisma.event.count({ where: { venueId: sv.id } });

    // Find the canonical venue record
    const canonicalRecord = allVenues.find(
      (v) => v.name === sv.canonical.name && v.city === sv.canonical.city
    );

    console.log(`  Stale: id=${sv.id}  "${sv.name}" (${sv.city})`);
    console.log(`  Canon: ${canonicalRecord ? `id=${canonicalRecord.id}` : "NOT FOUND"}  "${sv.canonical.name}" (${sv.canonical.city})`);
    console.log(`  Events referencing stale venue: ${eventCount}`);

    if (eventCount > 0 && !canonicalRecord) {
      console.log(`  ⚠ CAUTION: canonical venue does not exist yet — must create it before migrating events`);
    } else if (eventCount > 0) {
      console.log(`  → Would migrate ${eventCount} events to venue ${canonicalRecord.id}, then delete venue ${sv.id}`);
    } else {
      console.log(`  → Would delete venue ${sv.id} (no events to migrate)`);
    }
    console.log();
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
