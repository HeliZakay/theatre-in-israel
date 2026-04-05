import prisma from "@/lib/prisma";
import { TWENTY_FOUR_HOURS_MS } from "@/constants/rateLimits";

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
  await prisma.rateLimitAttempt
    .deleteMany({
      where: {
        OR: [
          { key, action, createdAt: { lt: windowStart } },
          { createdAt: { lt: new Date(Date.now() - TWENTY_FOUR_HOURS_MS) } },
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

/**
 * Factory that creates a rate-limit checker function.
 * Wraps `checkRateLimit` with pre-configured action, window, key prefix,
 * and a fixed `remainingTime` value returned when the limit is hit.
 */
export function createRateLimitChecker(config: {
  action: string;
  maxAttempts: number | ((identifier: string) => number);
  windowMs: number;
  keyPrefix?: string;
  remainingTime?: number;
}): (identifier: string) => Promise<{ isLimited: boolean; remainingTime?: number }> {
  const { action, maxAttempts, windowMs, keyPrefix = "", remainingTime } = config;

  return async (identifier: string) => {
    if (!process.env.VERCEL) {
      return { isLimited: false };
    }

    const max =
      typeof maxAttempts === "function" ? maxAttempts(identifier) : maxAttempts;
    const result = await checkRateLimit(
      `${keyPrefix}${identifier}`,
      action,
      max,
      windowMs,
    );

    if (!result.allowed) {
      return remainingTime !== undefined
        ? { isLimited: true, remainingTime }
        : { isLimited: true };
    }

    return { isLimited: false };
  };
}
