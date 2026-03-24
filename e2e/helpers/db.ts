import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

export function getTestPrisma(): PrismaClient {
  if (!prisma) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}

/**
 * Look up the pre-seeded test user's ID by email.
 */
export async function getTestUserId(email: string): Promise<string> {
  const db = getTestPrisma();
  const user = await db.user.findUniqueOrThrow({
    where: { email },
    select: { id: true },
  });
  return user.id;
}

/**
 * Clean up test data created during tests (reviews, watchlist entries).
 * Does NOT delete the test user or seed data.
 */
export async function cleanupTestData(
  userId: string,
  showId?: number,
): Promise<void> {
  const db = getTestPrisma();
  const reviewWhere = showId ? { userId, showId } : { userId };
  await db.review.deleteMany({ where: reviewWhere });
  if (!showId) {
    // Only clean watchlist/rate-limits when doing full cleanup (not show-scoped)
    await db.watchlist.deleteMany({ where: { userId } });
    await db.rateLimitAttempt.deleteMany({});
  }
}

/**
 * Clean up anonymous reviews created during E2E tests (identified by IP).
 * Also cleans up rate limit attempts.
 */
export async function cleanupAnonymousTestData(
  ip: string = "127.0.0.1",
): Promise<void> {
  const db = getTestPrisma();
  await db.review.deleteMany({ where: { ip, userId: null } });
  await db.rateLimitAttempt.deleteMany({});
}

/**
 * Create a review directly in the DB for test setup.
 */
export async function createTestReview(
  userId: string,
  showId: number,
  data: { title: string; text: string; rating: number; author: string },
) {
  const db = getTestPrisma();
  return db.review.upsert({
    where: { userId_showId: { userId, showId } },
    update: {
      author: data.author,
      title: data.title,
      text: data.text,
      rating: data.rating,
      date: new Date(),
    },
    create: {
      userId,
      showId,
      author: data.author,
      title: data.title,
      text: data.text,
      rating: data.rating,
      date: new Date(),
    },
  });
}

/**
 * Get the first show from the database (for tests that need a show).
 */
export async function getFirstShow() {
  return getShowByOffset(0);
}

/**
 * Get a show by offset (0-indexed) for test isolation across parallel files.
 */
export async function getShowByOffset(offset: number) {
  const db = getTestPrisma();
  const shows = await db.show.findMany({
    select: { id: true, title: true, slug: true },
    orderBy: { id: "asc" },
    skip: offset,
    take: 1,
  });
  if (!shows[0]) throw new Error(`No show at offset ${offset}`);
  return shows[0];
}

/**
 * Get a show with at least `minReviews` reviews, or null if none exists.
 */
export async function getShowWithReviews(minReviews: number = 5) {
  const db = getTestPrisma();
  return db.show.findFirst({
    where: { reviewCount: { gte: minReviews } },
    select: { id: true, title: true, slug: true, theatre: true },
    orderBy: { reviewCount: "desc" },
  });
}

/**
 * Disconnect Prisma — call in global teardown.
 */
export async function disconnectDb(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
  }
}
