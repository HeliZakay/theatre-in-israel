/**
 * Pre-configured rate limiters for each action in the app.
 * Each uses createRateLimitChecker() with action-specific windows and thresholds.
 */
import { createRateLimitChecker } from "./rateLimit";
import { FIFTEEN_MINUTES_MS, ONE_HOUR_MS } from "@/constants/rateLimits";

export const checkLoginRateLimit = createRateLimitChecker({
  action: "login",
  maxAttempts: 5,
  windowMs: FIFTEEN_MINUTES_MS,
  keyPrefix: "ip:",
  remainingTime: 15,
});

export const checkSignupRateLimit = createRateLimitChecker({
  action: "signup",
  maxAttempts: 3,
  windowMs: ONE_HOUR_MS,
  keyPrefix: "ip:",
  remainingTime: 60,
});

export const checkContactRateLimit = createRateLimitChecker({
  action: "contact",
  maxAttempts: (ip) => (ip === "unknown" ? 1 : 5),
  windowMs: ONE_HOUR_MS,
  keyPrefix: "ip:",
});

export const checkWatchlistRateLimit = createRateLimitChecker({
  action: "watchlist_modify",
  maxAttempts: 100,
  windowMs: ONE_HOUR_MS,
  remainingTime: 60,
});

export const checkEditDeleteRateLimit = createRateLimitChecker({
  action: "editDelete",
  maxAttempts: 50,
  windowMs: ONE_HOUR_MS,
  keyPrefix: "user:",
  remainingTime: 60,
});

export const checkAnonymousReviewRateLimit = createRateLimitChecker({
  action: "anonymous-review",
  maxAttempts: (ip) => (ip === "unknown" ? 5 : 20),
  windowMs: ONE_HOUR_MS,
  keyPrefix: "ip:",
  remainingTime: 60,
});
