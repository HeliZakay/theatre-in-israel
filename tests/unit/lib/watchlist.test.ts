jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    watchlist: {
      findMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

import prisma from "@/lib/prisma";
import {
  getWatchlistByUser,
  addToWatchlist,
  removeFromWatchlist,
  isShowInWatchlist,
  getWatchlistShowIds,
} from "@/lib/watchlist";

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

beforeEach(() => {
  jest.clearAllMocks();
});

/* ------------------------------------------------------------------ */
/*  getWatchlistByUser                                                */
/* ------------------------------------------------------------------ */

describe("getWatchlistByUser", () => {
  it("returns watchlist items with show data for the given user", async () => {
    const items = [
      {
        id: 1,
        userId: "user1",
        showId: 10,
        createdAt: new Date(),
        show: { id: 10, slug: "hamlet", title: "Hamlet", theatre: "Habima" },
      },
      {
        id: 2,
        userId: "user1",
        showId: 20,
        createdAt: new Date(),
        show: { id: 20, slug: "cats", title: "Cats", theatre: "Cameri" },
      },
    ];

    (mockPrisma.watchlist.findMany as jest.Mock).mockResolvedValue(items);

    const result = await getWatchlistByUser("user1");

    expect(result).toEqual(items);
    expect(mockPrisma.watchlist.findMany).toHaveBeenCalledWith({
      where: { userId: "user1" },
      include: {
        show: {
          select: { id: true, slug: true, title: true, theatre: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  });

  it("returns an empty array when the user has no watchlist items", async () => {
    (mockPrisma.watchlist.findMany as jest.Mock).mockResolvedValue([]);

    const result = await getWatchlistByUser("user-empty");
    expect(result).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/*  addToWatchlist                                                    */
/* ------------------------------------------------------------------ */

describe("addToWatchlist", () => {
  it("calls prisma.watchlist.create with userId and showId", async () => {
    (mockPrisma.watchlist.create as jest.Mock).mockResolvedValue({
      id: 1,
      userId: "user1",
      showId: 5,
      createdAt: new Date(),
    });

    await addToWatchlist("user1", 5);

    expect(mockPrisma.watchlist.create).toHaveBeenCalledWith({
      data: { userId: "user1", showId: 5 },
    });
  });

  it("propagates Prisma errors (e.g. duplicate)", async () => {
    (mockPrisma.watchlist.create as jest.Mock).mockRejectedValue(
      new Error("P2002"),
    );

    await expect(addToWatchlist("user1", 5)).rejects.toThrow("P2002");
  });
});

/* ------------------------------------------------------------------ */
/*  removeFromWatchlist                                               */
/* ------------------------------------------------------------------ */

describe("removeFromWatchlist", () => {
  it("returns true when the item was deleted", async () => {
    (mockPrisma.watchlist.deleteMany as jest.Mock).mockResolvedValue({
      count: 1,
    });

    const result = await removeFromWatchlist("user1", 10);

    expect(result).toBe(true);
    expect(mockPrisma.watchlist.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user1", showId: 10 },
    });
  });

  it("returns false when the item was not found", async () => {
    (mockPrisma.watchlist.deleteMany as jest.Mock).mockResolvedValue({
      count: 0,
    });

    const result = await removeFromWatchlist("user1", 999);
    expect(result).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  isShowInWatchlist                                                 */
/* ------------------------------------------------------------------ */

describe("isShowInWatchlist", () => {
  it("returns true when the item exists", async () => {
    (mockPrisma.watchlist.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      userId: "user1",
      showId: 10,
      createdAt: new Date(),
    });

    const result = await isShowInWatchlist("user1", 10);

    expect(result).toBe(true);
    expect(mockPrisma.watchlist.findUnique).toHaveBeenCalledWith({
      where: { userId_showId: { userId: "user1", showId: 10 } },
    });
  });

  it("returns false when the item does not exist", async () => {
    (mockPrisma.watchlist.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await isShowInWatchlist("user1", 999);
    expect(result).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  getWatchlistShowIds                                               */
/* ------------------------------------------------------------------ */

describe("getWatchlistShowIds", () => {
  it("returns an array of showIds", async () => {
    (mockPrisma.watchlist.findMany as jest.Mock).mockResolvedValue([
      { showId: 1 },
      { showId: 7 },
      { showId: 42 },
    ]);

    const result = await getWatchlistShowIds("user1");

    expect(result).toEqual([1, 7, 42]);
    expect(mockPrisma.watchlist.findMany).toHaveBeenCalledWith({
      where: { userId: "user1" },
      select: { showId: true },
    });
  });

  it("returns an empty array when the user has no watchlist items", async () => {
    (mockPrisma.watchlist.findMany as jest.Mock).mockResolvedValue([]);

    const result = await getWatchlistShowIds("user-empty");
    expect(result).toEqual([]);
  });
});
