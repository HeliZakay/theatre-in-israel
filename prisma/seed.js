require("dotenv/config");

// Prevent accidental seed execution against production database
if (process.env.NODE_ENV === "production") {
  console.error(
    "ERROR: Seed script cannot run in production (NODE_ENV=production)",
  );
  process.exit(1);
}

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

/**
 * Convert a show title into a URL-safe slug.
 * Keeps Hebrew characters, replaces spaces with hyphens,
 * normalises special characters (ASCII apostrophe → Hebrew geresh ׳).
 */
function generateSlug(title) {
  return title
    .trim()
    .replace(/\s+/g, "-")
    .replace(/'/g, "\u05F3")
    .replace(/[?#%|\\/:*"<>]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Pre-compute unique slugs for all shows.
 * If two shows have the same title-based slug, disambiguate by appending the theatre name.
 */
function buildSlugs(shows) {
  const slugMap = new Map(); // slug → [show, ...]
  for (const show of shows) {
    const base = generateSlug(show.title);
    if (!slugMap.has(base)) slugMap.set(base, []);
    slugMap.get(base).push(show);
  }

  const result = new Map(); // show.id → slug
  for (const [base, group] of slugMap) {
    if (group.length === 1) {
      result.set(group[0].id, base);
    } else {
      for (const show of group) {
        result.set(show.id, `${base}-${generateSlug(show.theatre)}`);
      }
    }
  }
  return result;
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

async function seedShows(shows, genreMap, slugs) {
  for (const show of shows) {
    const genreCreates = buildShowGenreCreates(show, genreMap);
    const reviews = buildReviews(show);
    const slug = slugs.get(show.id);

    await prisma.show.upsert({
      where: { id: show.id },
      update: {
        title: show.title,
        slug,
        theatre: show.theatre,
        durationMinutes: show.durationMinutes,
        summary: show.summary,
        description: show.description ?? null,
        genres: {
          deleteMany: {},
          create: genreCreates,
        },
        // Do NOT touch reviews on update — preserve user-created reviews
      },
      create: {
        id: show.id,
        title: show.title,
        slug,
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
  }
}

async function main() {
  const shows = loadShows();
  const genreMap = await seedGenres(shows);
  const slugs = buildSlugs(shows);
  await seedShows(shows, genreMap, slugs);
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
