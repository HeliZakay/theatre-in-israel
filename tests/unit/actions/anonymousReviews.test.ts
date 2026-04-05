jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    review: { findFirst: jest.fn() },
    show: { findUnique: jest.fn().mockResolvedValue({ slug: "test-show" }) },
  },
}));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("@/lib/email", () => ({
  notifyNewReview: jest.fn().mockResolvedValue(undefined),
  notifyUserSignup: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/utils/actionAuth");
jest.mock("@/lib/reviews");
jest.mock("@/utils/profanityFilter");
jest.mock("@/utils/reviewRateLimit");
jest.mock("@/utils/rateLimitCheckers");
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));
jest.mock("next/headers", () => ({
  headers: jest.fn().mockResolvedValue({
    get: jest.fn().mockReturnValue("1.2.3.4"),
  }),
  cookies: jest.fn().mockResolvedValue({
    get: jest.fn().mockReturnValue(undefined),
    set: jest.fn(),
  }),
}));

import { createAnonymousReview } from "@/app/reviews/actions";
import { addReview } from "@/lib/reviews";
import { checkFieldsForProfanity } from "@/utils/profanityFilter";
import { checkAnonymousReviewRateLimit } from "@/utils/rateLimitCheckers";
import prisma from "@/lib/prisma";

function createFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    fd.set(key, value);
  }
  return fd;
}

const validFormData = {
  showId: "1",
  title: "Great Show",
  rating: "5",
  text: "This is a valid review text",
  name: "",
  honeypot: "",
};

describe("createAnonymousReview", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (checkAnonymousReviewRateLimit as jest.Mock).mockResolvedValue({
      isLimited: false,
    });
    (checkFieldsForProfanity as jest.Mock).mockReturnValue(null);
    (prisma.review.findFirst as jest.Mock).mockResolvedValue(null);
    (addReview as jest.Mock).mockResolvedValue({ id: 1 });
  });

  it("silently rejects bots when honeypot is filled", async () => {
    const result = await createAnonymousReview(
      createFormData({ ...validFormData, honeypot: "bot-value" }),
    );

    expect(result.success).toBe(true);
    expect(addReview).not.toHaveBeenCalled();
  });

  it("returns error when rate limit is exceeded", async () => {
    (checkAnonymousReviewRateLimit as jest.Mock).mockResolvedValue({
      isLimited: true,
      remainingTime: 60,
    });

    const result = await createAnonymousReview(createFormData(validFormData));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("יותר מדי ביקורות");
    }
    expect(addReview).not.toHaveBeenCalled();
  });

  it("returns error for invalid form data", async () => {
    const result = await createAnonymousReview(
      createFormData({ title: "No showId" }),
    );

    expect(result.success).toBe(false);
    expect(addReview).not.toHaveBeenCalled();
  });

  it("returns error for profanity in title", async () => {
    (checkFieldsForProfanity as jest.Mock).mockReturnValue("title");

    const result = await createAnonymousReview(createFormData(validFormData));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("הכותרת מכילה שפה לא הולמת. אנא נסח.י מחדש.");
    }
    expect(addReview).not.toHaveBeenCalled();
  });

  it("returns error for profanity in text", async () => {
    (checkFieldsForProfanity as jest.Mock).mockReturnValue("text");

    const result = await createAnonymousReview(createFormData(validFormData));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("התגובה מכילה שפה לא הולמת. אנא נסח.י מחדש.");
    }
  });

  it("returns error for profanity in author name", async () => {
    (checkFieldsForProfanity as jest.Mock).mockReturnValue("authorName");

    const result = await createAnonymousReview(createFormData(validFormData));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("השם מכיל שפה לא הולמת. אנא בחר.י שם אחר.");
    }
  });

  it("returns error for duplicate anonymous review (IP dedup)", async () => {
    (prisma.review.findFirst as jest.Mock).mockResolvedValue({ id: 99 });

    const result = await createAnonymousReview(createFormData(validFormData));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("כבר כתבת ביקורת להצגה זו.");
    }
    expect(addReview).not.toHaveBeenCalled();
  });

  it("creates review successfully with default author name", async () => {
    const result = await createAnonymousReview(createFormData(validFormData));

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(expect.objectContaining({ showId: 1 }));
      expect(result.data).toHaveProperty("reviewCount");
    }
    expect(addReview).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        author: "אנונימי",
        title: "Great Show",
        text: "This is a valid review text",
        rating: 5,
        ip: "1.2.3.4",
      }),
    );
    // No userId should be passed
    expect(addReview).toHaveBeenCalledWith(
      1,
      expect.not.objectContaining({ userId: expect.anything() }),
    );
  });

  it("uses provided name as author", async () => {
    await createAnonymousReview(
      createFormData({ ...validFormData, name: "דני" }),
    );

    expect(addReview).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ author: "דני" }),
    );
  });

  it("returns error for non-existent show (P2003)", async () => {
    (addReview as jest.Mock).mockRejectedValue({ code: "P2003" });

    const result = await createAnonymousReview(createFormData(validFormData));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("ההצגה לא נמצאה");
    }
  });

  it("returns internal error for unexpected errors", async () => {
    (addReview as jest.Mock).mockRejectedValue(
      new Error("Something went wrong"),
    );

    const result = await createAnonymousReview(createFormData(validFormData));

    expect(result.success).toBe(false);
  });

  it("checks IP dedup with correct query", async () => {
    await createAnonymousReview(createFormData(validFormData));

    expect(prisma.review.findFirst).toHaveBeenCalledWith({
      where: { anonToken: expect.any(String), showId: 1, userId: null },
      select: { id: true },
    });
  });

  it("skips IP dedup when admin bypass cookie matches token", async () => {
    const { cookies } = require("next/headers");
    const originalToken = process.env.ADMIN_BYPASS_TOKEN;
    process.env.ADMIN_BYPASS_TOKEN = "test-secret";
    (cookies as jest.Mock).mockResolvedValue({
      get: jest.fn().mockReturnValue({ value: "test-secret" }),
    });
    (prisma.review.findFirst as jest.Mock).mockResolvedValue({ id: 99 });

    const result = await createAnonymousReview(createFormData(validFormData));

    expect(result.success).toBe(true);
    expect(prisma.review.findFirst).not.toHaveBeenCalled();

    process.env.ADMIN_BYPASS_TOKEN = originalToken;
    (cookies as jest.Mock).mockResolvedValue({
      get: jest.fn().mockReturnValue(undefined),
    });
  });
});
