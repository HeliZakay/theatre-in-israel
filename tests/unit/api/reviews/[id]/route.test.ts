jest.mock("@/lib/prisma", () => ({ __esModule: true, default: {} }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("@/utils/apiMiddleware");
jest.mock("@/lib/reviews");
jest.mock("@/utils/profanityFilter");
jest.mock("@/utils/reviewRateLimit");

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data: any, init?: any) => ({
      json: async () => data,
      status: init?.status ?? 200,
    })),
  },
  NextRequest: jest.fn(),
}));

import { PATCH, DELETE } from "@/app/api/reviews/[id]/route";
import { requireApiAuth } from "@/utils/apiMiddleware";
import { updateReviewByOwner, deleteReviewByOwner } from "@/lib/reviews";
import { checkFieldsForProfanity } from "@/utils/profanityFilter";

const mockSession = {
  user: { id: "user-123", name: "Test User", email: "test@test.com" },
  expires: "2099-01-01",
};

function createMockRequest(body: Record<string, any>) {
  return { json: jest.fn().mockResolvedValue(body) } as any;
}

function createMockParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  jest.clearAllMocks();
  (requireApiAuth as jest.Mock).mockResolvedValue({
    session: mockSession,
    error: undefined,
  });
  (checkFieldsForProfanity as jest.Mock).mockReturnValue(null);
  (updateReviewByOwner as jest.Mock).mockResolvedValue({
    id: 1,
    title: "Updated",
  });
  (deleteReviewByOwner as jest.Mock).mockResolvedValue(true);
});

const validPayload = {
  title: "Updated Title",
  rating: 4,
  text: "Updated review text here",
};

describe("PATCH /api/reviews/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    const errorResponse = {
      json: async () => ({ error: "יש להתחבר כדי לערוך ביקורת" }),
      status: 401,
    };
    (requireApiAuth as jest.Mock).mockResolvedValue({
      session: undefined,
      error: errorResponse,
    });

    const req = createMockRequest(validPayload);
    const res = await PATCH(req, createMockParams("1"));

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("יש להתחבר כדי לערוך ביקורת");
  });

  it("returns 400 for invalid review id", async () => {
    const req = createMockRequest(validPayload);
    const res = await PATCH(req, createMockParams("abc"));

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("מזהה ביקורת לא תקין");
  });

  it("returns 400 for invalid payload", async () => {
    const req = createMockRequest({});
    const res = await PATCH(req, createMockParams("1"));

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it("returns 400 for profanity", async () => {
    (checkFieldsForProfanity as jest.Mock).mockReturnValue("text");

    const req = createMockRequest(validPayload);
    const res = await PATCH(req, createMockParams("1"));

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("התגובה מכילה שפה לא הולמת. אנא נסח.י מחדש.");
  });

  it("returns 404 when review not found", async () => {
    (updateReviewByOwner as jest.Mock).mockResolvedValue(null);

    const req = createMockRequest(validPayload);
    const res = await PATCH(req, createMockParams("1"));

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe("הביקורת לא נמצאה");
  });

  it("updates review successfully", async () => {
    const req = createMockRequest(validPayload);
    const res = await PATCH(req, createMockParams("1"));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.review).toEqual({ id: 1, title: "Updated" });
    expect(updateReviewByOwner).toHaveBeenCalledWith(1, "user-123", {
      title: "Updated Title",
      text: "Updated review text here",
      rating: 4,
    });
  });

  it("returns 500 for unexpected errors", async () => {
    (updateReviewByOwner as jest.Mock).mockRejectedValue(new Error("DB error"));

    const req = createMockRequest(validPayload);
    const res = await PATCH(req, createMockParams("1"));

    expect(res.status).toBe(500);
  });
});

describe("DELETE /api/reviews/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    const errorResponse = {
      json: async () => ({ error: "יש להתחבר כדי למחוק ביקורת" }),
      status: 401,
    };
    (requireApiAuth as jest.Mock).mockResolvedValue({
      session: undefined,
      error: errorResponse,
    });

    const req = createMockRequest({});
    const res = await DELETE(req, createMockParams("1"));

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("יש להתחבר כדי למחוק ביקורת");
  });

  it("returns 400 for invalid review id", async () => {
    const req = createMockRequest({});
    const res = await DELETE(req, createMockParams("abc"));

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("מזהה ביקורת לא תקין");
  });

  it("returns 404 when review not found", async () => {
    (deleteReviewByOwner as jest.Mock).mockResolvedValue(false);

    const req = createMockRequest({});
    const res = await DELETE(req, createMockParams("1"));

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe("הביקורת לא נמצאה");
  });

  it("deletes review successfully", async () => {
    const req = createMockRequest({});
    const res = await DELETE(req, createMockParams("1"));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(deleteReviewByOwner).toHaveBeenCalledWith(1, "user-123");
  });

  it("returns 500 for unexpected errors", async () => {
    (deleteReviewByOwner as jest.Mock).mockRejectedValue(new Error("DB error"));

    const req = createMockRequest({});
    const res = await DELETE(req, createMockParams("1"));

    expect(res.status).toBe(500);
  });
});
