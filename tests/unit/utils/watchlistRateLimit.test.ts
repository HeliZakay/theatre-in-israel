jest.mock("@/lib/prisma", () => ({ __esModule: true, default: {} }));

jest.mock("@/utils/rateLimit");

import { checkWatchlistRateLimit } from "@/utils/watchlistRateLimit";
import { checkRateLimit } from "@/utils/rateLimit";

const mockCheckRateLimit = checkRateLimit as jest.MockedFunction<
  typeof checkRateLimit
>;

describe("checkWatchlistRateLimit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns isLimited: false when allowed", async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      remainingAttempts: 99,
    });

    const result = await checkWatchlistRateLimit("user-123");
    expect(result.isLimited).toBe(false);
    expect(result.remainingTime).toBeUndefined();
  });

  it("returns isLimited: true with remainingTime when not allowed", async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: false,
      remainingAttempts: 0,
    });

    const result = await checkWatchlistRateLimit("user-123");
    expect(result.isLimited).toBe(true);
    expect(result.remainingTime).toBe(60);
  });

  it("calls checkRateLimit with correct arguments", async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      remainingAttempts: 99,
    });

    await checkWatchlistRateLimit("user-456");

    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      "user-456",
      "watchlist_modify",
      100, // WATCHLIST_MAX_ATTEMPTS
      60 * 60 * 1000, // 1 hour in ms
    );
  });
});
