jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {},
}));

import { normalizeShow } from "@/lib/showHelpers";

const mockPrismaShow = {
  id: 1,
  title: "Test Show",
  theatre: "Test Theatre",
  description: "A description",
  genres: [{ genre: { name: "drama" } }, { genre: { name: "comedy" } }],
  reviews: [
    {
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
    },
  ],
};

describe("normalizeShow", () => {
  it("returns null for null input", () => {
    expect(normalizeShow(null as any)).toBeNull();
  });

  it("maps genres relation to flat string array", () => {
    const result = normalizeShow(mockPrismaShow as any);
    expect(result).not.toBeNull();
    expect(result!.genre).toEqual(["drama", "comedy"]);
  });

  it("converts Date objects in reviews to ISO strings", () => {
    const result = normalizeShow(mockPrismaShow as any);
    expect(result).not.toBeNull();
    expect(result!.reviews[0].date).toBe("2025-06-15T00:00:00.000Z");
    expect(typeof result!.reviews[0].date).toBe("string");
  });

  it("handles show with no genres", () => {
    const showWithoutGenres = {
      ...mockPrismaShow,
      genres: undefined,
    };
    const result = normalizeShow(showWithoutGenres as any);
    expect(result).not.toBeNull();
    expect(result!.genre).toEqual([]);
  });

  it("handles show with no reviews", () => {
    const showWithoutReviews = {
      ...mockPrismaShow,
      reviews: undefined,
    };
    const result = normalizeShow(showWithoutReviews as any);
    expect(result).not.toBeNull();
    expect(result!.reviews).toEqual([]);
  });

  it("preserves other show properties", () => {
    const result = normalizeShow(mockPrismaShow as any);
    expect(result).not.toBeNull();
    expect(result!.id).toBe(1);
    expect(result!.title).toBe("Test Show");
    expect(result!.theatre).toBe("Test Theatre");
    expect(result!.description).toBe("A description");
  });
});
