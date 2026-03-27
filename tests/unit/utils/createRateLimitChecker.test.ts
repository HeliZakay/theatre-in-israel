const mockCount = jest.fn();
const mockCreate = jest.fn().mockResolvedValue({});
const mockDeleteMany = jest.fn().mockReturnValue({ catch: () => {} });

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    rateLimitAttempt: {
      count: mockCount,
      create: mockCreate,
      deleteMany: mockDeleteMany,
    },
  },
}));

import { createRateLimitChecker } from "@/utils/rateLimit";

describe("createRateLimitChecker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns isLimited: false when under the limit", async () => {
    mockCount.mockResolvedValue(0);

    const checker = createRateLimitChecker({
      action: "test",
      maxAttempts: 5,
      windowMs: 60_000,
    });

    const result = await checker("some-key");
    expect(result).toEqual({ isLimited: false });
  });

  it("returns isLimited: true with remainingTime when at the limit", async () => {
    mockCount.mockResolvedValue(5);

    const checker = createRateLimitChecker({
      action: "test",
      maxAttempts: 5,
      windowMs: 60_000,
      remainingTime: 15,
    });

    const result = await checker("some-key");
    expect(result).toEqual({ isLimited: true, remainingTime: 15 });
  });

  it("returns isLimited: true without remainingTime when not configured", async () => {
    mockCount.mockResolvedValue(5);

    const checker = createRateLimitChecker({
      action: "test",
      maxAttempts: 5,
      windowMs: 60_000,
    });

    const result = await checker("some-key");
    expect(result).toEqual({ isLimited: true });
  });

  it("prepends keyPrefix to the identifier", async () => {
    mockCount.mockResolvedValue(0);

    const checker = createRateLimitChecker({
      action: "login",
      maxAttempts: 5,
      windowMs: 60_000,
      keyPrefix: "ip:",
    });

    await checker("1.2.3.4");

    expect(mockCount).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ key: "ip:1.2.3.4", action: "login" }) }),
    );
  });

  it("uses no prefix when keyPrefix is omitted", async () => {
    mockCount.mockResolvedValue(0);

    const checker = createRateLimitChecker({
      action: "watchlist",
      maxAttempts: 100,
      windowMs: 60_000,
    });

    await checker("user-123");

    expect(mockCount).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ key: "user-123", action: "watchlist" }) }),
    );
  });

  it("supports maxAttempts as a function for conditional limits", async () => {
    mockCount.mockResolvedValue(0);

    const checker = createRateLimitChecker({
      action: "contact",
      maxAttempts: (id) => (id === "unknown" ? 1 : 5),
      windowMs: 60_000,
      keyPrefix: "ip:",
    });

    // "unknown" should use maxAttempts=1 → count 0 < 1 → allowed
    await checker("unknown");
    expect(mockCount).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ key: "ip:unknown" }) }),
    );

    // Reset and test that count >= 1 triggers limit for "unknown"
    mockCount.mockResolvedValue(1);
    const result = await checker("unknown");
    expect(result.isLimited).toBe(true);

    // But count=1 should still be allowed for a known IP (maxAttempts=5)
    const result2 = await checker("1.2.3.4");
    expect(result2.isLimited).toBe(false);
  });
});
