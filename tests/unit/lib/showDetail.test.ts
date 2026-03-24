jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: { show: { findUnique: jest.fn() } },
}));
jest.mock("next/cache", () => ({
  unstable_cache: jest.fn((fn: unknown) => fn),
}));

import prisma from "@/lib/prisma";
import { getShowBySlug, getShowById } from "@/lib/data/showDetail";

const mockFindUnique = jest.mocked(prisma.show.findUnique);

const fakeShow = {
  id: 1,
  slug: "hamlet",
  title: "המלט",
  theatre: "תיאטרון הקאמרי",
  durationMinutes: 120,
  summary: "סיכום",
  description: null,
  avgRating: 4.5,
  reviewCount: 10,
  genres: [{ genre: { id: 1, name: "דרמה" } }],
  reviews: [],
  events: [],
  actors: [],
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getShowBySlug", () => {
  it("returns normalized show when found", async () => {
    mockFindUnique.mockResolvedValue(fakeShow as never);
    const result = await getShowBySlug("hamlet");
    expect(result).not.toBeNull();
    expect(result!.slug).toBe("hamlet");
    expect(result!.genre).toEqual(["דרמה"]);
    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: "hamlet" } }),
    );
  });

  it("returns null when not found", async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await getShowBySlug("nonexistent");
    expect(result).toBeNull();
  });

  it("returns null for empty slug", async () => {
    const result = await getShowBySlug("");
    expect(result).toBeNull();
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it("decodes URL-encoded slug", async () => {
    mockFindUnique.mockResolvedValue(fakeShow as never);
    await getShowBySlug("%D7%94%D7%9E%D7%9C%D7%98");
    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: "המלט" } }),
    );
  });
});

describe("getShowById", () => {
  it("returns show for valid numeric ID", async () => {
    mockFindUnique.mockResolvedValue(fakeShow as never);
    const result = await getShowById(1);
    expect(result).not.toBeNull();
    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } }),
    );
  });

  it("returns null for NaN", async () => {
    const result = await getShowById("abc");
    expect(result).toBeNull();
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it("returns null for zero", async () => {
    const result = await getShowById(0);
    expect(result).toBeNull();
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it("returns null for negative ID", async () => {
    const result = await getShowById(-5);
    expect(result).toBeNull();
    expect(mockFindUnique).not.toHaveBeenCalled();
  });
});
