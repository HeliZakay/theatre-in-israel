jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    event: { findMany: jest.fn(), groupBy: jest.fn() },
    venue: { findMany: jest.fn() },
  },
}));
jest.mock("next/cache", () => ({
  unstable_cache: jest.fn((fn: unknown) => fn),
}));

import prisma from "@/lib/prisma";
import { getEvents, getRegionCounts } from "@/lib/data/eventsList";

const mockEventFindMany = jest.mocked(prisma.event.findMany);
const mockEventGroupBy = jest.mocked(prisma.event.groupBy);
const mockVenueFindMany = jest.mocked(prisma.venue.findMany);

function makeEvent(id: number, overrides: Record<string, unknown> = {}) {
  return {
    id,
    date: new Date("2026-03-26"),
    hour: "20:00",
    show: {
      title: `Show ${id}`,
      slug: `show-${id}`,
      theatre: "תיאטרון",
      avgRating: 4.0,
      reviewCount: 5,
    },
    venue: { name: "היכל", city: "תל אביב", regions: ["center"] },
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getEvents", () => {
  it("returns mapped events with default date preset", async () => {
    mockEventFindMany.mockResolvedValue([makeEvent(1)] as never);

    const result = await getEvents({});
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: 1,
        hour: "20:00",
        showTitle: "Show 1",
        showSlug: "show-1",
        venueName: "היכל",
        venueCity: "תל אביב",
      }),
    );
  });

  it("applies region filter to venue where clause", async () => {
    mockEventFindMany.mockResolvedValue([] as never);

    await getEvents({ region: "center" });
    expect(mockEventFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          venue: { regions: { hasSome: ["center"] } },
        }),
      }),
    );
  });

  it("applies city filter to venue where clause", async () => {
    mockEventFindMany.mockResolvedValue([] as never);

    await getEvents({ city: "tel-aviv" });
    expect(mockEventFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          venue: { city: { in: ["תל אביב", "תל אביב-יפו"] } },
        }),
      }),
    );
  });

  it("applies theatre filter to show where clause", async () => {
    mockEventFindMany.mockResolvedValue([] as never);

    await getEvents({ theatre: "תיאטרון הקאמרי" });
    expect(mockEventFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          show: { theatre: "תיאטרון הקאמרי" },
        }),
      }),
    );
  });
});

describe("getRegionCounts", () => {
  it("returns counts per region slug", async () => {
    mockEventGroupBy.mockResolvedValue([
      { venueId: 1, _count: 5 },
      { venueId: 2, _count: 3 },
    ] as never);
    mockVenueFindMany.mockResolvedValue([
      { id: 1, regions: ["center", "sharon"] },
      { id: 2, regions: ["north"] },
    ] as never);

    const result = await getRegionCounts();
    expect(result.center).toBe(5);
    expect(result.sharon).toBe(5);
    expect(result.north).toBe(3);
    expect(result.south).toBe(0);
  });

  it("returns all zeros when no events", async () => {
    mockEventGroupBy.mockResolvedValue([] as never);
    mockVenueFindMany.mockResolvedValue([] as never);

    const result = await getRegionCounts();
    expect(Object.values(result).every((v) => v === 0)).toBe(true);
  });
});
