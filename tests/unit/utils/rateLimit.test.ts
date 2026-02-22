jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    rateLimitAttempt: {
      count: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/utils/rateLimit";

const mockCount = prisma.rateLimitAttempt.count as jest.MockedFunction<
  typeof prisma.rateLimitAttempt.count
>;
const mockCreate = prisma.rateLimitAttempt.create as jest.MockedFunction<
  typeof prisma.rateLimitAttempt.create
>;
const mockDeleteMany = prisma.rateLimitAttempt
  .deleteMany as jest.MockedFunction<typeof prisma.rateLimitAttempt.deleteMany>;

describe("checkRateLimit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDeleteMany.mockResolvedValue({ count: 0 } as never);
    mockCreate.mockResolvedValue({} as never);
  });

  it("returns allowed: true and records attempt when count is under maxAttempts", async () => {
    mockCount.mockResolvedValue(2 as never);

    const result = await checkRateLimit("user:1", "login", 5, 60_000);

    expect(result).toEqual({ allowed: true, remainingAttempts: 2 });
    expect(mockCreate).toHaveBeenCalledWith({
      data: { key: "user:1", action: "login" },
    });
  });

  it("returns allowed: false when count >= maxAttempts", async () => {
    mockCount.mockResolvedValue(5 as never);

    const result = await checkRateLimit("user:1", "login", 5, 60_000);

    expect(result).toEqual({ allowed: false, remainingAttempts: 0 });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("calls count with correct where clause using windowMs", async () => {
    const now = Date.now();
    jest.spyOn(Date, "now").mockReturnValue(now);
    mockCount.mockResolvedValue(0 as never);

    const windowMs = 120_000;
    await checkRateLimit("ip:127.0.0.1", "contact", 3, windowMs);

    expect(mockCount).toHaveBeenCalledWith({
      where: {
        key: "ip:127.0.0.1",
        action: "contact",
        createdAt: { gte: new Date(now - windowMs) },
      },
    });

    jest.restoreAllMocks();
  });

  it("calls deleteMany for cleanup (fire-and-forget)", async () => {
    const now = Date.now();
    jest.spyOn(Date, "now").mockReturnValue(now);
    mockCount.mockResolvedValue(0 as never);

    const windowMs = 60_000;
    await checkRateLimit("user:1", "login", 5, windowMs);

    expect(mockDeleteMany).toHaveBeenCalledWith({
      where: {
        OR: [
          {
            key: "user:1",
            action: "login",
            createdAt: { lt: new Date(now - windowMs) },
          },
          {
            createdAt: { lt: new Date(now - 24 * 60 * 60 * 1000) },
          },
        ],
      },
    });

    jest.restoreAllMocks();
  });
});
