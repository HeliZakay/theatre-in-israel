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

import { DELETE, GET } from "@/app/api/watchlist/[showId]/route";
import { requireApiAuth } from "@/utils/apiMiddleware";
import { removeFromWatchlist, isShowInWatchlist } from "@/lib/watchlist";
import { getServerSession } from "next-auth";

const mockSession = {
  user: { id: "user-123", name: "Test User", email: "test@test.com" },
  expires: "2099-01-01",
};

function createMockParams(showId: string) {
  return { params: Promise.resolve({ showId }) };
}

describe("DELETE /api/watchlist/[showId]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireApiAuth as jest.Mock).mockResolvedValue({
      session: mockSession,
      error: undefined,
    });
    (removeFromWatchlist as jest.Mock).mockResolvedValue(true);
    (isShowInWatchlist as jest.Mock).mockResolvedValue(false);
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

    const response = await DELETE({} as Request, createMockParams("1"));

    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid showId", async () => {
    const response = await DELETE({} as Request, createMockParams("abc"));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("מזהה הצגה לא תקין");
  });

  it("returns 404 when not in watchlist", async () => {
    (removeFromWatchlist as jest.Mock).mockResolvedValue(false);

    const response = await DELETE({} as Request, createMockParams("1"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("ההצגה לא נמצאה ברשימת הצפייה");
  });

  it("removes from watchlist successfully", async () => {
    (removeFromWatchlist as jest.Mock).mockResolvedValue(true);

    const response = await DELETE({} as Request, createMockParams("1"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(removeFromWatchlist).toHaveBeenCalledWith("user-123", 1);
  });

  it("returns 500 for unexpected error", async () => {
    (removeFromWatchlist as jest.Mock).mockRejectedValue(
      new Error("unexpected"),
    );

    const response = await DELETE({} as Request, createMockParams("1"));

    expect(response.status).toBe(500);
  });
});

describe("GET /api/watchlist/[showId]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireApiAuth as jest.Mock).mockResolvedValue({
      session: mockSession,
      error: undefined,
    });
    (removeFromWatchlist as jest.Mock).mockResolvedValue(true);
    (isShowInWatchlist as jest.Mock).mockResolvedValue(false);
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
  });

  it("returns 401 when not authenticated", async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const response = await GET({} as Request, createMockParams("1"));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("יש להתחבר כדי לנהל רשימת צפייה");
  });

  it("returns 400 for invalid showId", async () => {
    const response = await GET({} as Request, createMockParams("abc"));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("מזהה הצגה לא תקין");
  });

  it("returns inWatchlist status", async () => {
    (isShowInWatchlist as jest.Mock).mockResolvedValue(true);

    const response = await GET({} as Request, createMockParams("1"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.inWatchlist).toBe(true);
    expect(isShowInWatchlist).toHaveBeenCalledWith("user-123", 1);
  });
});
