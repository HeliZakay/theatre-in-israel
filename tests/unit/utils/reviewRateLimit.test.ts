const mockReviewFindMany = jest.fn();

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    review: { findMany: mockReviewFindMany },
  },
}));

jest.mock("@/utils/rateLimit");

import {
  checkEditDeleteRateLimit,
  checkReviewRateLimit,
} from "@/utils/reviewRateLimit";
import { checkRateLimit } from "@/utils/rateLimit";

const mockCheckRateLimit = checkRateLimit as jest.MockedFunction<
  typeof checkRateLimit
>;

describe("checkEditDeleteRateLimit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns isLimited: false when allowed", async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      remainingAttempts: 9,
    });

    const result = await checkEditDeleteRateLimit("user-123");
    expect(result.isLimited).toBe(false);
    expect(result.remainingTime).toBeUndefined();
  });

  it("returns isLimited: true with remainingTime when not allowed", async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: false,
      remainingAttempts: 0,
    });

    const result = await checkEditDeleteRateLimit("user-123");
    expect(result.isLimited).toBe(true);
    expect(result.remainingTime).toBe(60);
  });

  it("calls checkRateLimit with correct arguments", async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      remainingAttempts: 9,
    });

    await checkEditDeleteRateLimit("user-456");

    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      "user:user-456",
      "editDelete",
      10, // MAX_EDITS_PER_WINDOW
      60 * 60 * 1000, // 1 hour in ms
    );
  });
});

describe("checkReviewRateLimit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .spyOn(Date, "now")
      .mockReturnValue(new Date("2026-02-23T12:00:00Z").getTime());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns isLimited: false when fewer reviews than the limit", async () => {
    mockReviewFindMany.mockResolvedValue([
      { createdAt: new Date("2026-02-23T11:30:00Z") },
      { createdAt: new Date("2026-02-23T11:45:00Z") },
    ]);

    const result = await checkReviewRateLimit("user-123");
    expect(result.isLimited).toBe(false);
    expect(result.remainingTime).toBeUndefined();
  });

  it("returns isLimited: true with remainingMinutes when at the limit", async () => {
    // 10 reviews, oldest created 30 minutes ago → resets in 30 minutes
    const oldestTime = new Date("2026-02-23T11:30:00Z");
    const reviews = Array.from({ length: 10 }, (_, i) => ({
      createdAt: new Date(oldestTime.getTime() + i * 60_000),
    }));

    mockReviewFindMany.mockResolvedValue(reviews);

    const result = await checkReviewRateLimit("user-123");
    expect(result.isLimited).toBe(true);
    // oldest at 11:30, window is 1h → resets at 12:30, now is 12:00 → 30 min
    expect(result.remainingTime).toBe(30);
  });

  it("calls prisma.review.findMany with correct arguments", async () => {
    mockReviewFindMany.mockResolvedValue([]);

    await checkReviewRateLimit("user-456");

    const expectedWindowStart = new Date(
      new Date("2026-02-23T12:00:00Z").getTime() - 60 * 60 * 1000,
    );

    expect(mockReviewFindMany).toHaveBeenCalledWith({
      where: {
        userId: "user-456",
        createdAt: { gte: expectedWindowStart },
      },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });
  });
});
