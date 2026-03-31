/**
 * Pre-configured rate limiters for each action in the app.
 * Each uses createRateLimitChecker() with action-specific windows and thresholds.
 */
import { createRateLimitChecker } from "./rateLimit";

export const checkLoginRateLimit = createRateLimitChecker({
  action: "login",
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
  keyPrefix: "ip:",
  remainingTime: 15,
});

export const checkSignupRateLimit = createRateLimitChecker({
  action: "signup",
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000,
  keyPrefix: "ip:",
  remainingTime: 60,
});

export const checkContactRateLimit = createRateLimitChecker({
  action: "contact",
  maxAttempts: (ip) => (ip === "unknown" ? 1 : 5),
  windowMs: 60 * 60 * 1000,
  keyPrefix: "ip:",
});

export const checkWatchlistRateLimit = createRateLimitChecker({
  action: "watchlist_modify",
  maxAttempts: 100,
  windowMs: 60 * 60 * 1000,
  remainingTime: 60,
});

export const checkEditDeleteRateLimit = createRateLimitChecker({
  action: "editDelete",
  maxAttempts: 50,
  windowMs: 60 * 60 * 1000,
  keyPrefix: "user:",
  remainingTime: 60,
});

export const checkAnonymousReviewRateLimit = createRateLimitChecker({
  action: "anonymous-review",
  maxAttempts: (ip) => (ip === "unknown" ? 5 : 20),
  windowMs: 60 * 60 * 1000,
  keyPrefix: "ip:",
  remainingTime: 60,
});
