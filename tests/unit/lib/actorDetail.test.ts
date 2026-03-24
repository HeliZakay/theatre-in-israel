jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    show: { findMany: jest.fn() },
    actor: { findMany: jest.fn() },
  },
}));
jest.mock("next/cache", () => ({
  unstable_cache: jest.fn((fn: unknown) => fn),
}));

import prisma from "@/lib/prisma";
import { getActorData, getAllActorStats } from "@/lib/data/actorDetail";

const mockShowFindMany = jest.mocked(prisma.show.findMany);
const mockActorFindMany = jest.mocked(prisma.actor.findMany);

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

describe("getActorData", () => {
  it("returns shows and aggregated stats", async () => {
    mockShowFindMany.mockResolvedValue([
      makeRawShow(1, 4.0, 10),
      makeRawShow(2, 3.0, 5),
    ] as never);

    const result = await getActorData("דניאל");
    expect(result.shows).toHaveLength(2);
    expect(result.shows[0].genre).toEqual(["דרמה"]);
    expect(result.stats.showCount).toBe(2);
    expect(result.stats.avgRating).toBe(3.5);
    expect(result.stats.totalReviews).toBe(15);
  });

  it("returns null avgRating when no shows have ratings", async () => {
    mockShowFindMany.mockResolvedValue([
      makeRawShow(1, null, 0),
    ] as never);

    const result = await getActorData("דניאל");
    expect(result.stats.avgRating).toBeNull();
  });

  it("returns empty stats for unknown actor", async () => {
    mockShowFindMany.mockResolvedValue([] as never);

    const result = await getActorData("nonexistent");
    expect(result.shows).toHaveLength(0);
    expect(result.stats).toEqual({ showCount: 0, avgRating: null, totalReviews: 0 });
  });
});

describe("getAllActorStats", () => {
  it("computes stats per actor", async () => {
    mockActorFindMany.mockResolvedValue([
      {
        name: "אלי",
        shows: [
          { show: { avgRating: 4.0, reviewCount: 10 } },
          { show: { avgRating: 2.0, reviewCount: 5 } },
        ],
      },
      {
        name: "דנה",
        shows: [{ show: { avgRating: null, reviewCount: 0 } }],
      },
    ] as never);

    const result = await getAllActorStats();
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      name: "אלי",
      showCount: 2,
      avgRating: 3.0,
      totalReviews: 15,
    });
    expect(result[1]).toEqual({
      name: "דנה",
      showCount: 1,
      avgRating: null,
      totalReviews: 0,
    });
  });
});
