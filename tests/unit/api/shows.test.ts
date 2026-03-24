jest.mock("@/lib/prisma", () => ({ __esModule: true, default: {} }));
jest.mock("next/cache", () => ({
  unstable_cache: jest.fn((fn: unknown) => fn),
}));

import { GET } from "@/app/api/shows/route";
import { NextRequest } from "next/server";

// Mock the data layer functions
jest.mock("@/lib/data/showsList", () => ({
  buildWhereClause: jest.fn(() => ({})),
  buildOrderBy: jest.fn(() => []),
  fetchShowsPage: jest.fn(),
}));

import {
  fetchShowsPage,
} from "@/lib/data/showsList";

const mockFetchShowsPage = jest.mocked(fetchShowsPage);

function makeRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL("http://localhost/api/shows");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new NextRequest(url);
}

function makeShow(id: number) {
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
    genre: ["דרמה"],
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/shows", () => {
  it("returns paginated shows with hasMore=false when under limit", async () => {
    mockFetchShowsPage.mockResolvedValue(
      Array.from({ length: 5 }, (_, i) => makeShow(i + 1)) as never,
    );

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.shows).toHaveLength(5);
    expect(body.hasMore).toBe(false);
  });

  it("returns hasMore=true when more results than page size", async () => {
    // 13 results means hasMore=true (PER_PAGE is 12, we fetch 13)
    mockFetchShowsPage.mockResolvedValue(
      Array.from({ length: 13 }, (_, i) => makeShow(i + 1)) as never,
    );

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.shows).toHaveLength(12);
    expect(body.hasMore).toBe(true);
  });

  it("uses no-store cache for free-text search", async () => {
    mockFetchShowsPage.mockResolvedValue([] as never);

    const res = await GET(makeRequest({ query: "המלט" }));
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("uses public cache for non-search requests", async () => {
    mockFetchShowsPage.mockResolvedValue([] as never);

    const res = await GET(makeRequest({ theatre: "תיאטרון" }));
    expect(res.headers.get("Cache-Control")).toContain("public");
  });
});
