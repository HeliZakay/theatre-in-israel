import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

export function getTestPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
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
export async function cleanupTestData(userId: string): Promise<void> {
  const db = getTestPrisma();
  await db.review.deleteMany({ where: { userId } });
  await db.watchlist.deleteMany({ where: { userId } });
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
  return db.review.create({
    data: {
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
  const db = getTestPrisma();
  return db.show.findFirstOrThrow({
    select: { id: true, title: true, slug: true },
    orderBy: { id: "asc" },
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
