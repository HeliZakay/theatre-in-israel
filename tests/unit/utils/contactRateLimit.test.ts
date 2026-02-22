jest.mock("@/lib/prisma", () => ({ __esModule: true, default: {} }));

jest.mock("@/utils/rateLimit");

import { checkContactRateLimit } from "@/utils/contactRateLimit";
import { checkRateLimit } from "@/utils/rateLimit";

const mockCheckRateLimit = checkRateLimit as jest.MockedFunction<
  typeof checkRateLimit
>;

describe("checkContactRateLimit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns isLimited: false when allowed", async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      remainingAttempts: 4,
    });

    const result = await checkContactRateLimit("127.0.0.1");
    expect(result.isLimited).toBe(false);
  });

  it("returns isLimited: true when not allowed", async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: false,
      remainingAttempts: 0,
    });

    const result = await checkContactRateLimit("127.0.0.1");
    expect(result.isLimited).toBe(true);
  });

  it("calls checkRateLimit with correct arguments for known IP", async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      remainingAttempts: 4,
    });

    await checkContactRateLimit("192.168.1.1");

    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      "ip:192.168.1.1",
      "contact",
      5, // CONTACT_MAX_ATTEMPTS
      60 * 60 * 1000, // 1 hour in ms
    );
  });

  it("calls checkRateLimit with maxAttempts=1 for unknown IP", async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      remainingAttempts: 0,
    });

    await checkContactRateLimit("unknown");

    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      "ip:unknown",
      "contact",
      1, // CONTACT_UNKNOWN_IP_MAX
      60 * 60 * 1000, // 1 hour in ms
    );
  });
});
