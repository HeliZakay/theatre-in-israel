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

/**
 * Normalize a string for actor-name matching.
 * Handles: Hebrew geresh ׳ (U+05F3) vs ASCII ' (U+0027),
 * hyphens vs spaces, and יי vs י spelling variants.
 */
function normalizeForMatch(s) {
  return s
    .replace(/\u05F3/g, "'")   // Hebrew geresh → ASCII apostrophe
    .replace(/-/g, " ")         // hyphen → space
    .replace(/יי/g, "י");       // collapse double-yod
}

const ACTORS = [
  { slug: "אביגיל-הררי", name: "אביגיל הררי", image: "/images/actors/אביגיל-הררי.webp" },
  { slug: "אבי-קושניר", name: "אבי קושניר", image: "/images/actors/אבי-קושניר.webp" },
  { slug: "אודיה-קורן", name: "אודיה קורן", image: "/images/actors/אודיה-קורן.webp" },
  { slug: "אולה-שור-סלקטר", name: "אולה שור סלקטר", image: "/images/actors/אולה-שור-סלקטר.webp" },
  { slug: "אוראל-צברי", name: "אוראל צברי", image: "/images/actors/אוראל-צברי.webp" },
  { slug: "אלון-סנדלר", name: "אלון סנדלר", image: "/images/actors/אלון-סנדלר.webp" },
  { slug: "אלי-גורנשטיין", name: "אלי גורנשטיין", image: "/images/actors/אלי-גורנשטיין.webp" },
  { slug: "אלכס-קרול", name: "אלכס קרול", image: "/images/actors/אלכס-קרול.webp" },
  { slug: "איה-גרניט-שבא", name: "איה גרניט שבא", image: "/images/actors/איה-גרניט-שבא.webp" },
  { slug: "אילי-עלמני", name: "אילי עלמני", image: "/images/actors/אילי-עלמני.webp" },
  { slug: "אלון-אופיר", name: "אלון אופיר", image: "/images/actors/אלון-אופיר.webp" },
  { slug: "אלעד-אטרקצ׳י", name: "אלעד אטרקצ׳י", image: "/images/actors/אלעד-אטרקצ׳י.webp" },
  { slug: "גילה-אלמגור", name: "גילה אלמגור", image: "/images/actors/גילה-אלמגור.webp" },
  { slug: "גילת-אנקורי", name: "גילת אנקורי", image: "/images/actors/גילת-אנקורי.webp" },
  { slug: "גלית-גיאת", name: "גלית גיאת", image: "/images/actors/גלית-גיאת.webp" },
  { slug: "גלעד-מרחבי", name: "גלעד מרחבי", image: "/images/actors/גלעד-מרחבי.webp" },
  { slug: "ג׳וי-ריגר", name: "ג׳וי ריגר", image: "/images/actors/ג׳וי-ריגר.webp" },
  { slug: "דביר-בנדק", name: "דביר בנדק", image: "/images/actors/דביר-בנדק.webp" },
  { slug: "דור-אלמקייס", name: "דור אלמקייס", image: "/images/actors/דור-אלמקייס.webp" },
  { slug: "דור-הררי", name: "דור הררי", image: "/images/actors/דור-הררי.webp" },
  { slug: "דניאל-גל", name: "דניאל גל", image: "/images/actors/דניאל-גל.webp" },
  { slug: "דניאל-סטיופין", name: "דניאל סטיופין", image: "/images/actors/דניאל-סטיופין.webp" },
  { slug: "דרור-קרן", name: "דרור קרן", image: "/images/actors/דרור-קרן.webp" },
  { slug: "הגר-אנגל", name: "הגר אנגל", image: "/images/actors/הגר-אנגל.webp" },
  { slug: "חני-פירסטנברג", name: "חני פירסטנברג", image: "/images/actors/חני-פירסטנברג.webp" },
  { slug: "חן-גרטי", name: "חן גרטי", image: "/images/actors/חן-גרטי.webp" },
  { slug: "חנה-לסלאו", name: "חנה לסלאו", image: "/images/actors/חנה-לסלאו.webp" },
  { slug: "חני-נחמיאס", name: "חני נחמיאס", image: "/images/actors/חני-נחמיאס.webp" },
  { slug: "טל-גרושקה", name: "טל גרושקה", image: "/images/actors/טל-גרושקה.webp" },
  { slug: "טל-מוסרי", name: "טל מוסרי", image: "/images/actors/טל-מוסרי.webp" },
  { slug: "טלי-אורן", name: "טלי אורן", image: "/images/actors/טלי-אורן.webp" },
  { slug: "יחזקאל-לזרוב", name: "יחזקאל לזרוב", image: "/images/actors/יחזקאל-לזרוב.webp" },
  { slug: "יונה-אליאן-קשת", name: "יונה אליאן קשת", image: "/images/actors/יונה-אליאן-קשת.webp" },
  { slug: "יורם-טולדנו", name: "יורם טולדנו", image: "/images/actors/יורם-טולדנו.webp" },
  { slug: "יניב-סויסה", name: "יניב סויסה", image: "/images/actors/יניב-סויסה.webp" },
  { slug: "יעל-לבנטל", name: "יעל לבנטל", image: "/images/actors/יעל-לבנטל.webp" },
  { slug: "יפתח-קליין", name: "יפתח קליין", image: "/images/actors/יפתח-קליין.webp" },
  { slug: "כינרת-לימוני", name: "כינרת לימוני", image: "/images/actors/כינרת-לימוני.webp" },
  { slug: "כרמל-בין", name: "כרמל בין", image: "/images/actors/כרמל-בין.webp" },
  { slug: "לי-בירן", name: "לי בירן", image: "/images/actors/לי-בירן.webp" },
  { slug: "ליא-קניג", name: "ליא קניג", image: "/images/actors/ליא-קניג.webp" },
  { slug: "ליאור-אשכנזי", name: "ליאור אשכנזי", image: "/images/actors/ליאור-אשכנזי.webp" },
  { slug: "ליהי-טולדנו", name: "ליהי טולדנו", image: "/images/actors/ליהי-טולדנו.webp" },
  { slug: "לימור-גולדשטיין", name: "לימור גולדשטיין", image: "/images/actors/לימור-גולדשטיין.webp" },
  { slug: "לינוי-כהן", name: "לינוי כהן", image: "/images/actors/לינוי-כהן.webp" },
  { slug: "לאורה-ריבלין", name: "לאורה ריבלין", image: "/images/actors/לאורה-ריבלין.webp" },
  { slug: "מאיה-לבני", name: "מאיה לבני", image: "/images/actors/מאיה-לבני.webp" },
  { slug: "מאיה-מעוז", name: "מאיה מעוז", image: "/images/actors/מאיה-מעוז.webp" },
  { slug: "מגי-אזרזר", name: "מגי אזרזר", image: "/images/actors/מגי-אזרזר.webp" },
  { slug: "מיה-לנדסמן", name: "מיה לנדסמן", image: "/images/actors/מיה-לנדסמן.webp" },
  { slug: "מיכאל-בן-דוד", name: "מיכאל בן דוד", image: "/images/actors/מיכאל-בן-דוד.webp" },
  { slug: "מיקי-קם", name: "מיקי קם", image: "/images/actors/מיקי-קם.webp" },
  { slug: "מולי-שולמן", name: "מולי שולמן", image: "/images/actors/מולי-שולמן.webp" },
  { slug: "מיקה-צור", name: "מיקה צור", image: "/images/actors/מיקה-צור.webp" },
  { slug: "מעיין-תורג׳מן", name: "מעיין תורג׳מן", image: "/images/actors/מעיין-תורג׳מן.webp" },
  { slug: "מרים-זוהר", name: "מרים זוהר", image: "/images/actors/מרים-זוהר.webp" },
  { slug: "משי-קלינשטיין", name: "משי קלינשטיין", image: "/images/actors/משי-קלינשטיין.webp" },
  { slug: "מתן-און-ימי", name: "מתן און ימי", image: "/images/actors/מתן-און-ימי.webp" },
  { slug: "נדב-אסולין", name: "נדב אסולין", image: "/images/actors/נדב-אסולין.webp" },
  { slug: "נדב-נייטס", name: "נדב נייטס", image: "/images/actors/נדב-נייטס.webp" },
  { slug: "נורמן-עיסא", name: "נורמן עיסא", image: "/images/actors/נורמן-עיסא.webp" },
  { slug: "נמרוד-גרינבוים", name: "נמרוד גרינבוים", image: "/images/actors/נמרוד-גרינבוים.webp" },
  { slug: "נטע-גרטי", name: "נטע גרטי", image: "/images/actors/נטע-גרטי.webp" },
  { slug: "נועם-קלינשטיין", name: "נועם קלינשטיין", image: "/images/actors/נועם-קלינשטיין.webp" },
  { slug: "נעמה-שטרית", name: "נעמה שטרית", image: "/images/actors/נעמה-שטרית.webp" },
  { slug: "נעמי-הררי", name: "נעמי הררי", image: "/images/actors/נעמי-הררי.webp" },
  { slug: "נתן-דטנר", name: "נתן דטנר", image: "/images/actors/נתן-דטנר.webp" },
  { slug: "סנדרה-שדה", name: "סנדרה שדה", image: "/images/actors/סנדרה-שדה.webp" },
  { slug: "עדי-כהן", name: "עדי כהן", image: "/images/actors/עדי-כהן.webp" },
  { slug: "עידו-רוזנברג", name: "עידו רוזנברג", image: "/images/actors/עידו-רוזנברג.webp" },
  { slug: "עידן-אלתרמן", name: "עידן אלתרמן", image: "/images/actors/עידן-אלתרמן.webp" },
  { slug: "עירית-ענבי", name: "עירית ענבי", image: "/images/actors/עירית-ענבי.webp" },
  { slug: "עמוס-תמם", name: "עמוס תמם", image: "/images/actors/עמוס-תמם.webp" },
  { slug: "עמי-ויינברג", name: "עמי ויינברג", image: "/images/actors/עמי-ויינברג.webp" },
  { slug: "ענת-וקסמן", name: "ענת וקסמן", image: "/images/actors/ענת-וקסמן.webp" },
  { slug: "עופרי-ביטרמן", name: "עופרי ביטרמן", image: "/images/actors/עופרי-ביטרמן.webp" },
  { slug: "צביקה-הדר", name: "צביקה הדר", image: "/images/actors/צביקה-הדר.webp" },
  { slug: "צחי-הלוי", name: "צחי הלוי", image: "/images/actors/צחי-הלוי.webp" },
  { slug: "ציפי-שביט", name: "ציפי שביט", image: "/images/actors/ציפי-שביט.webp" },
  { slug: "פיני-קדרון", name: "פיני קדרון", image: "/images/actors/פיני-קדרון.webp" },
  { slug: "פנינה-ברט-צדקה", name: "פנינה ברט צדקה", image: "/images/actors/פנינה-ברט-צדקה.webp" },
  { slug: "קרן-מור", name: "קרן מור", image: "/images/actors/קרן-מור.webp" },
  { slug: "קרן-מור-מישורי", name: "קרן מור מישורי", image: "/images/actors/קרן-מור-מישורי.webp" },
  { slug: "רביב-כנר", name: "רביב כנר", image: "/images/actors/רביב-כנר.webp" },
  { slug: "רוני-דלומי", name: "רוני דלומי", image: "/images/actors/רוני-דלומי.webp" },
  { slug: "רבקה-מיכאלי", name: "רבקה מיכאלי", image: "/images/actors/רבקה-מיכאלי.webp" },
  { slug: "רויטל-זלצמן", name: "רויטל זלצמן", image: "/images/actors/רויטל-זלצמן.webp" },
  { slug: "רמי-ברוך", name: "רמי ברוך", image: "/images/actors/רמי-ברוך.webp" },
  { slug: "רן-דנקר", name: "רן דנקר", image: "/images/actors/רן-דנקר.webp" },
  { slug: "רפאל-עבאס", name: "רפאל עבאס", image: "/images/actors/רפאל-עבאס.webp" },
  { slug: "ריקי-בליך", name: "ריקי בליך", image: "/images/actors/ריקי-בליך.webp" },
  { slug: "תום-אבני", name: "תום אבני", image: "/images/actors/תום-אבני.webp" },
  { slug: "תום-חודורוב", name: "תום חודורוב", image: "/images/actors/תום-חודורוב.webp" },
  { slug: "תומר-מחלוף", name: "תומר מחלוף", image: "/images/actors/תומר-מחלוף.webp" },
  { slug: "תם-גל", name: "תם גל", image: "/images/actors/תם-גל.webp" },
];

async function main() {
  console.log(`Mode: ${apply ? "APPLY" : "DRY-RUN"}\n`);

  // 1. Upsert actors (apply) or fetch existing IDs (dry-run)
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
      const existing = await prisma.actor.findUnique({ where: { name: a.name } });
      if (existing) actorRecords.set(a.name, existing.id);
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
  // Collect all valid (showId, actorId) pairs to detect stale links
  const validPairs = new Set();

  for (const show of shows) {
    const cast = show.cast ?? "";
    const castNames = cast
      .split(/[,|/]/)
      .map((s) => s.replace(/ - .+$/, "").trim()) // strip married-name suffixes
      .map(normalizeForMatch);
    const matched = ACTORS.filter((a) =>
      castNames.some((cn) => cn === normalizeForMatch(a.name))
    );
    if (matched.length === 0) continue;

    console.log(`  "${show.title}" (id=${show.id}):`);
    for (const a of matched) {
      console.log(`    -> ${a.name}`);
      totalLinks++;

      const actorId = actorRecords.get(a.name);
      if (actorId) validPairs.add(`${show.id}:${actorId}`);

      if (apply) {
        await prisma.showActor.upsert({
          where: { showId_actorId: { showId: show.id, actorId } },
          create: { showId: show.id, actorId },
          update: {},
        });
      }
    }
  }

  // 3. Remove stale ShowActor links that no longer match cast strings
  const existingLinks = await prisma.showActor.findMany({
    select: { showId: true, actorId: true },
  });
  const staleLinks = existingLinks.filter(
    (l) => !validPairs.has(`${l.showId}:${l.actorId}`)
  );

  if (staleLinks.length > 0) {
    console.log(`\nStale links to remove: ${staleLinks.length}`);
    for (const l of staleLinks) {
      console.log(`  Remove: showId=${l.showId}, actorId=${l.actorId}`);
      if (apply) {
        await prisma.showActor.delete({
          where: { showId_actorId: { showId: l.showId, actorId: l.actorId } },
        });
      }
    }
  } else {
    console.log("\nNo stale links found.");
  }

  console.log(`\nTotal actor-show links: ${totalLinks}`);
  if (!apply) {
    console.log("\nRun with --apply to write to DB.");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
