// tests/unit/lib/homepage-extra.test.ts
// Tests for homepage helpers that aren't covered by homepage.test.ts

const mockFindManyReviews = jest.fn();
const mockFindManyEvents = jest.fn();

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    review: { findMany: (...args: unknown[]) => mockFindManyReviews(...args) },
    event: { findMany: (...args: unknown[]) => mockFindManyEvents(...args) },
  },
}));

jest.mock("next/cache", () => ({
  unstable_cache: jest.fn((fn: unknown) => fn),
}));

import {
  buildDateLabel,
  settled,
  getLatestReviews,
  getUpcomingEventsVaried,
} from "@/lib/data/homepage";
import { mapToShowListItem } from "@/lib/showHelpers";

/* ------------------------------------------------------------------ */
/*  buildDateLabel                                                     */
/* ------------------------------------------------------------------ */

describe("buildDateLabel", () => {
  it('returns "היום" when dateKey equals todayKey', () => {
    expect(buildDateLabel("2026-03-24", "2026-03-24", "2026-03-25")).toBe(
      "היום",
    );
  });

  it('returns "מחר" when dateKey equals tomorrowKey', () => {
    expect(buildDateLabel("2026-03-25", "2026-03-24", "2026-03-25")).toBe(
      "מחר",
    );
  });

  it("returns Hebrew short day name for other dates", () => {
    // 2026-03-26 is a Thursday (יום ה׳)
    const label = buildDateLabel("2026-03-26", "2026-03-24", "2026-03-25");
    expect(typeof label).toBe("string");
    expect(label).not.toBe("היום");
    expect(label).not.toBe("מחר");
    // Hebrew short day names are like "יום א׳", "יום ב׳", etc.
    expect(label.length).toBeGreaterThan(0);
  });
});

/* ------------------------------------------------------------------ */
/*  mapToShowListItem                                                  */
/* ------------------------------------------------------------------ */

describe("mapToShowListItem", () => {
  it("maps genres relation to flat string array", () => {
    const prismaShow = {
      id: 1,
      slug: "show-1",
      title: "Show 1",
      theatre: "תיאטרון",
      durationMinutes: 90,
      summary: "סיכום",
      description: null,
      reviewCount: 0,
      avgRating: null,
      genres: [
        { genre: { name: "דרמה" } },
        { genre: { name: "קומדיה" } },
      ],
    };

    const result = mapToShowListItem(prismaShow as never);
    expect(result.genre).toEqual(["דרמה", "קומדיה"]);
    expect(result.id).toBe(1);
    expect(result.slug).toBe("show-1");
    // genres relation should not leak through
    expect("genres" in result).toBe(false);
  });

  it("handles null/undefined genres gracefully", () => {
    const prismaShow = {
      id: 2,
      slug: "show-2",
      title: "Show 2",
      theatre: "תיאטרון",
      durationMinutes: 60,
      summary: "סיכום",
      description: null,
      reviewCount: 0,
      avgRating: null,
      genres: null,
    };

    const result = mapToShowListItem(prismaShow as never);
    expect(result.genre).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/*  settled                                                            */
/* ------------------------------------------------------------------ */

describe("settled", () => {
  it("returns value for fulfilled result", () => {
    const result: PromiseSettledResult<string> = {
      status: "fulfilled",
      value: "hello",
    };
    expect(settled(result, "fallback")).toBe("hello");
  });

  it("returns fallback for rejected result", () => {
    const result: PromiseSettledResult<string> = {
      status: "rejected",
      reason: new Error("fail"),
    };
    expect(settled(result, "fallback")).toBe("fallback");
  });
});

/* ------------------------------------------------------------------ */
/*  getLatestReviews (fetchLatestReviews via unstable_cache passthrough) */
/* ------------------------------------------------------------------ */

describe("getLatestReviews", () => {
  beforeEach(() => {
    mockFindManyReviews.mockReset();
  });

  it("deduplicates reviews by showId and returns max 6", () => {
    const reviews = [
      { id: 1, author: "A", title: null, text: "t1", rating: 5, createdAt: new Date(), show: { id: 10, slug: "s1", title: "S1", theatre: "T1" } },
      { id: 2, author: "B", title: null, text: "t2", rating: 4, createdAt: new Date(), show: { id: 10, slug: "s1", title: "S1", theatre: "T1" } },
      { id: 3, author: "C", title: null, text: "t3", rating: 3, createdAt: new Date(), show: { id: 20, slug: "s2", title: "S2", theatre: "T2" } },
      { id: 4, author: "D", title: null, text: "t4", rating: 5, createdAt: new Date(), show: { id: 30, slug: "s3", title: "S3", theatre: "T3" } },
      { id: 5, author: "E", title: null, text: "t5", rating: 4, createdAt: new Date(), show: { id: 40, slug: "s4", title: "S4", theatre: "T4" } },
      { id: 6, author: "F", title: null, text: "t6", rating: 3, createdAt: new Date(), show: { id: 50, slug: "s5", title: "S5", theatre: "T5" } },
      { id: 7, author: "G", title: null, text: "t7", rating: 5, createdAt: new Date(), show: { id: 60, slug: "s6", title: "S6", theatre: "T6" } },
      { id: 8, author: "H", title: null, text: "t8", rating: 4, createdAt: new Date(), show: { id: 70, slug: "s7", title: "S7", theatre: "T7" } },
    ];

    mockFindManyReviews.mockResolvedValue(reviews);

    return getLatestReviews().then((result) => {
      // id=2 is a duplicate of show 10, so 7 unique shows → capped at 6
      expect(result).toHaveLength(6);
      // First review for show 10 should be id=1
      expect(result[0].id).toBe(1);
      expect(result[0].showId).toBe(10);
      // No duplicate showIds
      const showIds = result.map((r) => r.showId);
      expect(new Set(showIds).size).toBe(showIds.length);
    });
  });

  it("returns empty array when no reviews exist", () => {
    mockFindManyReviews.mockResolvedValue([]);

    return getLatestReviews().then((result) => {
      expect(result).toEqual([]);
    });
  });
});

/* ------------------------------------------------------------------ */
/*  getUpcomingEventsVaried                                            */
/* ------------------------------------------------------------------ */

describe("getUpcomingEventsVaried", () => {
  beforeEach(() => {
    mockFindManyEvents.mockReset();
  });

  function makeEvent(
    id: number,
    dateStr: string,
    hour: string,
    slug: string,
    region: string,
  ) {
    return {
      id,
      date: new Date(dateStr + "T00:00:00Z"),
      hour,
      show: {
        title: `Show ${slug}`,
        slug,
        theatre: "Theatre",
        avgRating: 4.0,
        reviewCount: 10,
      },
      venue: {
        name: "Venue",
        city: "City",
        regions: [region],
      },
    };
  }

  it("returns [] when fewer than 3 candidates", () => {
    mockFindManyEvents.mockResolvedValue([
      makeEvent(1, "2099-12-01", "20:00", "show-a", "center"),
      makeEvent(2, "2099-12-01", "20:30", "show-b", "center"),
    ]);

    return getUpcomingEventsVaried().then((result) => {
      expect(result).toEqual([]);
    });
  });

  it("returns events when enough candidates exist", () => {
    const events = [
      makeEvent(1, "2099-12-01", "20:00", "show-a", "center"),
      makeEvent(2, "2099-12-01", "20:30", "show-b", "north"),
      makeEvent(3, "2099-12-02", "19:00", "show-c", "south"),
      makeEvent(4, "2099-12-02", "20:00", "show-d", "center"),
    ];

    mockFindManyEvents.mockResolvedValue(events);

    return getUpcomingEventsVaried().then((result) => {
      expect(result.length).toBeGreaterThanOrEqual(3);
      // Each item should have a dateLabel
      for (const item of result) {
        expect(typeof item.dateLabel).toBe("string");
        expect(item.dateLabel.length).toBeGreaterThan(0);
      }
    });
  });

  it("skips duplicate show slugs (deduplication)", () => {
    const events = [
      makeEvent(1, "2099-12-01", "20:00", "show-a", "center"),
      makeEvent(2, "2099-12-01", "21:00", "show-a", "center"), // duplicate slug
      makeEvent(3, "2099-12-01", "20:30", "show-b", "north"),
      makeEvent(4, "2099-12-02", "19:00", "show-c", "south"),
    ];

    mockFindManyEvents.mockResolvedValue(events);

    return getUpcomingEventsVaried().then((result) => {
      const slugs = result.map((e) => e.showSlug);
      expect(new Set(slugs).size).toBe(slugs.length);
    });
  });

  it("skips same region appearing 3 times in a row", () => {
    // All same region — diversity constraint should kick in, second pass relaxes
    const events = [
      makeEvent(1, "2099-12-01", "20:00", "show-a", "center"),
      makeEvent(2, "2099-12-01", "20:30", "show-b", "center"),
      makeEvent(3, "2099-12-01", "21:00", "show-c", "center"),
      makeEvent(4, "2099-12-02", "19:00", "show-d", "center"),
      makeEvent(5, "2099-12-02", "20:00", "show-e", "center"),
      makeEvent(6, "2099-12-02", "21:00", "show-f", "center"),
    ];

    mockFindManyEvents.mockResolvedValue(events);

    return getUpcomingEventsVaried().then((result) => {
      // First pass picks 2 (stops at 3rd consecutive same region)
      // Second pass fills up to target
      expect(result.length).toBeGreaterThanOrEqual(3);
    });
  });

  it("second pass relaxes region constraint to reach target", () => {
    // 3 center + 1 north: first pass gets center, center, north (3), then center again blocked
    // With 5 shows total and target 6, second pass picks remaining
    const events = [
      makeEvent(1, "2099-12-01", "20:00", "show-a", "center"),
      makeEvent(2, "2099-12-01", "20:30", "show-b", "center"),
      makeEvent(3, "2099-12-01", "21:00", "show-c", "north"),
      makeEvent(4, "2099-12-02", "19:00", "show-d", "center"),
      makeEvent(5, "2099-12-02", "20:00", "show-e", "center"),
    ];

    mockFindManyEvents.mockResolvedValue(events);

    return getUpcomingEventsVaried().then((result) => {
      expect(result.length).toBe(5);
      // All unique slugs present
      const slugs = result.map((e) => e.showSlug);
      expect(new Set(slugs).size).toBe(5);
    });
  });
});
