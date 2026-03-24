jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    $queryRaw: jest.fn(),
    show: { findMany: jest.fn() },
  },
}));
jest.mock("next/cache", () => ({
  unstable_cache: jest.fn((fn: unknown) => fn),
}));

import prisma from "@/lib/prisma";
import { getCityData, getAllCityStats } from "@/lib/data/cityDetail";

const mockQueryRaw = jest.mocked(prisma.$queryRaw);
const mockShowFindMany = jest.mocked(prisma.show.findMany);

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

describe("getCityData", () => {
  it("returns venues, top shows, and stats", async () => {
    // First queryRaw: venues
    mockQueryRaw.mockResolvedValueOnce([
      { name: "היכל התרבות", city: "תל אביב", event_count: 5 },
      { name: "צוותא", city: "תל אביב", event_count: 0 },
    ] as never);
    // Second queryRaw: show IDs
    mockQueryRaw.mockResolvedValueOnce([{ id: 1 }, { id: 2 }] as never);
    mockShowFindMany.mockResolvedValue([makeRawShow(1), makeRawShow(2)] as never);

    const result = await getCityData(["תל אביב", "תל אביב-יפו"]);

    expect(result.topShows).toHaveLength(2);
    // Only venues with upcomingEventCount > 0
    expect(result.venues).toHaveLength(1);
    expect(result.venues[0].name).toBe("היכל התרבות");
    expect(result.stats).toEqual({
      upcomingEventCount: 5,
      upcomingShowCount: 2,
      venueCount: 1,
    });
  });

  it("returns empty data when no venues match", async () => {
    mockQueryRaw.mockResolvedValueOnce([] as never); // venues
    mockQueryRaw.mockResolvedValueOnce([] as never); // show IDs

    const result = await getCityData(["nonexistent"]);
    expect(result.topShows).toHaveLength(0);
    expect(result.venues).toHaveLength(0);
    expect(result.stats).toEqual({
      upcomingEventCount: 0,
      upcomingShowCount: 0,
      venueCount: 0,
    });
  });
});

describe("getAllCityStats", () => {
  it("returns sorted stats for all cities", async () => {
    // Each city triggers one queryRaw call
    mockQueryRaw
      .mockResolvedValueOnce([{ event_count: 10, venue_count: 3, show_count: 5 }] as never)
      .mockResolvedValueOnce([{ event_count: 2, venue_count: 1, show_count: 1 }] as never);

    const result = await getAllCityStats([
      { slug: "haifa", name: "חיפה", aliases: ["חיפה"] },
      { slug: "tel-aviv", name: "תל אביב", aliases: ["תל אביב"] },
    ]);

    // Sorted by upcomingEventCount desc
    expect(result[0]).toEqual({
      slug: "haifa",
      name: "חיפה",
      upcomingEventCount: 10,
      venueCount: 3,
      showCount: 5,
    });
    expect(result[1]).toEqual({
      slug: "tel-aviv",
      name: "תל אביב",
      upcomingEventCount: 2,
      venueCount: 1,
      showCount: 1,
    });
  });
});
