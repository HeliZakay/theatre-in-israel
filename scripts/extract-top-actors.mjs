#!/usr/bin/env node
/**
 * Extract top actors from show cast fields.
 *
 * Queries all shows with a cast field, extracts the first 3 actor names
 * from each, and writes a deduplicated JSON file mapping each actor to
 * the show titles they appear in.
 *
 * Usage:
 *   node scripts/extract-top-actors.mjs
 */

import { writeFileSync } from "node:fs";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

dotenv.config({ path: ".env.local" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const shows = await prisma.show.findMany({
    where: { cast: { not: null } },
    select: { title: true, cast: true },
  });

  console.log(`Processing ${shows.length} shows with cast data...`);

  /** @type {Map<string, Set<string>>} */
  const actorShows = new Map();

  for (const show of shows) {
    let cast = show.cast ?? "";

    // Strip trailing parenthetical like " (כפילויות: ...)"
    cast = cast.replace(/ \(.*\)$/, "");

    const entries = cast.split(",").map((s) => s.trim()).filter(Boolean);

    // Take first 3 entries, applying slash rule
    const actors = [];
    for (const entry of entries) {
      if (actors.length >= 3) break;
      // If contains "/", take only the part before "/"
      const name = entry.includes("/") ? entry.split("/")[0].trim() : entry;
      if (!name) continue;
      actors.push(name);
    }

    for (const name of actors) {
      if (!actorShows.has(name)) {
        actorShows.set(name, new Set());
      }
      actorShows.get(name).add(show.title);
    }
  }

  // Build sorted output
  const output = Array.from(actorShows.entries())
    .map(([name, showsSet]) => ({
      name,
      shows: Array.from(showsSet).sort(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const outPath = "prisma/data/top-actors.json";
  writeFileSync(outPath, JSON.stringify(output, null, 2) + "\n");

  console.log(`Total unique actors: ${output.length}`);
  console.log(`Written to ${outPath}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
