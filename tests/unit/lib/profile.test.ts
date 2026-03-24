jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: { user: { findUnique: jest.fn() } },
}));

import prisma from "@/lib/prisma";
import { getUserProfile } from "@/lib/data/profile";

const mockFindUnique = jest.mocked(prisma.user.findUnique);

beforeEach(() => {
  jest.clearAllMocks();
});

describe("getUserProfile", () => {
  it("returns profile with counts when user exists", async () => {
    mockFindUnique.mockResolvedValue({
      name: "אלי",
      email: "eli@test.com",
      image: null,
      createdAt: new Date("2026-01-01"),
      _count: { reviews: 5, watchlist: 3 },
    } as never);

    const result = await getUserProfile("user-1");
    expect(result).toEqual({
      name: "אלי",
      email: "eli@test.com",
      image: null,
      createdAt: new Date("2026-01-01"),
      reviewCount: 5,
      watchlistCount: 3,
    });
  });

  it("returns null when user not found", async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await getUserProfile("nonexistent");
    expect(result).toBeNull();
  });
});
