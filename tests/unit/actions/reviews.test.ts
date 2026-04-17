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
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

import {
  createReview,
  updateReview,
  deleteReview,
} from "@/app/reviews/actions";
import { requireActionAuth } from "@/utils/actionAuth";
import {
  addReview,
  updateReviewByOwner,
  deleteReviewByOwner,
} from "@/lib/reviews";
import { checkFieldsForProfanity } from "@/utils/profanityFilter";
import prisma from "@/lib/prisma";

const mockSession = {
  user: { id: "user-123", name: "Test User", email: "test@test.com" },
  expires: "2099-01-01",
};

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
};

describe("createReview", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireActionAuth as jest.Mock).mockResolvedValue({
      session: mockSession,
    });
    (checkFieldsForProfanity as jest.Mock).mockReturnValue(null);
    (addReview as jest.Mock).mockResolvedValue({ id: 1 });
  });

  it("returns error when not authenticated", async () => {
    (requireActionAuth as jest.Mock).mockResolvedValue({
      error: { success: false, error: "יש להתחבר כדי לכתוב ביקורת" },
    });

    const result = await createReview(createFormData(validFormData));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("יש להתחבר כדי לכתוב ביקורת");
    }
    expect(addReview).not.toHaveBeenCalled();
  });

  it("returns error for invalid form data", async () => {
    const result = await createReview(createFormData({ title: "No showId" }));

    expect(result.success).toBe(false);
    expect(addReview).not.toHaveBeenCalled();
  });

  it("returns error for profanity in title", async () => {
    (checkFieldsForProfanity as jest.Mock).mockReturnValue("title");

    const result = await createReview(createFormData(validFormData));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("הכותרת מכילה שפה לא הולמת. אנא נסח.י מחדש.");
    }
    expect(addReview).not.toHaveBeenCalled();
  });

  it("creates review successfully", async () => {
    const result = await createReview(
      createFormData({ ...validFormData, name: "Test User" }),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(expect.objectContaining({ showId: 1 }));
      expect(result.data).toHaveProperty("reviewCount");
    }
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

  it("uses form name as author", async () => {
    await createReview(
      createFormData({ ...validFormData, name: "Test User" }),
    );

    expect(addReview).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ author: "Test User" }),
    );
  });

  it("falls back to form name when session name is empty", async () => {
    (requireActionAuth as jest.Mock).mockResolvedValue({
      session: { ...mockSession, user: { ...mockSession.user, name: "" } },
    });

    await createReview(createFormData({ ...validFormData, name: "Form Name" }));

    expect(addReview).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ author: "Form Name" }),
    );
  });

  it("returns error for duplicate review", async () => {
    (addReview as jest.Mock).mockRejectedValue({ code: "P2002" });

    const result = await createReview(createFormData(validFormData));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("כבר כתבת ביקורת להצגה זו.");
    }
  });

  it("returns error for non-existent show", async () => {
    (addReview as jest.Mock).mockRejectedValue({ code: "P2003" });

    const result = await createReview(createFormData(validFormData));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("ההצגה לא נמצאה");
    }
  });

  it("returns internal error for unexpected errors", async () => {
    (addReview as jest.Mock).mockRejectedValue(
      new Error("Something went wrong"),
    );

    const result = await createReview(createFormData(validFormData));

    expect(result.success).toBe(false);
  });
});

describe("updateReview", () => {
  const validPayload = {
    title: "Updated Title",
    rating: 4,
    text: "Updated review text here",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (requireActionAuth as jest.Mock).mockResolvedValue({
      session: mockSession,
    });
    (checkFieldsForProfanity as jest.Mock).mockReturnValue(null);
    (updateReviewByOwner as jest.Mock).mockResolvedValue({
      id: 1,
      showId: 1,
      title: "Updated",
    });
  });

  it("returns error when not authenticated", async () => {
    (requireActionAuth as jest.Mock).mockResolvedValue({
      error: { success: false, error: "יש להתחבר כדי לערוך ביקורת" },
    });

    const result = await updateReview(1, validPayload);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("יש להתחבר כדי לערוך ביקורת");
    }
  });

  it("returns error for invalid payload", async () => {
    const result = await updateReview(1, {} as any);

    expect(result.success).toBe(false);
  });

  it("returns error for profanity", async () => {
    (checkFieldsForProfanity as jest.Mock).mockReturnValue("text");

    const result = await updateReview(1, validPayload);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("התגובה מכילה שפה לא הולמת. אנא נסח.י מחדש.");
    }
  });

  it("returns error when review not found", async () => {
    (updateReviewByOwner as jest.Mock).mockResolvedValue(null);

    const result = await updateReview(1, validPayload);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("הביקורת לא נמצאה");
    }
  });

  it("updates review successfully", async () => {
    const result = await updateReview(1, validPayload);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ showId: 1 });
    }
    expect(updateReviewByOwner).toHaveBeenCalledWith(1, "user-123", {
      title: "Updated Title",
      text: "Updated review text here",
      rating: 4,
    });
  });

  it("returns internal error for unexpected errors", async () => {
    (updateReviewByOwner as jest.Mock).mockRejectedValue(new Error("DB error"));

    const result = await updateReview(1, validPayload);

    expect(result.success).toBe(false);
  });
});

describe("deleteReview", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireActionAuth as jest.Mock).mockResolvedValue({
      session: mockSession,
    });
    (prisma.review.findFirst as jest.Mock).mockResolvedValue({ showId: 1 });
    (deleteReviewByOwner as jest.Mock).mockResolvedValue(true);
  });

  it("returns error when not authenticated", async () => {
    (requireActionAuth as jest.Mock).mockResolvedValue({
      error: { success: false, error: "יש להתחבר כדי למחוק ביקורת" },
    });

    const result = await deleteReview(1);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("יש להתחבר כדי למחוק ביקורת");
    }
  });

  it("returns error when review not found", async () => {
    (deleteReviewByOwner as jest.Mock).mockResolvedValue(false);

    const result = await deleteReview(1);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("הביקורת לא נמצאה");
    }
  });

  it("deletes review successfully", async () => {
    const result = await deleteReview(1);

    expect(result.success).toBe(true);
    expect(deleteReviewByOwner).toHaveBeenCalledWith(1, "user-123");
  });

  it("returns internal error for unexpected errors", async () => {
    (deleteReviewByOwner as jest.Mock).mockRejectedValue(new Error("DB error"));

    const result = await deleteReview(1);

    expect(result.success).toBe(false);
  });
});
