jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    review: {
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  },
}));

import prisma from "@/lib/prisma";
import { getLotteryEntriesCount, getLotteryLeaderboard } from "@/lib/lottery";
import { LOTTERY_CONFIG } from "@/constants/lottery";

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

beforeEach(() => {
  jest.clearAllMocks();
});

/* ------------------------------------------------------------------ */
/*  getLotteryEntriesCount                                             */
/* ------------------------------------------------------------------ */

describe("getLotteryEntriesCount", () => {
  it("calls review.count with userId and startDate filter", async () => {
    (mockPrisma.review.count as jest.Mock).mockResolvedValue(3);

    const result = await getLotteryEntriesCount("user1");

    expect(result).toBe(3);
    expect(mockPrisma.review.count).toHaveBeenCalledWith({
      where: {
        userId: "user1",
        createdAt: { gte: LOTTERY_CONFIG.startDate },
      },
    });
  });

  it("returns 0 when no matching reviews", async () => {
    (mockPrisma.review.count as jest.Mock).mockResolvedValue(0);

    const result = await getLotteryEntriesCount("user-empty");
    expect(result).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/*  getLotteryLeaderboard                                              */
/* ------------------------------------------------------------------ */

describe("getLotteryLeaderboard", () => {
  it("returns empty array when no rows", async () => {
    (mockPrisma.review.groupBy as jest.Mock).mockResolvedValue([]);

    const result = await getLotteryLeaderboard();
    expect(result).toEqual([]);
    expect(mockPrisma.user.findMany).not.toHaveBeenCalled();
  });

  it("maps grouped rows to user entries", async () => {
    (mockPrisma.review.groupBy as jest.Mock).mockResolvedValue([
      { userId: "u1", _count: { id: 5 } },
      { userId: "u2", _count: { id: 2 } },
    ]);
    (mockPrisma.user.findMany as jest.Mock).mockResolvedValue([
      { id: "u1", name: "Alice", email: "alice@test.com" },
      { id: "u2", name: "Bob", email: "bob@test.com" },
    ]);

    const result = await getLotteryLeaderboard();

    expect(result).toEqual([
      { userId: "u1", name: "Alice", email: "alice@test.com", entries: 5 },
      { userId: "u2", name: "Bob", email: "bob@test.com", entries: 2 },
    ]);
  });

  it("handles missing user gracefully (null name/email)", async () => {
    (mockPrisma.review.groupBy as jest.Mock).mockResolvedValue([
      { userId: "u1", _count: { id: 3 } },
    ]);
    (mockPrisma.user.findMany as jest.Mock).mockResolvedValue([]);

    const result = await getLotteryLeaderboard();

    expect(result).toEqual([
      { userId: "u1", name: null, email: null, entries: 3 },
    ]);
  });

  it("filters out rows with null userId", async () => {
    (mockPrisma.review.groupBy as jest.Mock).mockResolvedValue([
      { userId: null, _count: { id: 1 } },
      { userId: "u1", _count: { id: 4 } },
    ]);
    (mockPrisma.user.findMany as jest.Mock).mockResolvedValue([
      { id: "u1", name: "Alice", email: "a@b.com" },
    ]);

    const result = await getLotteryLeaderboard();

    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe("u1");
  });
});
