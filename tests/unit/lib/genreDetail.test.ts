jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    show: { findMany: jest.fn() },
    genre: { findMany: jest.fn() },
  },
}));
jest.mock("next/cache", () => ({
  unstable_cache: jest.fn((fn: unknown) => fn),
}));

import prisma from "@/lib/prisma";
import { getGenreData, getAllGenreStats } from "@/lib/data/genreDetail";

const mockShowFindMany = jest.mocked(prisma.show.findMany);
const mockGenreFindMany = jest.mocked(prisma.genre.findMany);

function makeRawShow(id: number, avgRating: number | null, reviewCount: number) {
  return {
    id,
    slug: `show-${id}`,
    title: `Show ${id}`,
    theatre: "תיאטרון",
    durationMinutes: 90,
    summary: "סיכום",
    description: null,
    avgRating,
    reviewCount,
    genres: [{ genre: { id: 1, name: "דרמה" } }],
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getGenreData", () => {
  it("returns shows and aggregated stats", async () => {
    mockShowFindMany.mockResolvedValue([
      makeRawShow(1, 4.0, 10),
      makeRawShow(2, 5.0, 5),
    ] as never);

    const result = await getGenreData("דרמה");
    expect(result.shows).toHaveLength(2);
    expect(result.stats).toEqual({
      showCount: 2,
      avgRating: 4.5,
      totalReviews: 15,
    });
  });

  it("returns empty stats for unknown genre", async () => {
    mockShowFindMany.mockResolvedValue([] as never);

    const result = await getGenreData("nonexistent");
    expect(result.shows).toHaveLength(0);
    expect(result.stats).toEqual({ showCount: 0, avgRating: null, totalReviews: 0 });
  });
});

describe("getAllGenreStats", () => {
  it("computes stats per genre", async () => {
    mockGenreFindMany.mockResolvedValue([
      {
        name: "דרמה",
        shows: [
          { show: { avgRating: 4.0, reviewCount: 10 } },
          { show: { avgRating: null, reviewCount: 0 } },
        ],
      },
      {
        name: "קומדיה",
        shows: [{ show: { avgRating: 3.0, reviewCount: 5 } }],
      },
    ] as never);

    const result = await getAllGenreStats();
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      name: "דרמה",
      showCount: 2,
      avgRating: 4.0, // only 1 rated show
      totalReviews: 10,
    });
    expect(result[1]).toEqual({
      name: "קומדיה",
      showCount: 1,
      avgRating: 3.0,
      totalReviews: 5,
    });
  });
});
