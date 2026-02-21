import { checkRateLimit } from "@/utils/rateLimit";

const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOGIN_MAX_ATTEMPTS = 5;

const SIGNUP_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const SIGNUP_MAX_ATTEMPTS = 3;

interface RateLimitResult {
  isLimited: boolean;
  remainingTime?: number;
}

export async function checkLoginRateLimit(
  ip: string,
): Promise<RateLimitResult> {
  const result = await checkRateLimit(
    `ip:${ip}`,
    "login",
    LOGIN_MAX_ATTEMPTS,
    LOGIN_WINDOW_MS,
  );

  if (!result.allowed) {
    return { isLimited: true, remainingTime: 15 };
  }

  return { isLimited: false };
}

export async function checkSignupRateLimit(
  ip: string,
): Promise<RateLimitResult> {
  const result = await checkRateLimit(
    `ip:${ip}`,
    "signup",
    SIGNUP_MAX_ATTEMPTS,
    SIGNUP_WINDOW_MS,
  );

  if (!result.allowed) {
    return { isLimited: true, remainingTime: 60 };
  }

  return { isLimited: false };
}
