jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {},
}));

import { checkEditDeleteRateLimit } from "@/utils/reviewRateLimit";

describe("checkEditDeleteRateLimit", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns isLimited: false on first call", () => {
    const result = checkEditDeleteRateLimit("user-first-call");
    expect(result.isLimited).toBe(false);
  });

  it("returns isLimited: false when under limit", () => {
    const userId = "user-under-limit";
    for (let i = 0; i < 7; i++) {
      const result = checkEditDeleteRateLimit(userId);
      expect(result.isLimited).toBe(false);
    }
  });

  it("returns isLimited: true after 10 calls within the window", () => {
    const userId = "user-at-limit";
    for (let i = 0; i < 10; i++) {
      checkEditDeleteRateLimit(userId);
    }
    const result = checkEditDeleteRateLimit(userId);
    expect(result.isLimited).toBe(true);
  });

  it("includes remainingTime when limited", () => {
    const userId = "user-remaining-time";
    for (let i = 0; i < 10; i++) {
      checkEditDeleteRateLimit(userId);
    }
    const result = checkEditDeleteRateLimit(userId);
    expect(result.isLimited).toBe(true);
    expect(result.remainingTime).toBeDefined();
    expect(typeof result.remainingTime).toBe("number");
    expect(result.remainingTime).toBeGreaterThan(0);
  });

  it("resets after window expires", () => {
    const userId = "user-window-reset";
    for (let i = 0; i < 10; i++) {
      checkEditDeleteRateLimit(userId);
    }

    const limited = checkEditDeleteRateLimit(userId);
    expect(limited.isLimited).toBe(true);

    // Advance past the 1-hour window
    jest.advanceTimersByTime(60 * 60 * 1000 + 1);

    const result = checkEditDeleteRateLimit(userId);
    expect(result.isLimited).toBe(false);
  });
});
