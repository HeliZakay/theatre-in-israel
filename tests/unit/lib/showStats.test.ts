jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    review: { aggregate: jest.fn() },
    show: { update: jest.fn() },
  },
}));

import prisma from "@/lib/prisma";
import { refreshShowStats } from "@/lib/showStats";

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

beforeEach(() => {
  jest.clearAllMocks();
});

/* ------------------------------------------------------------------ */
/*  refreshShowStats                                                  */
/* ------------------------------------------------------------------ */

describe("refreshShowStats", () => {
  it("aggregates reviews and updates show with avg rating and count", async () => {
    (mockPrisma.review.aggregate as jest.Mock).mockResolvedValue({
      _avg: { rating: 4.5 },
      _count: { rating: 3 },
    });
    (mockPrisma.show.update as jest.Mock).mockResolvedValue({});

    await refreshShowStats(10);

    expect(mockPrisma.review.aggregate).toHaveBeenCalledWith({
      where: { showId: 10 },
      _avg: { rating: true },
      _count: { rating: true },
    });

    expect(mockPrisma.show.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: {
        avgRating: 4.5,
        reviewCount: 3,
      },
    });
  });

  it("sets avgRating to null and reviewCount to 0 when there are no reviews", async () => {
    (mockPrisma.review.aggregate as jest.Mock).mockResolvedValue({
      _avg: { rating: null },
      _count: { rating: 0 },
    });
    (mockPrisma.show.update as jest.Mock).mockResolvedValue({});

    await refreshShowStats(99);

    expect(mockPrisma.show.update).toHaveBeenCalledWith({
      where: { id: 99 },
      data: {
        avgRating: null,
        reviewCount: 0,
      },
    });
  });
});
