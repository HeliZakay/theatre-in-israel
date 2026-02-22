jest.mock("@/lib/prisma", () => ({ __esModule: true, default: {} }));

jest.mock("@/utils/rateLimit");

import {
  checkLoginRateLimit,
  checkSignupRateLimit,
} from "@/utils/authRateLimit";
import { checkRateLimit } from "@/utils/rateLimit";

const mockCheckRateLimit = checkRateLimit as jest.MockedFunction<
  typeof checkRateLimit
>;

describe("checkLoginRateLimit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns isLimited: false when allowed", async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      remainingAttempts: 4,
    });

    const result = await checkLoginRateLimit("127.0.0.1");
    expect(result.isLimited).toBe(false);
    expect(result.remainingTime).toBeUndefined();
  });

  it("returns isLimited: true with remainingTime when not allowed", async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: false,
      remainingAttempts: 0,
    });

    const result = await checkLoginRateLimit("127.0.0.1");
    expect(result.isLimited).toBe(true);
    expect(result.remainingTime).toBe(15);
  });

  it("calls checkRateLimit with correct arguments", async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      remainingAttempts: 4,
    });

    await checkLoginRateLimit("192.168.1.1");

    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      "ip:192.168.1.1",
      "login",
      5, // LOGIN_MAX_ATTEMPTS
      15 * 60 * 1000, // 15 minutes in ms
    );
  });
});

describe("checkSignupRateLimit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns isLimited: false when allowed", async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      remainingAttempts: 2,
    });

    const result = await checkSignupRateLimit("127.0.0.1");
    expect(result.isLimited).toBe(false);
    expect(result.remainingTime).toBeUndefined();
  });

  it("returns isLimited: true with remainingTime when not allowed", async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: false,
      remainingAttempts: 0,
    });

    const result = await checkSignupRateLimit("127.0.0.1");
    expect(result.isLimited).toBe(true);
    expect(result.remainingTime).toBe(60);
  });

  it("calls checkRateLimit with correct arguments", async () => {
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      remainingAttempts: 2,
    });

    await checkSignupRateLimit("10.0.0.1");

    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      "ip:10.0.0.1",
      "signup",
      3, // SIGNUP_MAX_ATTEMPTS
      60 * 60 * 1000, // 1 hour in ms
    );
  });
});
