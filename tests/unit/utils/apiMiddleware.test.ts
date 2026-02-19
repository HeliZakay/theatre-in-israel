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
}));

import { requireApiAuth } from "@/utils/apiMiddleware";
import { getServerSession } from "next-auth";

const mockGetServerSession = getServerSession as jest.Mock;

const mockSession = {
  user: { id: "user-123", name: "Test User", email: "test@test.com" },
  expires: "2099-01-01",
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("requireApiAuth", () => {
  describe("authentication", () => {
    it("returns error when session is null", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const result = await requireApiAuth("Not authenticated");

      expect(result.session).toBeUndefined();
      expect(result.error).toBeDefined();
      const errBody = await (result as any).error.json();
      expect(errBody.error).toBe("Not authenticated");
      expect((result as any).error.status).toBe(401);
    });

    it("returns error when session has no user", async () => {
      mockGetServerSession.mockResolvedValue({ expires: "2099-01-01" });

      const result = await requireApiAuth("Not authenticated");

      expect(result.session).toBeUndefined();
      expect(result.error).toBeDefined();
      const errBody = await (result as any).error.json();
      expect(errBody.error).toBe("Not authenticated");
      expect((result as any).error.status).toBe(401);
    });

    it("returns error when user has no id", async () => {
      mockGetServerSession.mockResolvedValue({
        user: { name: "test" },
        expires: "2099-01-01",
      });

      const result = await requireApiAuth("Not authenticated");

      expect(result.session).toBeUndefined();
      expect(result.error).toBeDefined();
      const errBody = await (result as any).error.json();
      expect(errBody.error).toBe("Not authenticated");
      expect((result as any).error.status).toBe(401);
    });

    it("returns session when authenticated", async () => {
      mockGetServerSession.mockResolvedValue(mockSession);

      const result = await requireApiAuth("Not authenticated");

      expect(result.error).toBeUndefined();
      expect(result.session).toEqual(mockSession);
    });

    it("uses custom unauthMessage in error", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const result = await requireApiAuth("Please sign in to continue");

      expect(result.error).toBeDefined();
      const errBody = await (result as any).error.json();
      expect(errBody.error).toBe("Please sign in to continue");
    });
  });

  describe("rate limiting", () => {
    const mockRateLimitCheck = jest.fn();
    const mockRateLimitMessage = jest.fn(
      (t: number) => `Rate limited: ${t} minutes`,
    );
    const rateLimit = {
      check: mockRateLimitCheck,
      message: mockRateLimitMessage,
    };

    beforeEach(() => {
      mockGetServerSession.mockResolvedValue(mockSession);
    });

    it("skips rate limit when not provided", async () => {
      const result = await requireApiAuth("Not authenticated");

      expect(result.error).toBeUndefined();
      expect(result.session).toEqual(mockSession);
      expect(mockRateLimitCheck).not.toHaveBeenCalled();
    });

    it("allows when not rate limited", async () => {
      mockRateLimitCheck.mockResolvedValue({ isLimited: false });

      const result = await requireApiAuth("Not authenticated", rateLimit);

      expect(result.error).toBeUndefined();
      expect(result.session).toEqual(mockSession);
      expect(mockRateLimitCheck).toHaveBeenCalledWith("user-123");
    });

    it("returns error when rate limited", async () => {
      mockRateLimitCheck.mockResolvedValue({
        isLimited: true,
        remainingTime: 30,
      });

      const result = await requireApiAuth("Not authenticated", rateLimit);

      expect(result.session).toBeUndefined();
      expect(result.error).toBeDefined();
      const errBody = await (result as any).error.json();
      expect(errBody.error).toBe("Rate limited: 30 minutes");
      expect((result as any).error.status).toBe(429);
    });

    it("uses rate limit message function", async () => {
      mockRateLimitCheck.mockResolvedValue({
        isLimited: true,
        remainingTime: 45,
      });

      await requireApiAuth("Not authenticated", rateLimit);

      expect(mockRateLimitMessage).toHaveBeenCalledWith(45);
    });

    it("handles async rate limit check", async () => {
      mockRateLimitCheck.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ isLimited: false }), 10),
          ),
      );

      const result = await requireApiAuth("Not authenticated", rateLimit);

      expect(result.error).toBeUndefined();
      expect(result.session).toEqual(mockSession);
      expect(mockRateLimitCheck).toHaveBeenCalledWith("user-123");
    });
  });
});
