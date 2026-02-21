jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {},
}));

jest.mock("@/utils/rateLimit");

import { checkEditDeleteRateLimit } from "@/utils/reviewRateLimit";
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
