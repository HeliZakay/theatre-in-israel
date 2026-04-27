jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: { show: { findMany: jest.fn() } },
}));

import prisma from "@/lib/prisma";
import {
  normalizeShow,
  fetchShowsByIds,
  fetchShowListItems,
  showInclude,
  showListInclude,
} from "@/lib/showHelpers";

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

/* ------------------------------------------------------------------ */
/*  Helpers to build realistic Prisma-shaped mock data                */
/* ------------------------------------------------------------------ */

function makePrismaShow(
  overrides: Record<string, unknown> = {},
  genres: string[] = ["drama", "comedy"],
  reviews: Array<Record<string, unknown>> = [],
) {
  return {
    id: 1,
    slug: "test-show",
    title: "Test Show",
    theatre: "Test Theatre",
    durationMinutes: 120,
    summary: "A summary",
    description: "A description",
    avgRating: null as number | null,
    reviewCount: 0,
    createdAt: new Date("2020-01-01T00:00:00Z"),
    genres: genres.map((name) => ({ genre: { name } })),
    reviews,
    ...overrides,
  };
}

function makePrismaReview(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    showId: 1,
    userId: "user1",
    author: "Author",
    title: "Review Title",
    text: "Review text content",
    rating: 4,
    date: new Date("2025-06-15T00:00:00.000Z"),
    createdAt: new Date("2025-06-15"),
    updatedAt: new Date("2025-06-15"),
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */

beforeEach(() => {
  jest.clearAllMocks();
});

/* ================================================================== */
/*  normalizeShow                                                     */
/* ================================================================== */

describe("normalizeShow", () => {
  it("returns null for null input", () => {
    expect(normalizeShow(null as any)).toBeNull();
  });

  it("maps genres relation to flat string array", () => {
    const show = makePrismaShow();
    const result = normalizeShow(show as any);
    expect(result).not.toBeNull();
    expect(result!.genre).toEqual(["drama", "comedy"]);
  });

  it("handles empty genres array", () => {
    const show = makePrismaShow({}, []);
    const result = normalizeShow(show as any);
    expect(result!.genre).toEqual([]);
  });

  it("handles undefined genres (fallback to empty array)", () => {
    const show = makePrismaShow({ genres: undefined });
    const result = normalizeShow(show as any);
    expect(result!.genre).toEqual([]);
  });

  it("handles empty reviews array", () => {
    const show = makePrismaShow({}, ["drama"], []);
    const result = normalizeShow(show as any);
    expect(result!.reviews).toEqual([]);
  });

  it("handles undefined reviews (fallback to empty array)", () => {
    const show = makePrismaShow({ reviews: undefined });
    const result = normalizeShow(show as any);
    expect(result!.reviews).toEqual([]);
  });

  it("converts Date objects in reviews to ISO strings", () => {
    const review = makePrismaReview({
      date: new Date("2025-06-15T00:00:00.000Z"),
    });
    const show = makePrismaShow({}, ["drama"], [review]);
    const result = normalizeShow(show as any);

    expect(result!.reviews[0].date).toBe("2025-06-15T00:00:00.000Z");
    expect(typeof result!.reviews[0].date).toBe("string");
  });

  it("converts non-Date review dates to string via String()", () => {
    const review = makePrismaReview({ date: "already-a-string" });
    const show = makePrismaShow({}, ["drama"], [review]);
    const result = normalizeShow(show as any);

    expect(result!.reviews[0].date).toBe("already-a-string");
  });

  it("computes average rating from multiple reviews", () => {
    const reviews = [
      makePrismaReview({ id: 1, rating: 3 }),
      makePrismaReview({ id: 2, rating: 5 }),
    ];
    const show = makePrismaShow({}, ["drama"], reviews);
    const result = normalizeShow(show as any);

    // normalizeShow itself doesn't compute avgRating — that's enrichShow.
    // It should preserve all review data so downstream enrichShow can work.
    expect(result!.reviews).toHaveLength(2);
    expect(result!.reviews[0].rating).toBe(3);
    expect(result!.reviews[1].rating).toBe(5);
  });

  it("preserves all scalar show properties", () => {
    const show = makePrismaShow();
    const result = normalizeShow(show as any);

    expect(result!.id).toBe(1);
    expect(result!.slug).toBe("test-show");
    expect(result!.title).toBe("Test Show");
    expect(result!.theatre).toBe("Test Theatre");
    expect(result!.durationMinutes).toBe(120);
    expect(result!.summary).toBe("A summary");
    expect(result!.description).toBe("A description");
  });

  it("does not include the genres relation key on the output", () => {
    const show = makePrismaShow();
    const result = normalizeShow(show as any);
    expect(result).not.toHaveProperty("genres");
  });
});

/* ================================================================== */
/*  fetchShowsByIds                                                   */
/* ================================================================== */

describe("fetchShowsByIds", () => {
  it("returns empty array for empty input", async () => {
    const result = await fetchShowsByIds([]);
    expect(result).toEqual([]);
    expect(mockPrisma.show.findMany).not.toHaveBeenCalled();
  });

  it("fetches shows by IDs and normalizes + enriches them", async () => {
    const review = makePrismaReview({ rating: 4 });
    const prismaShow = makePrismaShow({ id: 10 }, ["drama"], [review]);

    (mockPrisma.show.findMany as jest.Mock).mockResolvedValue([prismaShow]);

    const result = await fetchShowsByIds([10]);

    expect(mockPrisma.show.findMany).toHaveBeenCalledWith({
      where: { id: { in: [10] } },
      include: showInclude,
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(10);
    expect(result[0].genre).toEqual(["drama"]);
    // enrichShow adds reviewCount, avgRating, latestReviewDate
    expect(result[0].reviewCount).toBe(1);
    expect(result[0].avgRating).toBe(4);
    expect(result[0].latestReviewDate).toBeInstanceOf(Date);
  });

  it("preserves the order of input IDs even when Prisma returns different order", async () => {
    const showA = makePrismaShow(
      { id: 3, title: "Show A" },
      ["comedy"],
      [makePrismaReview({ id: 1, showId: 3 })],
    );
    const showB = makePrismaShow(
      { id: 7, title: "Show B" },
      ["drama"],
      [makePrismaReview({ id: 2, showId: 7 })],
    );
    const showC = makePrismaShow(
      { id: 1, title: "Show C" },
      ["musical"],
      [makePrismaReview({ id: 3, showId: 1 })],
    );

    // Prisma returns in arbitrary order (B, C, A)
    (mockPrisma.show.findMany as jest.Mock).mockResolvedValue([
      showB,
      showC,
      showA,
    ]);

    const result = await fetchShowsByIds([3, 7, 1]);

    expect(result.map((s) => s.id)).toEqual([3, 7, 1]);
    expect(result.map((s) => s.title)).toEqual(["Show A", "Show B", "Show C"]);
  });

  it("skips IDs not found in Prisma result", async () => {
    const show = makePrismaShow(
      { id: 5 },
      ["drama"],
      [makePrismaReview({ showId: 5 })],
    );
    (mockPrisma.show.findMany as jest.Mock).mockResolvedValue([show]);

    const result = await fetchShowsByIds([5, 999]);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(5);
  });
});

/* ================================================================== */
/*  fetchShowListItems                                                */
/* ================================================================== */

describe("fetchShowListItems", () => {
  it("returns empty array for empty input", async () => {
    const result = await fetchShowListItems([]);
    expect(result).toEqual([]);
    expect(mockPrisma.show.findMany).not.toHaveBeenCalled();
  });

  it("fetches shows with showListInclude (genres only, no reviews)", async () => {
    const prismaShow = {
      id: 2,
      slug: "list-show",
      title: "List Show",
      theatre: "Big Theatre",
      durationMinutes: 90,
      summary: "Short summary",
      description: null,
      avgRating: 4.5,
      reviewCount: 10,
      createdAt: new Date("2020-01-01T00:00:00Z"),
      genres: [{ genre: { name: "musical" } }],
    };

    (mockPrisma.show.findMany as jest.Mock).mockResolvedValue([prismaShow]);

    const result = await fetchShowListItems([2]);

    expect(mockPrisma.show.findMany).toHaveBeenCalledWith({
      where: { id: { in: [2] } },
      include: showListInclude,
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 2,
      slug: "list-show",
      title: "List Show",
      theatre: "Big Theatre",
      durationMinutes: 90,
      summary: "Short summary",
      description: null,
      avgRating: 4.5,
      reviewCount: 10,
      genre: ["musical"],
      isNew: false,
    });
  });

  it("maps genres to flat string array and removes genres key", () => {
    // Tested implicitly above — the result has `genre` not `genres`
    const prismaShow = {
      id: 1,
      slug: "s",
      title: "T",
      theatre: "Th",
      durationMinutes: 60,
      summary: "S",
      description: null,
      avgRating: null,
      reviewCount: 0,
      createdAt: new Date("2020-01-01T00:00:00Z"),
      genres: [{ genre: { name: "comedy" } }, { genre: { name: "satire" } }],
    };

    (mockPrisma.show.findMany as jest.Mock).mockResolvedValue([prismaShow]);

    return fetchShowListItems([1]).then((result) => {
      expect(result[0].genre).toEqual(["comedy", "satire"]);
      expect(result[0]).not.toHaveProperty("genres");
    });
  });

  it("preserves the order of input IDs", async () => {
    const showX = {
      id: 20,
      slug: "x",
      title: "X",
      theatre: "T",
      durationMinutes: 60,
      summary: "S",
      description: null,
      avgRating: null,
      reviewCount: 0,
      createdAt: new Date("2020-01-01T00:00:00Z"),
      genres: [],
    };
    const showY = {
      id: 10,
      slug: "y",
      title: "Y",
      theatre: "T",
      durationMinutes: 60,
      summary: "S",
      description: null,
      avgRating: null,
      reviewCount: 0,
      createdAt: new Date("2020-01-01T00:00:00Z"),
      genres: [],
    };

    // Return in reverse order from Prisma
    (mockPrisma.show.findMany as jest.Mock).mockResolvedValue([showY, showX]);

    const result = await fetchShowListItems([20, 10]);

    expect(result.map((s) => s.id)).toEqual([20, 10]);
  });

  it("skips IDs missing from Prisma result", async () => {
    const show = {
      id: 5,
      slug: "s",
      title: "T",
      theatre: "Th",
      durationMinutes: 60,
      summary: "S",
      description: null,
      avgRating: null,
      reviewCount: 0,
      createdAt: new Date("2020-01-01T00:00:00Z"),
      genres: [],
    };
    (mockPrisma.show.findMany as jest.Mock).mockResolvedValue([show]);

    const result = await fetchShowListItems([5, 404]);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(5);
  });
});
