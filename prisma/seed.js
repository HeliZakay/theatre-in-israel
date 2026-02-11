require("dotenv/config");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function loadShows() {
  const dataPath = path.join(__dirname, "data", "shows.json");
  const raw = fs.readFileSync(dataPath, "utf8");
  return JSON.parse(raw);
}

async function seedGenres(shows) {
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

async function seedShows(shows, genreMap) {
  for (const show of shows) {
    const genreCreates = buildShowGenreCreates(show, genreMap);
    const reviews = buildReviews(show);

    await prisma.show.upsert({
      where: { id: show.id },
      update: {
        title: show.title,
        theatre: show.theatre,
        durationMinutes: show.durationMinutes,
        summary: show.summary,
        genres: {
          deleteMany: {},
          create: genreCreates,
        },
        reviews: {
          deleteMany: {},
          create: reviews,
        },
      },
      create: {
        id: show.id,
        title: show.title,
        theatre: show.theatre,
        durationMinutes: show.durationMinutes,
        summary: show.summary,
        genres: {
          create: genreCreates,
        },
        reviews: {
          create: reviews,
        },
      },
    });
  }
}

async function main() {
  const shows = loadShows();
  const genreMap = await seedGenres(shows);
  await seedShows(shows, genreMap);
}

main()
  .then(() => prisma.$disconnect())
  .then(() => pool.end())
  .catch((error) => {
    console.error(error);
    return prisma
      .$disconnect()
      .then(() => pool.end())
      .then(() => process.exit(1));
  });
