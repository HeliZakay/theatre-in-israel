jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: { show: { findMany: jest.fn() } },
}));
jest.mock("next/cache", () => ({
  unstable_cache: jest.fn((fn: unknown) => fn),
}));

import prisma from "@/lib/prisma";
import {
  getRelatedByTheatre,
  getRelatedByGenres,
} from "@/lib/data/relatedShows";

const mockFindMany = jest.mocked(prisma.show.findMany);

function makeRawShow(id: number) {
  return {
    id,
    slug: `show-${id}`,
    title: `Show ${id}`,
    theatre: "תיאטרון",
    durationMinutes: 90,
    summary: "סיכום",
    description: null,
    avgRating: 4.0,
    reviewCount: 5,
    genres: [{ genre: { id: 1, name: "דרמה" } }],
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getRelatedByTheatre", () => {
  it("returns shows from the same theatre", async () => {
    mockFindMany.mockResolvedValue([makeRawShow(2), makeRawShow(3)] as never);

    const result = await getRelatedByTheatre("תיאטרון", 1);
    expect(result).toHaveLength(2);
    expect(result[0].genre).toEqual(["דרמה"]);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { theatre: "תיאטרון", id: { not: 1 } },
      }),
    );
  });

  it("returns empty array when no related shows", async () => {
    mockFindMany.mockResolvedValue([] as never);

    const result = await getRelatedByTheatre("תיאטרון", 1);
    expect(result).toEqual([]);
  });
});

describe("getRelatedByGenres", () => {
  it("returns shows sharing genres", async () => {
    mockFindMany.mockResolvedValue([makeRawShow(2)] as never);

    const result = await getRelatedByGenres(["דרמה"], 1);
    expect(result).toHaveLength(1);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { not: 1 },
          genres: { some: { genre: { name: { in: ["דרמה"] } } } },
        }),
      }),
    );
  });

  it("returns empty array for empty genre list", async () => {
    const result = await getRelatedByGenres([], 1);
    expect(result).toEqual([]);
    expect(mockFindMany).not.toHaveBeenCalled();
  });
});
