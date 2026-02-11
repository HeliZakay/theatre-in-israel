require("dotenv/config");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const [showCount, genreCount, reviewCount] = await Promise.all([
    prisma.show.count(),
    prisma.genre.count(),
    prisma.review.count(),
  ]);

  console.log("Shows:", showCount);
  console.log("Genres:", genreCount);
  console.log("Reviews:", reviewCount);

  const topShows = await prisma.show.findMany({
    select: {
      id: true,
      title: true,
      _count: { select: { reviews: true } },
    },
    orderBy: { reviews: { _count: "desc" } },
    take: 5,
  });

  console.log("Top shows by review count:");
  topShows.forEach((show) => {
    console.log(`- ${show.title} (id: ${show.id}) -> ${show._count.reviews}`);
  });
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
