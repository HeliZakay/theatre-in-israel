import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

// Load the env file specified via --env flag, or .env.local by default
const envFlag = process.argv.find((a) => a.startsWith("--env="));
const envFile = envFlag ? envFlag.split("=")[1] : ".env.local";
dotenv.config({ path: path.join(rootDir, envFile) });

const MIN_SHOW_ID = 112;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("ERROR: DATABASE_URL environment variable is not set.");
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function loadNewShows() {
  const dataPath = path.join(__dirname, "..", "prisma", "data", "shows.json");
  const raw = fs.readFileSync(dataPath, "utf8");
  const allShows = JSON.parse(raw);
  const newShows = allShows.filter((show) => show.id >= MIN_SHOW_ID);
  console.log(
    `Loaded ${allShows.length} total shows, ${newShows.length} new (id >= ${MIN_SHOW_ID}).`,
  );
  return newShows;
}

async function upsertGenres(shows) {
  const genreNames = new Set();
  shows.forEach((show) => {
    (show.genre ?? []).forEach((name) => {
      if (name) genreNames.add(name);
    });
  });

  const names = Array.from(genreNames);
  const genreMap = new Map();

  for (const name of names) {
    const genre = await prisma.genre.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    genreMap.set(name, genre.id);
  }

  console.log(`Upserted ${genreMap.size} genre(s).`);
  return genreMap;
}

function buildShowGenreCreates(show, genreMap) {
  return (show.genre ?? [])
    .map((name) => genreMap.get(name))
    .filter(Boolean)
    .map((genreId) => ({
      genre: { connect: { id: genreId } },
    }));
}

function buildReviews(show) {
  return (show.reviews ?? []).map((review) => ({
    author: review.author ?? "",
    title: review.title ?? null,
    text: review.text ?? "",
    rating: review.rating ?? 0,
    date: review.date ? new Date(review.date) : new Date(),
  }));
}

async function addNewShows(shows, genreMap) {
  let added = 0;
  let skipped = 0;

  for (const show of shows) {
    const genreCreates = buildShowGenreCreates(show, genreMap);
    const reviews = buildReviews(show);

    try {
      await prisma.show.create({
        data: {
          id: show.id,
          title: show.title,
          theatre: show.theatre,
          durationMinutes: show.durationMinutes,
          summary: show.summary,
          description: show.description ?? null,
          genres: {
            create: genreCreates,
          },
          reviews: {
            create: reviews,
          },
        },
      });
      added++;
      console.log(`  ✓ Added show #${show.id}: "${show.title}"`);
    } catch (error) {
      if (error.code === "P2002") {
        skipped++;
        console.warn(
          `  ⚠ Skipped show #${show.id}: "${show.title}" — already exists.`,
        );
      } else {
        skipped++;
        console.error(
          `  ✗ Failed to add show #${show.id}: "${show.title}" —`,
          error.message,
        );
      }
    }
  }

  return { added, skipped };
}

async function main() {
  console.log("Starting add-new-shows script...\n");

  const shows = loadNewShows();
  if (shows.length === 0) {
    console.log("No new shows to add. Exiting.");
    return;
  }

  const genreMap = await upsertGenres(shows);
  const { added, skipped } = await addNewShows(shows, genreMap);

  console.log(`\nDone. Added: ${added}, Skipped: ${skipped}.`);
}

main()
  .then(() => prisma.$disconnect())
  .then(() => pool.end())
  .catch((error) => {
    console.error("Fatal error:", error);
    return prisma
      .$disconnect()
      .then(() => pool.end())
      .then(() => process.exit(1));
  });
