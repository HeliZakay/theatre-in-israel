#!/usr/bin/env node
/**
 * Seed actors and actor-show associations.
 *
 * 1. Upserts Actor records from the curated ACTORS list.
 * 2. Scans all shows' `cast` field for actor name matches.
 * 3. Creates ShowActor join records.
 *
 * Usage:
 *   node scripts/seed-actors.mjs           # dry-run (prints matches)
 *   node scripts/seed-actors.mjs --apply   # writes to DB
 */

import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

dotenv.config({ path: ".env.local" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const apply = process.argv.includes("--apply");

const ACTORS = [
  { slug: "אביגיל-הררי", name: "אביגיל הררי", image: "/actors/אביגיל-הררי.webp" },
  { slug: "אבי-קושניר", name: "אבי קושניר", image: "/actors/אבי-קושניר.webp" },
  { slug: "אודיה-קורן", name: "אודיה קורן", image: "/actors/אודיה-קורן.webp" },
  { slug: "אולה-שור-סלקטר", name: "אולה שור סלקטר", image: "/actors/אולה-שור-סלקטר.webp" },
  { slug: "אוראל-צברי", name: "אוראל צברי", image: "/actors/אוראל-צברי.webp" },
  { slug: "אלון-סנדלר", name: "אלון סנדלר", image: "/actors/אלון-סנדלר.webp" },
  { slug: "אלי-גורנשטיין", name: "אלי גורנשטיין", image: "/actors/אלי-גורנשטיין.webp" },
  { slug: "אלכס-קרול", name: "אלכס קרול", image: "/actors/אלכס-קרול.webp" },
  { slug: "אילי-עלמני", name: "אילי עלמני", image: "/actors/אילי-עלמני.webp" },
  { slug: "אלעד-אטרקצ׳י", name: "אלעד אטרקצ׳י", image: "/actors/אלעד-אטרקצ׳י.webp" },
  { slug: "גילה-אלמגור", name: "גילה אלמגור", image: "/actors/גילה-אלמגור.webp" },
  { slug: "גילת-אנקורי", name: "גילת אנקורי", image: "/actors/גילת-אנקורי.webp" },
  { slug: "גלית-גיאת", name: "גלית גיאת", image: "/actors/גלית-גיאת.webp" },
  { slug: "דביר-בנדק", name: "דביר בנדק", image: "/actors/דביר-בנדק.webp" },
  { slug: "דור-הררי", name: "דור הררי", image: "/actors/דור-הררי.webp" },
  { slug: "דניאל-גל", name: "דניאל גל", image: "/actors/דניאל-גל.webp" },
  { slug: "דניאל-סטיופין", name: "דניאל סטיופין", image: "/actors/דניאל-סטיופין.webp" },
  { slug: "דרור-קרן", name: "דרור קרן", image: "/actors/דרור-קרן.webp" },
  { slug: "חני-פירסטנברג", name: "חני פירסטנברג", image: "/actors/חני-פירסטנברג.webp" },
  { slug: "חן-גרטי", name: "חן גרטי", image: "/actors/חן-גרטי.webp" },
  { slug: "חנה-לסלאו", name: "חנה לסלאו", image: "/actors/חנה-לסלאו.webp" },
  { slug: "חני-נחמיאס", name: "חני נחמיאס", image: "/actors/חני-נחמיאס.webp" },
  { slug: "טל-גרושקה", name: "טל גרושקה", image: "/actors/טל-גרושקה.webp" },
  { slug: "טל-מוסרי", name: "טל מוסרי", image: "/actors/טל-מוסרי.webp" },
  { slug: "טלי-אורן", name: "טלי אורן", image: "/actors/טלי-אורן.webp" },
  { slug: "יחזקאל-לזרוב", name: "יחזקאל לזרוב", image: "/actors/יחזקאל-לזרוב.webp" },
  { slug: "יונה-אליאן-קשת", name: "יונה אליאן קשת", image: "/actors/יונה-אליאן-קשת.webp" },
  { slug: "יורם-טולדנו", name: "יורם טולדנו", image: "/actors/יורם-טולדנו.webp" },
  { slug: "יניב-סויסה", name: "יניב סויסה", image: "/actors/יניב-סויסה.webp" },
  { slug: "יעל-לבנטל", name: "יעל לבנטל", image: "/actors/יעל-לבנטל.webp" },
  { slug: "יפתח-קליין", name: "יפתח קליין", image: "/actors/יפתח-קליין.webp" },
  { slug: "כינרת-לימוני", name: "כינרת לימוני", image: "/actors/כינרת-לימוני.webp" },
  { slug: "לי-בירן", name: "לי בירן", image: "/actors/לי-בירן.webp" },
  { slug: "ליא-קניג", name: "ליא קניג", image: "/actors/ליא-קניג.webp" },
  { slug: "ליאור-אשכנזי", name: "ליאור אשכנזי", image: "/actors/ליאור-אשכנזי.webp" },
  { slug: "לימור-גולדשטיין", name: "לימור גולדשטיין", image: "/actors/לימור-גולדשטיין.webp" },
  { slug: "לינוי-כהן", name: "לינוי כהן", image: "/actors/לינוי-כהן.webp" },
  { slug: "לֿאורה-ריבלין", name: "לֿאורה ריבלין", image: "/actors/לֿאורה-ריבלין.webp" },
  { slug: "מגי-אזרזר", name: "מגי אזרזר", image: "/actors/מגי-אזרזר.webp" },
  { slug: "מיקי-קם", name: "מיקי קם", image: "/actors/מיקי-קם.webp" },
  { slug: "מולי-שולמן", name: "מולי שולמן", image: "/actors/מולי-שולמן.webp" },
  { slug: "מיקה-צור", name: "מיקה צור", image: "/actors/מיקה-צור.webp" },
  { slug: "משי-קלינשטיין", name: "משי קלינשטיין", image: "/actors/משי-קלינשטיין.webp" },
  { slug: "נדב-אסולין", name: "נדב אסולין", image: "/actors/נדב-אסולין.webp" },
  { slug: "נדב-נייטס", name: "נדב נייטס", image: "/actors/נדב-נייטס.webp" },
  { slug: "נורמן-עיסא", name: "נורמן עיסא", image: "/actors/נורמן-עיסא.webp" },
  { slug: "נטע-גרטי", name: "נטע גרטי", image: "/actors/נטע-גרטי.webp" },
  { slug: "נועם-קלינשטיין", name: "נועם קלינשטיין", image: "/actors/נועם-קלינשטיין.webp" },
  { slug: "נעמי-הררי", name: "נעמי הררי", image: "/actors/נעמי-הררי.webp" },
  { slug: "נתן-דטנר", name: "נתן דטנר", image: "/actors/נתן-דטנר.webp" },
  { slug: "סנדרה-שדה", name: "סנדרה שדה", image: "/actors/סנדרה-שדה.webp" },
  { slug: "עידו-רוזנברג", name: "עידו רוזנברג", image: "/actors/עידו-רוזנברג.webp" },
  { slug: "עידן-אלתרמן", name: "עידן אלתרמן", image: "/actors/עידן-אלתרמן.webp" },
  { slug: "עירית-ענבי", name: "עירית ענבי", image: "/actors/עירית-ענבי.webp" },
  { slug: "עמוס-תמם", name: "עמוס תמם", image: "/actors/עמוס-תמם.webp" },
  { slug: "עופרי-ביטרמן", name: "עופרי ביטרמן", image: "/actors/עופרי-ביטרמן.webp" },
  { slug: "צביקה-הדר", name: "צביקה הדר", image: "/actors/צביקה-הדר.webp" },
  { slug: "צחי-הלוי", name: "צחי הלוי", image: "/actors/צחי-הלוי.webp" },
  { slug: "ציפי-שביט", name: "ציפי שביט", image: "/actors/ציפי-שביט.webp" },
  { slug: "קרן-מור", name: "קרן מור", image: "/actors/קרן-מור.webp" },
  { slug: "רביב-כנר", name: "רביב כנר", image: "/actors/רביב-כנר.webp" },
  { slug: "רוני-דלומי", name: "רוני דלומי", image: "/actors/רוני-דלומי.webp" },
  { slug: "רבקה-מיכאלי", name: "רבקה מיכאלי", image: "/actors/רבקה-מיכאלי.webp" },
  { slug: "רמי-ברוך", name: "רמי ברוך", image: "/actors/רמי-ברוך.webp" },
  { slug: "רן-דנקר", name: "רן דנקר", image: "/actors/רן-דנקר.webp" },
  { slug: "רפאל-עבאס", name: "רפאל עבאס", image: "/actors/רפאל-עבאס.webp" },
  { slug: "ריקי-בליך", name: "ריקי בליך", image: "/actors/ריקי-בליך.webp" },
  { slug: "תום-אבני", name: "תום אבני", image: "/actors/תום-אבני.webp" },
  { slug: "תום-חודורוב", name: "תום חודורוב", image: "/actors/תום-חודורוב.webp" },
  { slug: "תם-גל", name: "תם גל", image: "/actors/תם-גל.webp" },
];

async function main() {
  console.log(`Mode: ${apply ? "APPLY" : "DRY-RUN"}\n`);

  // 1. Upsert actors
  const actorRecords = new Map();
  for (const a of ACTORS) {
    if (apply) {
      const record = await prisma.actor.upsert({
        where: { name: a.name },
        create: { name: a.name, slug: a.slug, image: a.image },
        update: { slug: a.slug, image: a.image },
      });
      actorRecords.set(a.name, record.id);
      console.log(`  Actor upserted: ${a.name} (id=${record.id})`);
    } else {
      console.log(`  Would upsert actor: ${a.name} (slug=${a.slug})`);
    }
  }

  // 2. Fetch all shows with a cast field
  const shows = await prisma.show.findMany({
    where: { cast: { not: null } },
    select: { id: true, title: true, cast: true },
  });

  console.log(`\nScanning ${shows.length} shows for actor matches...\n`);

  let totalLinks = 0;

  for (const show of shows) {
    const cast = show.cast ?? "";
    const matched = ACTORS.filter((a) => cast.includes(a.name));
    if (matched.length === 0) continue;

    console.log(`  "${show.title}" (id=${show.id}):`);
    for (const a of matched) {
      console.log(`    -> ${a.name}`);
      totalLinks++;

      if (apply) {
        const actorId = actorRecords.get(a.name);
        await prisma.showActor.upsert({
          where: { showId_actorId: { showId: show.id, actorId } },
          create: { showId: show.id, actorId },
          update: {},
        });
      }
    }
  }

  console.log(`\nTotal actor-show links: ${totalLinks}`);
  if (!apply) {
    console.log("\nRun with --apply to write to DB.");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
