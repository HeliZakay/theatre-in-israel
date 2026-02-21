import prisma from "@/lib/prisma";

/**
 * Generic DB-backed rate limiter.
 * Checks if the number of attempts for a given key+action exceeds maxAttempts
 * within the given windowMs. If not, records a new attempt.
 * Also lazily cleans up expired entries.
 */
export async function checkRateLimit(
  key: string,
  action: string,
  maxAttempts: number,
  windowMs: number,
): Promise<{ allowed: boolean; remainingAttempts: number }> {
  const windowStart = new Date(Date.now() - windowMs);

  // Clean up expired entries for this key, plus stale entries older than 24h across all keys
  prisma.rateLimitAttempt
    .deleteMany({
      where: {
        OR: [
          { key, action, createdAt: { lt: windowStart } },
          { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        ],
      },
    })
    .catch((err) => {
      console.error("Rate limit cleanup failed:", err);
    });

  const count = await prisma.rateLimitAttempt.count({
    where: {
      key,
      action,
      createdAt: { gte: windowStart },
    },
  });

  if (count >= maxAttempts) {
    return { allowed: false, remainingAttempts: 0 };
  }

  // Record this attempt
  await prisma.rateLimitAttempt.create({
    data: { key, action },
  });

  return { allowed: true, remainingAttempts: maxAttempts - count - 1 };
}
