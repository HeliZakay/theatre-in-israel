jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn(),
    show: { findMany: jest.fn().mockResolvedValue([]) },
  },
}));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("@/utils/actionAuth");
jest.mock("@/utils/profanityFilter");
jest.mock("@/utils/profileRateLimit");
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

import { updateProfile } from "@/app/me/actions";
import { requireActionAuth } from "@/utils/actionAuth";
import { checkFieldsForProfanity } from "@/utils/profanityFilter";
import prisma from "@/lib/prisma";

const mockSession = {
  user: { id: "user-123", name: "Old Name", email: "test@test.com" },
  expires: "2099-01-01",
};

describe("updateProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireActionAuth as jest.Mock).mockResolvedValue({
      session: mockSession,
    });
    (checkFieldsForProfanity as jest.Mock).mockReturnValue(null);
    (prisma.$transaction as jest.Mock).mockResolvedValue([]);
  });

  it("returns error when not authenticated", async () => {
    (requireActionAuth as jest.Mock).mockResolvedValue({
      error: { success: false, error: "יש להתחבר כדי לעדכן פרופיל" },
    });

    const result = await updateProfile({ name: "New Name" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("יש להתחבר כדי לעדכן פרופיל");
    }
  });

  it("returns error for empty name", async () => {
    const result = await updateProfile({ name: "" });

    expect(result.success).toBe(false);
  });

  it("returns error for name too long", async () => {
    const result = await updateProfile({ name: "א".repeat(51) });

    expect(result.success).toBe(false);
  });

  it("returns error for profanity in name", async () => {
    (checkFieldsForProfanity as jest.Mock).mockReturnValue("name");

    const result = await updateProfile({ name: "Bad Name" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("השם מכיל שפה לא הולמת. אנא בחר.י שם אחר.");
    }
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("updates profile and reviews successfully", async () => {
    (prisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
      const tx = {
        user: { update: jest.fn().mockResolvedValue({}) },
        review: {
          findMany: jest.fn().mockResolvedValue([{ showId: 1 }, { showId: 2 }]),
          updateMany: jest.fn().mockResolvedValue({ count: 3 }),
        },
      };
      return fn(tx);
    });

    const result = await updateProfile({ name: "New Name" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ name: "New Name" });
    }
  });

  it("calls requireActionAuth with rate limiter", async () => {
    await updateProfile({ name: "Test" });

    expect(requireActionAuth).toHaveBeenCalledWith(
      "יש להתחבר כדי לעדכן פרופיל",
      expect.objectContaining({
        check: expect.any(Function),
        message: expect.any(Function),
      }),
    );
  });

  it("returns internal error for unexpected errors", async () => {
    (prisma.$transaction as jest.Mock).mockRejectedValue(new Error("DB error"));

    const result = await updateProfile({ name: "Test" });

    expect(result.success).toBe(false);
  });
});
