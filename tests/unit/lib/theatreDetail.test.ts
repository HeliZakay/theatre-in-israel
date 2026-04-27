jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    show: { findMany: jest.fn(), groupBy: jest.fn() },
    event: { count: jest.fn() },
  },
}));
jest.mock("next/cache", () => ({
  unstable_cache: jest.fn((fn: unknown) => fn),
}));

import prisma from "@/lib/prisma";
import {
  getTheatreData,
  getAllTheatreStats,
} from "@/lib/data/theatreDetail";

const mockShowFindMany = jest.mocked(prisma.show.findMany);
const mockEventCount = jest.mocked(prisma.event.count);
const mockShowGroupBy = jest.mocked(prisma.show.groupBy);

function makeRawShow(id: number, avgRating: number | null, reviewCount: number) {
  return {
    id,
    slug: `show-${id}`,
    title: `Show ${id}`,
    theatre: "תיאטרון הקאמרי",
    durationMinutes: 90,
    summary: "סיכום",
    description: null,
    avgRating,
    reviewCount,
    createdAt: new Date("2020-01-01T00:00:00Z"),
    genres: [{ genre: { id: 1, name: "דרמה" } }],
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getTheatreData", () => {
  it("returns shows and stats with upcoming event count", async () => {
    mockShowFindMany.mockResolvedValue([
      makeRawShow(1, 4.0, 10),
      makeRawShow(2, 3.0, 5),
    ] as never);
    mockEventCount.mockResolvedValue(7 as never);

    const result = await getTheatreData("תיאטרון הקאמרי");
    expect(result.shows).toHaveLength(2);
    expect(result.stats).toEqual({
      showCount: 2,
      avgRating: 3.5,
      totalReviews: 15,
      upcomingEventCount: 7,
    });
  });

  it("returns null avgRating when no rated shows", async () => {
    mockShowFindMany.mockResolvedValue([makeRawShow(1, null, 0)] as never);
    mockEventCount.mockResolvedValue(0 as never);

    const result = await getTheatreData("empty");
    expect(result.stats.avgRating).toBeNull();
    expect(result.stats.upcomingEventCount).toBe(0);
  });
});

describe("getAllTheatreStats", () => {
  it("aggregates stats from groupBy", async () => {
    mockShowGroupBy.mockResolvedValue([
      {
        theatre: "תיאטרון הקאמרי",
        _count: 5,
        _avg: { avgRating: 4.2 },
        _sum: { reviewCount: 50 },
      },
      {
        theatre: "תיאטרון גשר",
        _count: 3,
        _avg: { avgRating: null },
        _sum: { reviewCount: 0 },
      },
    ] as never);

    const result = await getAllTheatreStats();
    expect(result).toEqual([
      { name: "תיאטרון הקאמרי", showCount: 5, avgRating: 4.2, totalReviews: 50 },
      { name: "תיאטרון גשר", showCount: 3, avgRating: null, totalReviews: 0 },
    ]);
  });
});
