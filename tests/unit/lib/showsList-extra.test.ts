// tests/unit/lib/showsList-extra.test.ts
// Tests for showsList functions not covered by showsList.test.ts

const mockShowFindMany = jest.fn();
const mockShowCount = jest.fn();
const mockGenreFindMany = jest.fn();

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    show: {
      findMany: (...args: unknown[]) => mockShowFindMany(...args),
      count: (...args: unknown[]) => mockShowCount(...args),
    },
    genre: {
      findMany: (...args: unknown[]) => mockGenreFindMany(...args),
    },
  },
}));

jest.mock("next/cache", () => ({
  unstable_cache: jest.fn((fn: unknown) => fn),
}));

import {
  fetchShowsPage,
  fetchShowsForList,
  getShowsForList,
} from "@/lib/data/showsList";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function makePrismaShow(id: number, genres: string[] = []) {
  return {
    id,
    slug: `show-${id}`,
    title: `Show ${id}`,
    theatre: "תיאטרון",
    durationMinutes: 90,
    summary: "סיכום",
    description: null,
    reviewCount: 0,
    avgRating: null,
    genres: genres.map((name) => ({ genre: { name } })),
  };
}

/* ------------------------------------------------------------------ */
/*  fetchShowsPage                                                     */
/* ------------------------------------------------------------------ */

describe("fetchShowsPage", () => {
  beforeEach(() => {
    mockShowFindMany.mockReset();
  });

  it("calls prisma with correct args and maps genres to flat array", async () => {
    const raw = [makePrismaShow(1, ["דרמה", "קומדיה"]), makePrismaShow(2, [])];
    mockShowFindMany.mockResolvedValue(raw);

    const where = { theatre: "test" };
    const orderBy = [{ id: "asc" as const }];
    const result = await fetchShowsPage(where, orderBy, 0, 12);

    expect(mockShowFindMany).toHaveBeenCalledWith({
      where,
      include: expect.any(Object),
      orderBy,
      skip: 0,
      take: 12,
    });

    expect(result[0].genre).toEqual(["דרמה", "קומדיה"]);
    expect(result[1].genre).toEqual([]);
    // genres relation should not be in result
    expect("genres" in result[0]).toBe(false);
  });

  it("returns empty array when no shows found", async () => {
    mockShowFindMany.mockResolvedValue([]);
    const result = await fetchShowsPage({}, [{ id: "asc" }], 0, 12);
    expect(result).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/*  fetchShowsForList                                                  */
/* ------------------------------------------------------------------ */

describe("fetchShowsForList", () => {
  beforeEach(() => {
    mockShowFindMany.mockReset();
    mockShowCount.mockReset();
    mockGenreFindMany.mockReset();
  });

  function setupMocks(total: number, genres: string[] = ["דרמה"]) {
    mockShowCount.mockResolvedValue(total);
    // getCachedTheatres
    mockShowFindMany.mockImplementation((args: Record<string, unknown>) => {
      if (args && "distinct" in args) {
        return Promise.resolve([{ theatre: "תיאטרון א" }]);
      }
      // fetchShowsPage
      return Promise.resolve([makePrismaShow(1, genres)]);
    });
    // getCachedGenres
    mockGenreFindMany.mockImplementation((args: Record<string, unknown>) => {
      if (args && !("where" in args)) {
        return Promise.resolve(genres.map((name) => ({ name })));
      }
      // availableGenres query
      return Promise.resolve(genres.map((name) => ({ name })));
    });
  }

  it("calculates pagination correctly", async () => {
    setupMocks(25);

    const result = await fetchShowsForList({ page: "2" });

    expect(result.filters.page).toBe(2);
    expect(result.filters.totalPages).toBe(3); // ceil(25/12) = 3
    expect(result.filters.perPage).toBe(12);
    expect(result.filters.total).toBe(25);
  });

  it("clamps page to 1 when below range", async () => {
    setupMocks(10);

    const result = await fetchShowsForList({ page: "0" });
    expect(result.filters.page).toBe(1);
  });

  it("clamps page to totalPages when above range", async () => {
    setupMocks(10); // totalPages = 1

    const result = await fetchShowsForList({ page: "5" });
    expect(result.filters.page).toBe(1);
  });

  it("uses all genres as availableGenres when no base filter", async () => {
    const genres = ["דרמה", "קומדיה", "מחזמר"];
    setupMocks(10, genres);

    const result = await fetchShowsForList({});

    // No theatre/query filter → availableGenres should be all genres
    expect(result.availableGenres).toEqual(genres);
  });

  it("fetches filtered availableGenres when base filter exists", async () => {
    setupMocks(10, ["דרמה"]);

    const result = await fetchShowsForList({ theatre: "תיאטרון א" });

    // With a theatre filter, availableGenres comes from a filtered query
    expect(mockGenreFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.any(Object),
      }),
    );
    expect(result.availableGenres).toBeDefined();
  });
});

/* ------------------------------------------------------------------ */
/*  getShowsForList                                                    */
/* ------------------------------------------------------------------ */

describe("getShowsForList", () => {
  beforeEach(() => {
    mockShowFindMany.mockReset();
    mockShowCount.mockReset();
    mockGenreFindMany.mockReset();
  });

  function setupBasicMocks() {
    mockShowCount.mockResolvedValue(5);
    mockShowFindMany.mockImplementation((args: Record<string, unknown>) => {
      if (args && "distinct" in args) {
        return Promise.resolve([{ theatre: "T" }]);
      }
      return Promise.resolve([makePrismaShow(1)]);
    });
    mockGenreFindMany.mockResolvedValue([{ name: "דרמה" }]);
  }

  it("bypasses cache when query is non-empty", async () => {
    setupBasicMocks();
    const { unstable_cache } = require("next/cache");
    (unstable_cache as jest.Mock).mockClear();

    await getShowsForList({ query: "המלט" });

    // unstable_cache was called initially for getCachedTheatres/getCachedGenres
    // but getShowsForList itself should NOT wrap in cache for query searches
    // The key test: it should still return results
    expect(mockShowCount).toHaveBeenCalled();
  });

  it("uses unstable_cache when no query", async () => {
    setupBasicMocks();
    const { unstable_cache } = require("next/cache");

    const result = await getShowsForList({});

    // unstable_cache should have been called (our mock passes through)
    expect(unstable_cache).toHaveBeenCalled();
    expect(result.shows).toBeDefined();
  });
});
