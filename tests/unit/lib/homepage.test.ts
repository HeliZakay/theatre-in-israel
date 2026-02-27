// tests/unit/lib/homepage.test.ts

jest.mock("@/lib/prisma", () => ({ __esModule: true, default: {} }));
jest.mock("next/cache", () => ({
  unstable_cache: jest.fn((fn: unknown) => fn),
}));

import type { ShowListItem } from "@/types";
import { deduplicateSections } from "@/lib/data/homepage";

/* ------------------------------------------------------------------ */
/*  Helper to build ShowListItem stubs                                */
/* ------------------------------------------------------------------ */

function makeShow(
  id: number,
  overrides: Partial<ShowListItem> = {},
): ShowListItem {
  return {
    id,
    slug: `show-${id}`,
    title: `Show ${id}`,
    theatre: "תיאטרון",
    durationMinutes: 90,
    summary: "סיכום",
    description: null,
    genre: [],
    reviewCount: 0,
    avgRating: null,
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */

describe("deduplicateSections", () => {
  it("no overlap between sections — each section keeps its shows", () => {
    const sections = [
      { key: "a", shows: [makeShow(1), makeShow(2), makeShow(3)] },
      { key: "b", shows: [makeShow(4), makeShow(5), makeShow(6)] },
    ];

    const result = deduplicateSections(sections);

    expect(result.a.map((s) => s.id)).toEqual([1, 2, 3]);
    expect(result.b.map((s) => s.id)).toEqual([4, 5, 6]);
  });

  it("shows appearing in multiple sections are deduplicated", () => {
    const sections = [
      { key: "a", shows: [makeShow(1), makeShow(2), makeShow(3)] },
      {
        key: "b",
        shows: [makeShow(2), makeShow(3), makeShow(4), makeShow(5)],
      },
    ];

    const result = deduplicateSections(sections);

    expect(result.a.map((s) => s.id)).toEqual([1, 2, 3]);
    // 2 and 3 already seen in section a → unique picks are 4, 5
    // but displayLimit=10 > 2 unique, so dupes 2, 3 backfill
    expect(result.b.map((s) => s.id)).toEqual([4, 5, 2, 3]);
  });

  it("allows duplicates as fallback when section can't fill displayLimit", () => {
    // Section b has 5 shows, but 3 overlap with section a.
    // With displayLimit=4, only 2 unique remain (4, 5).
    // It should fill the remaining 2 spots with duplicates from the
    // original list (2, 3) that aren't already selected for section b.
    const sections = [
      { key: "a", shows: [makeShow(1), makeShow(2), makeShow(3)] },
      {
        key: "b",
        shows: [makeShow(2), makeShow(3), makeShow(4), makeShow(5)],
      },
    ];

    const result = deduplicateSections(sections, 4);

    expect(result.a.map((s) => s.id)).toEqual([1, 2, 3]);
    // unique: 4, 5 (2 items). Need 2 more → fill from dupes: 2, 3
    expect(result.b.map((s) => s.id)).toEqual([4, 5, 2, 3]);
  });

  it("respects initialSeenIds — pre-excluded IDs are treated as seen", () => {
    const sections = [
      { key: "a", shows: [makeShow(1), makeShow(2), makeShow(3)] },
      { key: "b", shows: [makeShow(4), makeShow(5)] },
    ];

    // Pre-exclude show 1
    const result = deduplicateSections(sections, 10, [1]);

    // Show 1 is excluded from section a, but backfills as a dupe
    // since unique count (2) < displayLimit (10)
    expect(result.a.map((s) => s.id)).toEqual([2, 3, 1]);
    expect(result.b.map((s) => s.id)).toEqual([4, 5]);
  });

  it("handles empty sections gracefully", () => {
    const result = deduplicateSections([]);
    expect(result).toEqual({});
  });

  it("handles sections with empty shows arrays", () => {
    const sections = [
      { key: "a", shows: [] },
      { key: "b", shows: [makeShow(1)] },
    ];

    const result = deduplicateSections(sections);

    expect(result.a).toEqual([]);
    expect(result.b.map((s) => s.id)).toEqual([1]);
  });

  it("preserves order within sections after deduplication", () => {
    const sections = [
      { key: "a", shows: [makeShow(10), makeShow(20)] },
      {
        key: "b",
        shows: [makeShow(20), makeShow(30), makeShow(40), makeShow(50)],
      },
    ];

    const result = deduplicateSections(sections);

    expect(result.a.map((s) => s.id)).toEqual([10, 20]);
    // 20 is removed; remaining unique shows preserved in order.
    // Since unique (3) < displayLimit (10), dupe 20 backfills.
    expect(result.b.map((s) => s.id)).toEqual([30, 40, 50, 20]);
  });

  it("works with displayLimit smaller than available shows", () => {
    const sections = [
      {
        key: "a",
        shows: [
          makeShow(1),
          makeShow(2),
          makeShow(3),
          makeShow(4),
          makeShow(5),
        ],
      },
      { key: "b", shows: [makeShow(6), makeShow(7), makeShow(8)] },
    ];

    const result = deduplicateSections(sections, 2);

    // Only the first 2 unique shows are kept per section
    expect(result.a.map((s) => s.id)).toEqual([1, 2]);
    expect(result.b.map((s) => s.id)).toEqual([6, 7]);
  });
});
