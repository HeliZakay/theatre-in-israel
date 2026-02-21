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

  // Clean up expired entries lazily (don't await — fire and forget)
  prisma.rateLimitAttempt
    .deleteMany({
      where: { key, action, createdAt: { lt: windowStart } },
    })
    .catch(() => {
      // Ignore cleanup errors
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
