jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    rateLimitAttempt: { findFirst: jest.fn() },
  },
}));

jest.mock("@/utils/rateLimit");

import { checkProfileRateLimit } from "@/utils/profileRateLimit";
import { checkRateLimit } from "@/utils/rateLimit";
import prisma from "@/lib/prisma";

const mockCheckRateLimit = checkRateLimit as jest.MockedFunction<
  typeof checkRateLimit
>;

const mockFindFirst = prisma.rateLimitAttempt.findFirst as jest.Mock;

describe("checkProfileRateLimit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns isLimited: false when allowed", async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      remainingAttempts: 4,
    });

    const result = await checkProfileRateLimit("user-123");
    expect(result.isLimited).toBe(false);
    expect(result.remainingTime).toBeUndefined();
  });

  it("calls checkRateLimit with correct arguments", async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      remainingAttempts: 4,
    });

    await checkProfileRateLimit("user-456");

    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      "user:user-456",
      "profileUpdate",
      5,
      60 * 60 * 1000,
    );
  });

  it("returns isLimited: true with remainingTime when rate limited", async () => {
    const now = Date.now();
    jest.spyOn(Date, "now").mockReturnValue(now);

    mockCheckRateLimit.mockResolvedValue({
      allowed: false,
      remainingAttempts: 0,
    });

    // Oldest attempt was 30 minutes ago → 30 minutes remaining
    mockFindFirst.mockResolvedValue({
      createdAt: new Date(now - 30 * 60 * 1000),
    });

    const result = await checkProfileRateLimit("user-123");
    expect(result.isLimited).toBe(true);
    expect(result.remainingTime).toBe(30);

    jest.restoreAllMocks();
  });

  it("returns remainingTime: 1 when oldest attempt is null", async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: false,
      remainingAttempts: 0,
    });

    mockFindFirst.mockResolvedValue(null);

    const result = await checkProfileRateLimit("user-123");
    expect(result.isLimited).toBe(true);
    expect(result.remainingTime).toBe(1);
  });

  it("clamps remainingTime to minimum of 1", async () => {
    const now = Date.now();
    jest.spyOn(Date, "now").mockReturnValue(now);

    mockCheckRateLimit.mockResolvedValue({
      allowed: false,
      remainingAttempts: 0,
    });

    // Oldest attempt was 59.99 minutes ago → window almost expired
    mockFindFirst.mockResolvedValue({
      createdAt: new Date(now - 59.99 * 60 * 1000),
    });

    const result = await checkProfileRateLimit("user-123");
    expect(result.isLimited).toBe(true);
    expect(result.remainingTime).toBe(1);

    jest.restoreAllMocks();
  });
});
