import { checkRateLimit } from "@/utils/rateLimit";

const CONTACT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const CONTACT_MAX_ATTEMPTS = 5;
const CONTACT_UNKNOWN_IP_MAX = 1;

interface RateLimitResult {
  isLimited: boolean;
}

export async function checkContactRateLimit(
  ip: string,
): Promise<RateLimitResult> {
  const maxAttempts =
    ip === "unknown" ? CONTACT_UNKNOWN_IP_MAX : CONTACT_MAX_ATTEMPTS;

  const result = await checkRateLimit(
    `ip:${ip}`,
    "contact",
    maxAttempts,
    CONTACT_WINDOW_MS,
  );

  return { isLimited: !result.allowed };
}
