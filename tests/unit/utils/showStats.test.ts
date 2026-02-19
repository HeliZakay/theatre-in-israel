import {
  getAverageRating,
  getLatestReviewDate,
  getShowStats,
  enrichShow,
} from "@/utils/showStats";
import type { Review, Show } from "@/types";

function makeReview(overrides: Partial<Review> = {}): Review {
  return {
    id: 1,
    showId: 1,
    userId: "user1",
    author: "Author",
    title: "Title",
    text: "Some review text",
    rating: 3,
    date: "2025-01-15T00:00:00.000Z",
    createdAt: new Date("2025-01-15"),
    updatedAt: new Date("2025-01-15"),
    ...overrides,
  };
}

function makeShow(overrides: Partial<Show> = {}): Show {
  return {
    id: 1,
    title: "Test Show",
    theatre: "Test Theatre",
    genre: ["drama"],
    reviews: [],
    description: null,
    ...overrides,
  };
}

describe("getAverageRating", () => {
  it("returns null for null input", () => {
    expect(getAverageRating(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(getAverageRating(undefined)).toBeNull();
  });

  it("returns null for empty array", () => {
    expect(getAverageRating([])).toBeNull();
  });

  it("returns correct average for a single review", () => {
    const reviews = [makeReview({ rating: 5 })];
    expect(getAverageRating(reviews)).toBe(5);
  });

  it("returns correct average for multiple reviews", () => {
    const reviews = [makeReview({ rating: 2 }), makeReview({ rating: 4 })];
    expect(getAverageRating(reviews)).toBe(3);
  });

  it("handles decimal averages", () => {
    const reviews = [
      makeReview({ rating: 1 }),
      makeReview({ rating: 2 }),
      makeReview({ rating: 3 }),
    ];
    expect(getAverageRating(reviews)).toBe(2);
  });
});

describe("getLatestReviewDate", () => {
  it("returns null for null input", () => {
    expect(getLatestReviewDate(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(getLatestReviewDate(undefined)).toBeNull();
  });

  it("returns null for empty array", () => {
    expect(getLatestReviewDate([])).toBeNull();
  });

  it("returns the date for a single review", () => {
    const reviews = [makeReview({ date: "2025-06-01T00:00:00.000Z" })];
    expect(getLatestReviewDate(reviews)).toEqual(
      new Date("2025-06-01T00:00:00.000Z"),
    );
  });

  it("returns the latest date among multiple reviews", () => {
    const reviews = [
      makeReview({ date: "2025-01-01T00:00:00.000Z" }),
      makeReview({ date: "2025-09-15T00:00:00.000Z" }),
      makeReview({ date: "2025-05-10T00:00:00.000Z" }),
    ];
    expect(getLatestReviewDate(reviews)).toEqual(
      new Date("2025-09-15T00:00:00.000Z"),
    );
  });

  it("skips reviews with invalid dates", () => {
    const reviews = [
      makeReview({ date: "invalid-date" }),
      makeReview({ date: "2025-03-20T00:00:00.000Z" }),
    ];
    expect(getLatestReviewDate(reviews)).toEqual(
      new Date("2025-03-20T00:00:00.000Z"),
    );
  });
});

describe("getShowStats", () => {
  it("returns zeros/nulls for null show", () => {
    expect(getShowStats(null)).toEqual({
      reviewCount: 0,
      avgRating: null,
      latestReviewDate: null,
    });
  });

  it("returns zeros/nulls for undefined show", () => {
    expect(getShowStats(undefined)).toEqual({
      reviewCount: 0,
      avgRating: null,
      latestReviewDate: null,
    });
  });

  it("returns zeros/nulls for show with no reviews", () => {
    const show = makeShow({ reviews: [] });
    expect(getShowStats(show)).toEqual({
      reviewCount: 0,
      avgRating: null,
      latestReviewDate: null,
    });
  });

  it("returns correct stats for show with reviews", () => {
    const reviews = [
      makeReview({ rating: 4, date: "2025-02-01T00:00:00.000Z" }),
      makeReview({ rating: 2, date: "2025-08-01T00:00:00.000Z" }),
    ];
    const show = makeShow({ reviews });
    expect(getShowStats(show)).toEqual({
      reviewCount: 2,
      avgRating: 3,
      latestReviewDate: new Date("2025-08-01T00:00:00.000Z"),
    });
  });
});

describe("enrichShow", () => {
  it("adds reviewCount, avgRating, latestReviewDate to show", () => {
    const reviews = [
      makeReview({ rating: 5, date: "2025-04-10T00:00:00.000Z" }),
    ];
    const show = makeShow({ reviews });
    const enriched = enrichShow(show);

    expect(enriched.reviewCount).toBe(1);
    expect(enriched.avgRating).toBe(5);
    expect(enriched.latestReviewDate).toEqual(
      new Date("2025-04-10T00:00:00.000Z"),
    );
  });

  it("spreads show properties through", () => {
    const show = makeShow({
      id: 42,
      title: "Hamlet",
      theatre: "Globe",
      genre: ["tragedy"],
      reviews: [],
    });
    const enriched = enrichShow(show);

    expect(enriched.id).toBe(42);
    expect(enriched.title).toBe("Hamlet");
    expect(enriched.theatre).toBe("Globe");
    expect(enriched.genre).toEqual(["tragedy"]);
    expect(enriched.reviewCount).toBe(0);
    expect(enriched.avgRating).toBeNull();
    expect(enriched.latestReviewDate).toBeNull();
  });
});
