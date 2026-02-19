// Mock all dependencies BEFORE importing the route
jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {},
}));
jest.mock("@/utils/apiMiddleware");
jest.mock("@/lib/watchlist");
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));
jest.mock("@/lib/auth", () => ({
  authOptions: {},
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data: any, init?: any) => ({
      json: async () => data,
      status: init?.status ?? 200,
    })),
  },
  NextRequest: jest.fn(),
}));

import { POST, GET } from "@/app/api/watchlist/route";
import { requireApiAuth } from "@/utils/apiMiddleware";
import { addToWatchlist, getWatchlistByUser } from "@/lib/watchlist";
import { getServerSession } from "next-auth";

const mockSession = {
  user: { id: "user-123", name: "Test User", email: "test@test.com" },
  expires: "2099-01-01",
};

function createMockRequest(body: any) {
  return { json: jest.fn().mockResolvedValue(body) } as any;
}

describe("POST /api/watchlist", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireApiAuth as jest.Mock).mockResolvedValue({
      session: mockSession,
      error: undefined,
    });
    (addToWatchlist as jest.Mock).mockResolvedValue(undefined);
    (getWatchlistByUser as jest.Mock).mockResolvedValue([]);
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
  });

  it("returns 401 when not authenticated", async () => {
    const errorResponse = {
      json: async () => ({ error: "יש להתחבר כדי לנהל רשימת צפייה" }),
      status: 401,
    };
    (requireApiAuth as jest.Mock).mockResolvedValue({
      session: null,
      error: errorResponse,
    });

    const request = createMockRequest({ showId: 1 });
    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid showId", async () => {
    const request = createMockRequest({ showId: "abc" });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("מזהה הצגה לא תקין");
  });

  it("adds to watchlist successfully", async () => {
    const request = createMockRequest({ showId: 1 });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.ok).toBe(true);
    expect(addToWatchlist).toHaveBeenCalledWith("user-123", 1);
  });

  it("returns 409 for duplicate", async () => {
    (addToWatchlist as jest.Mock).mockRejectedValue({ code: "P2002" });

    const request = createMockRequest({ showId: 1 });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe("ההצגה כבר ברשימת הצפייה");
  });

  it("returns 404 for non-existent show", async () => {
    (addToWatchlist as jest.Mock).mockRejectedValue({ code: "P2003" });

    const request = createMockRequest({ showId: 999 });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("ההצגה לא נמצאה");
  });

  it("returns 500 for unexpected error", async () => {
    (addToWatchlist as jest.Mock).mockRejectedValue(new Error("unexpected"));

    const request = createMockRequest({ showId: 1 });
    const response = await POST(request);

    expect(response.status).toBe(500);
  });
});

describe("GET /api/watchlist", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireApiAuth as jest.Mock).mockResolvedValue({
      session: mockSession,
      error: undefined,
    });
    (addToWatchlist as jest.Mock).mockResolvedValue(undefined);
    (getWatchlistByUser as jest.Mock).mockResolvedValue([]);
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
  });

  it("returns 401 when not authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("יש להתחבר כדי לנהל רשימת צפייה");
  });

  it("returns watchlist for authenticated user", async () => {
    const mockWatchlist = [{ showId: 1 }, { showId: 2 }];
    (getWatchlistByUser as jest.Mock).mockResolvedValue(mockWatchlist);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.watchlist).toEqual(mockWatchlist);
    expect(getWatchlistByUser).toHaveBeenCalledWith("user-123");
  });
});
