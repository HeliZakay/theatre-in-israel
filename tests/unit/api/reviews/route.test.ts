// Mock all dependencies BEFORE importing the route
jest.mock("@/lib/prisma", () => ({ __esModule: true, default: {} }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("@/utils/apiMiddleware");
jest.mock("@/lib/reviews");
jest.mock("@/utils/profanityFilter");
jest.mock("@/utils/reviewRateLimit");

// Mock next/server for apiResponse dependencies
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data: any, init?: any) => ({
      json: async () => data,
      status: init?.status ?? 200,
    })),
  },
  NextRequest: jest.fn(),
}));

import { POST } from "@/app/api/reviews/route";
import { requireApiAuth } from "@/utils/apiMiddleware";
import { addReview } from "@/lib/reviews";
import { checkFieldsForProfanity } from "@/utils/profanityFilter";

const mockSession = {
  user: { id: "user-123", name: "Test User", email: "test@test.com" },
  expires: "2099-01-01",
};

function createMockRequest(formFields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(formFields)) {
    formData.append(key, value);
  }
  return {
    formData: jest.fn().mockResolvedValue(formData),
  } as any;
}

const validFormData = {
  showId: "1",
  title: "Great Show",
  rating: "5",
  text: "This is a valid review text",
};

describe("POST /api/reviews", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireApiAuth as jest.Mock).mockResolvedValue({
      session: mockSession,
      error: undefined,
    });
    (checkFieldsForProfanity as jest.Mock).mockReturnValue(null);
    (addReview as jest.Mock).mockResolvedValue({ id: 1 });
  });

  it("returns 401 when not authenticated", async () => {
    (requireApiAuth as jest.Mock).mockResolvedValue({
      session: undefined,
      error: {
        json: async () => ({ error: "יש להתחבר כדי לכתוב ביקורת" }),
        status: 401,
      },
    });

    const request = createMockRequest(validFormData);
    const response = await POST(request);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("יש להתחבר כדי לכתוב ביקורת");
    expect(addReview).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid form data", async () => {
    const request = createMockRequest({ title: "No showId" });
    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(addReview).not.toHaveBeenCalled();
  });

  it("returns 400 for profanity in title", async () => {
    (checkFieldsForProfanity as jest.Mock).mockReturnValue("title");

    const request = createMockRequest(validFormData);
    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("הכותרת מכילה שפה לא הולמת. אנא נסח.י מחדש.");
    expect(addReview).not.toHaveBeenCalled();
  });

  it("creates review successfully", async () => {
    const request = createMockRequest(validFormData);
    const response = await POST(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ success: true, showId: 1 });

    expect(addReview).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        author: "Test User",
        title: "Great Show",
        text: "This is a valid review text",
        rating: 5,
        userId: "user-123",
      }),
    );
  });

  it("uses session user name as author", async () => {
    const request = createMockRequest(validFormData);
    await POST(request);

    expect(addReview).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ author: "Test User" }),
    );
  });

  it("falls back to form name when session name is empty", async () => {
    (requireApiAuth as jest.Mock).mockResolvedValue({
      session: { ...mockSession, user: { ...mockSession.user, name: "" } },
      error: undefined,
    });

    const request = createMockRequest({ ...validFormData, name: "Form Name" });
    await POST(request);

    expect(addReview).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ author: "Form Name" }),
    );
  });

  it("returns 409 for duplicate review", async () => {
    (addReview as jest.Mock).mockRejectedValue({ code: "P2002" });

    const request = createMockRequest(validFormData);
    const response = await POST(request);

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error).toBe("כבר כתבת ביקורת להצגה זו.");
  });

  it("returns 404 for non-existent show", async () => {
    (addReview as jest.Mock).mockRejectedValue({ code: "P2003" });

    const request = createMockRequest(validFormData);
    const response = await POST(request);

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("ההצגה לא נמצאה");
  });

  it("returns 500 for unexpected errors", async () => {
    (addReview as jest.Mock).mockRejectedValue(
      new Error("Something went wrong"),
    );

    const request = createMockRequest(validFormData);
    const response = await POST(request);

    expect(response.status).toBe(500);
  });
});
