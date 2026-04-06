jest.mock("@/lib/prisma", () => ({ __esModule: true, default: {} }));

const mockCheckRateLimit = jest.fn();

// Provide an inline createRateLimitChecker that uses the mocked checkRateLimit.
// The real factory's closure captures the real checkRateLimit (same-module reference),
// so we need this shim so the checkers created at module-load time call the mock.
jest.mock("@/utils/rateLimit", () => ({
  checkRateLimit: mockCheckRateLimit,
  createRateLimitChecker(config: {
    action: string;
    maxAttempts: number | ((id: string) => number);
    windowMs: number;
    keyPrefix?: string;
    remainingTime?: number;
  }) {
    const { action, maxAttempts, windowMs, keyPrefix = "", remainingTime } = config;
    return async (identifier: string) => {
      const max =
        typeof maxAttempts === "function" ? maxAttempts(identifier) : maxAttempts;
      const result = await mockCheckRateLimit(
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
  },
}));

import {
  checkLoginRateLimit,
  checkSignupRateLimit,
  checkContactRateLimit,
  checkWatchlistRateLimit,
  checkEditDeleteRateLimit,
  checkAnonymousReviewRateLimit,
} from "@/utils/rateLimitCheckers";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("checkLoginRateLimit", () => {
  it("returns isLimited: false when allowed", async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remainingAttempts: 4 });
    const result = await checkLoginRateLimit("127.0.0.1");
    expect(result.isLimited).toBe(false);
    expect(result.remainingTime).toBeUndefined();
  });

  it("returns isLimited: true with remainingTime: 15 when denied", async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: false, remainingAttempts: 0 });
    const result = await checkLoginRateLimit("127.0.0.1");
    expect(result).toEqual({ isLimited: true, remainingTime: 15 });
  });

  it("calls checkRateLimit with correct arguments", async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remainingAttempts: 4 });
    await checkLoginRateLimit("192.168.1.1");
    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      "ip:192.168.1.1",
      "login",
      5,
      15 * 60 * 1000,
    );
  });
});

describe("checkSignupRateLimit", () => {
  it("returns isLimited: false when allowed", async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remainingAttempts: 2 });
    const result = await checkSignupRateLimit("127.0.0.1");
    expect(result.isLimited).toBe(false);
  });

  it("returns isLimited: true with remainingTime: 60 when denied", async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: false, remainingAttempts: 0 });
    const result = await checkSignupRateLimit("127.0.0.1");
    expect(result).toEqual({ isLimited: true, remainingTime: 60 });
  });

  it("calls checkRateLimit with correct arguments", async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remainingAttempts: 2 });
    await checkSignupRateLimit("10.0.0.1");
    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      "ip:10.0.0.1",
      "signup",
      3,
      60 * 60 * 1000,
    );
  });
});

describe("checkContactRateLimit", () => {
  it("returns isLimited: false when allowed", async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remainingAttempts: 4 });
    const result = await checkContactRateLimit("127.0.0.1");
    expect(result.isLimited).toBe(false);
  });

  it("returns isLimited: true when denied", async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: false, remainingAttempts: 0 });
    const result = await checkContactRateLimit("127.0.0.1");
    expect(result.isLimited).toBe(true);
  });

  it("calls checkRateLimit with maxAttempts=5 for known IP", async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remainingAttempts: 4 });
    await checkContactRateLimit("192.168.1.1");
    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      "ip:192.168.1.1",
      "contact",
      5,
      60 * 60 * 1000,
    );
  });

  it("calls checkRateLimit with maxAttempts=1 for unknown IP", async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remainingAttempts: 0 });
    await checkContactRateLimit("unknown");
    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      "ip:unknown",
      "contact",
      1,
      60 * 60 * 1000,
    );
  });
});

describe("checkWatchlistRateLimit", () => {
  it("returns isLimited: false when allowed", async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remainingAttempts: 99 });
    const result = await checkWatchlistRateLimit("user-123");
    expect(result.isLimited).toBe(false);
  });

  it("returns isLimited: true with remainingTime: 60 when denied", async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: false, remainingAttempts: 0 });
    const result = await checkWatchlistRateLimit("user-123");
    expect(result).toEqual({ isLimited: true, remainingTime: 60 });
  });

  it("calls checkRateLimit with correct arguments (no keyPrefix)", async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remainingAttempts: 99 });
    await checkWatchlistRateLimit("user-456");
    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      "user-456",
      "watchlist_modify",
      100,
      60 * 60 * 1000,
    );
  });
});

describe("checkEditDeleteRateLimit", () => {
  it("returns isLimited: false when allowed", async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remainingAttempts: 9 });
    const result = await checkEditDeleteRateLimit("user-123");
    expect(result.isLimited).toBe(false);
  });

  it("returns isLimited: true with remainingTime: 60 when denied", async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: false, remainingAttempts: 0 });
    const result = await checkEditDeleteRateLimit("user-123");
    expect(result).toEqual({ isLimited: true, remainingTime: 60 });
  });

  it("calls checkRateLimit with correct arguments", async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remainingAttempts: 9 });
    await checkEditDeleteRateLimit("user-456");
    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      "user:user-456",
      "editDelete",
      50,
      60 * 60 * 1000,
    );
  });
});

describe("checkAnonymousReviewRateLimit", () => {
  it("returns isLimited: false when allowed", async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remainingAttempts: 19 });
    const result = await checkAnonymousReviewRateLimit("1.2.3.4");
    expect(result.isLimited).toBe(false);
  });

  it("returns isLimited: true with remainingTime: 60 when denied", async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: false, remainingAttempts: 0 });
    const result = await checkAnonymousReviewRateLimit("1.2.3.4");
    expect(result).toEqual({ isLimited: true, remainingTime: 60 });
  });

  it("calls checkRateLimit with maxAttempts=100 for known IP", async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remainingAttempts: 99 });
    await checkAnonymousReviewRateLimit("1.2.3.4");
    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      "ip:1.2.3.4",
      "anonymous-review",
      100,
      60 * 60 * 1000,
    );
  });

  it("calls checkRateLimit with maxAttempts=5 for unknown IP", async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: true, remainingAttempts: 4 });
    await checkAnonymousReviewRateLimit("unknown");
    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      "ip:unknown",
      "anonymous-review",
      5,
      60 * 60 * 1000,
    );
  });
});
