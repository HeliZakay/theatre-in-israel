const mockSend = jest.fn();

jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));
jest.mock("@/utils/escapeHtml", () => ({
  escapeHtml: jest.fn((s: string) => s),
}));

// Must set NODE_ENV before importing the module under test
const originalEnv = process.env.NODE_ENV;

beforeEach(() => {
  jest.clearAllMocks();
  mockSend.mockResolvedValue({ id: "msg-1" });
});

afterAll(() => {
  (process.env as any).NODE_ENV = originalEnv;
});

describe("email notifications", () => {
  describe("in production", () => {
    beforeAll(() => {
      (process.env as any).NODE_ENV = "production";
      jest.resetModules();
    });

    it("notifyUserSignup sends email", async () => {
      const { notifyUserSignup } = await import("@/lib/email");
      await notifyUserSignup({ email: "test@test.com", name: "Test" });
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining("test@test.com"),
        }),
      );
    });

    it("notifyNewReview sends email", async () => {
      const { notifyNewReview } = await import("@/lib/email");
      await notifyNewReview({
        authorName: "אלי",
        showTitle: "המלט",
        rating: 4,
        title: "מעולה",
        text: "הצגה נהדרת",
        isAnonymous: false,
      });
      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining("המלט"),
        }),
      );
    });

    it("does not throw when send fails", async () => {
      mockSend.mockRejectedValue(new Error("API error"));
      const spy = jest.spyOn(console, "error").mockImplementation();
      const { notifyUserSignup } = await import("@/lib/email");
      await expect(
        notifyUserSignup({ email: "test@test.com" }),
      ).resolves.toBeUndefined();
      spy.mockRestore();
    });
  });

  describe("in non-production", () => {
    it("does not send email in development", async () => {
      jest.resetModules();
      (process.env as any).NODE_ENV = "test";

      // Re-import to pick up new NODE_ENV
      const mod = await import("@/lib/email");
      await mod.notifyUserSignup({ email: "test@test.com" });
      expect(mockSend).not.toHaveBeenCalled();
    });
  });
});
