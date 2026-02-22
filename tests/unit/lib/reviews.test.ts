jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {
    review: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    show: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));
jest.mock("@/lib/showStats");
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

import prisma from "@/lib/prisma";
import { refreshShowStats } from "@/lib/showStats";
import { revalidatePath, revalidateTag } from "next/cache";
import {
  getShowOptions,
  addReview,
  getReviewsByUser,
  getReviewByOwner,
  updateReviewByOwner,
  deleteReviewByOwner,
  revalidateAfterReviewChange,
} from "@/lib/reviews";

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockRefreshShowStats = refreshShowStats as jest.MockedFunction<
  typeof refreshShowStats
>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<
  typeof revalidatePath
>;
const mockRevalidateTag = revalidateTag as jest.MockedFunction<
  typeof revalidateTag
>;

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// getShowOptions
// ---------------------------------------------------------------------------
describe("getShowOptions", () => {
  it("queries shows and returns mapped { id, slug, title } array", async () => {
    const shows = [
      { id: 1, slug: "hamlet", title: "Hamlet" },
      { id: 2, slug: "cats", title: "Cats" },
    ];
    (mockPrisma.show.findMany as jest.Mock).mockResolvedValue(shows);

    const result = await getShowOptions();

    expect(mockPrisma.show.findMany).toHaveBeenCalledWith({
      select: { id: true, slug: true, title: true },
      orderBy: { title: "asc" },
    });
    expect(result).toEqual(shows);
  });

  it("returns empty array when no shows exist", async () => {
    (mockPrisma.show.findMany as jest.Mock).mockResolvedValue([]);

    const result = await getShowOptions();

    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// addReview
// ---------------------------------------------------------------------------
describe("addReview", () => {
  const reviewInput = {
    author: "Test User",
    title: "Great Show",
    text: "Loved it",
    rating: 5,
    date: "2026-01-15",
    userId: "user-123",
  };

  it("creates review, refreshes stats, and returns serialized review", async () => {
    const createdReview = {
      id: 1,
      showId: 10,
      userId: "user-123",
      author: "Test User",
      title: "Great Show",
      text: "Loved it",
      rating: 5,
      date: new Date("2026-01-15"),
      createdAt: new Date("2026-01-15"),
      updatedAt: new Date("2026-01-15"),
    };
    (mockPrisma.review.create as jest.Mock).mockResolvedValue(createdReview);

    const result = await addReview(10, reviewInput);

    expect(mockPrisma.review.create).toHaveBeenCalledWith({
      data: {
        showId: 10,
        userId: "user-123",
        author: "Test User",
        title: "Great Show",
        text: "Loved it",
        rating: 5,
        date: expect.any(Date),
      },
    });
    expect(mockRefreshShowStats).toHaveBeenCalledWith(10);
    expect(result).toEqual({
      ...createdReview,
      date: createdReview.date.toISOString(),
    });
  });

  it("sets title to null when title is undefined", async () => {
    const inputNoTitle = { ...reviewInput, title: undefined };
    const createdReview = {
      id: 2,
      showId: 10,
      userId: "user-123",
      author: "Test User",
      title: null,
      text: "Loved it",
      rating: 5,
      date: new Date("2026-01-15"),
      createdAt: new Date("2026-01-15"),
      updatedAt: new Date("2026-01-15"),
    };
    (mockPrisma.review.create as jest.Mock).mockResolvedValue(createdReview);

    await addReview(10, inputNoTitle);

    expect(mockPrisma.review.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ title: null }),
    });
  });

  it("propagates Prisma errors", async () => {
    (mockPrisma.review.create as jest.Mock).mockRejectedValue(
      new Error("FK violation"),
    );

    await expect(addReview(999, reviewInput)).rejects.toThrow("FK violation");
    expect(mockRefreshShowStats).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// getReviewsByUser
// ---------------------------------------------------------------------------
describe("getReviewsByUser", () => {
  it("queries reviews with show include and returns them", async () => {
    const reviews = [
      {
        id: 1,
        showId: 10,
        userId: "user-123",
        author: "Test",
        title: null,
        text: "Nice",
        rating: 4,
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        show: { id: 10, slug: "hamlet", title: "Hamlet" },
      },
    ];
    (mockPrisma.review.findMany as jest.Mock).mockResolvedValue(reviews);

    const result = await getReviewsByUser("user-123");

    expect(mockPrisma.review.findMany).toHaveBeenCalledWith({
      where: { userId: "user-123" },
      include: {
        show: { select: { id: true, slug: true, title: true } },
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    });
    expect(result).toEqual(reviews);
  });

  it("returns empty array when user has no reviews", async () => {
    (mockPrisma.review.findMany as jest.Mock).mockResolvedValue([]);

    const result = await getReviewsByUser("no-reviews-user");

    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getReviewByOwner
// ---------------------------------------------------------------------------
describe("getReviewByOwner", () => {
  it("returns review when found with matching userId", async () => {
    const review = {
      id: 5,
      showId: 10,
      userId: "user-123",
      author: "Test",
      title: "Good",
      text: "Nice",
      rating: 4,
      date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      show: { id: 10, slug: "hamlet", title: "Hamlet" },
    };
    (mockPrisma.review.findFirst as jest.Mock).mockResolvedValue(review);

    const result = await getReviewByOwner(5, "user-123");

    expect(mockPrisma.review.findFirst).toHaveBeenCalledWith({
      where: { id: 5, userId: "user-123" },
      include: {
        show: { select: { id: true, slug: true, title: true } },
      },
    });
    expect(result).toEqual(review);
  });

  it("returns null when review does not exist or userId does not match", async () => {
    (mockPrisma.review.findFirst as jest.Mock).mockResolvedValue(null);

    const result = await getReviewByOwner(999, "wrong-user");

    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// updateReviewByOwner
// ---------------------------------------------------------------------------
describe("updateReviewByOwner", () => {
  const updateInput = { title: "Updated", text: "New text", rating: 3 };

  it("checks ownership, updates review, refreshes stats, and returns updated review", async () => {
    const updatedReview = {
      id: 5,
      showId: 10,
      userId: "user-123",
      author: "Test",
      title: "Updated",
      text: "New text",
      rating: 3,
      date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      show: { id: 10, slug: "hamlet", title: "Hamlet" },
    };

    // $transaction receives a callback — invoke it with a mock tx
    (mockPrisma.$transaction as jest.Mock).mockImplementation(async (cb) => {
      const tx = {
        review: {
          findFirst: jest.fn().mockResolvedValue({ id: 5 }),
          update: jest.fn().mockResolvedValue(updatedReview),
        },
      };
      return cb(tx);
    });

    const result = await updateReviewByOwner(5, "user-123", updateInput);

    expect(mockPrisma.$transaction).toHaveBeenCalledWith(expect.any(Function));
    expect(mockRefreshShowStats).toHaveBeenCalledWith(10);
    expect(result).toEqual(updatedReview);
  });

  it("returns null and skips refresh when review is not owned by user", async () => {
    (mockPrisma.$transaction as jest.Mock).mockImplementation(async (cb) => {
      const tx = {
        review: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      };
      return cb(tx);
    });

    const result = await updateReviewByOwner(5, "wrong-user", updateInput);

    expect(result).toBeNull();
    expect(mockRefreshShowStats).not.toHaveBeenCalled();
  });

  it("sets title to null when title is undefined", async () => {
    const inputNoTitle = { text: "New text", rating: 3 };
    (mockPrisma.$transaction as jest.Mock).mockImplementation(async (cb) => {
      const tx = {
        review: {
          findFirst: jest.fn().mockResolvedValue({ id: 5 }),
          update: jest.fn().mockResolvedValue({
            id: 5,
            showId: 10,
            title: null,
            text: "New text",
            rating: 3,
            show: { id: 10, slug: "hamlet", title: "Hamlet" },
          }),
        },
      };
      return cb(tx);
    });

    await updateReviewByOwner(5, "user-123", inputNoTitle);

    // Verify the tx.review.update was called with title: null
    const txCallback = (mockPrisma.$transaction as jest.Mock).mock.calls[0][0];
    const spyUpdate = jest.fn().mockResolvedValue({
      id: 5,
      showId: 10,
      title: null,
      text: "New text",
      rating: 3,
      show: { id: 10, slug: "hamlet", title: "Hamlet" },
    });
    const spyTx = {
      review: {
        findFirst: jest.fn().mockResolvedValue({ id: 5 }),
        update: spyUpdate,
      },
    };
    await txCallback(spyTx);

    expect(spyUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ title: null }),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// deleteReviewByOwner
// ---------------------------------------------------------------------------
describe("deleteReviewByOwner", () => {
  it("finds review, deletes it, refreshes stats, and returns true", async () => {
    (mockPrisma.review.findFirst as jest.Mock).mockResolvedValue({
      id: 5,
      showId: 10,
    });
    (mockPrisma.review.delete as jest.Mock).mockResolvedValue({});

    const result = await deleteReviewByOwner(5, "user-123");

    expect(mockPrisma.review.findFirst).toHaveBeenCalledWith({
      where: { id: 5, userId: "user-123" },
      select: { id: true, showId: true },
    });
    expect(mockPrisma.review.delete).toHaveBeenCalledWith({
      where: { id: 5 },
    });
    expect(mockRefreshShowStats).toHaveBeenCalledWith(10);
    expect(result).toBe(true);
  });

  it("returns false and skips delete when review is not owned by user", async () => {
    (mockPrisma.review.findFirst as jest.Mock).mockResolvedValue(null);

    const result = await deleteReviewByOwner(5, "wrong-user");

    expect(result).toBe(false);
    expect(mockPrisma.review.delete).not.toHaveBeenCalled();
    expect(mockRefreshShowStats).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// revalidateAfterReviewChange
// ---------------------------------------------------------------------------
describe("revalidateAfterReviewChange", () => {
  it("calls revalidatePath and revalidateTag with correct args", () => {
    revalidateAfterReviewChange("hamlet");

    expect(mockRevalidatePath).toHaveBeenCalledWith("/shows/hamlet");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/shows");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
    expect(mockRevalidateTag).toHaveBeenCalledWith("homepage", "max");
    expect(mockRevalidateTag).toHaveBeenCalledWith("shows-list", "max");
    expect(mockRevalidatePath).toHaveBeenCalledTimes(3);
    expect(mockRevalidateTag).toHaveBeenCalledTimes(2);
  });

  it("uses the provided slug in the show path", () => {
    revalidateAfterReviewChange("cats-the-musical");

    expect(mockRevalidatePath).toHaveBeenCalledWith("/shows/cats-the-musical");
  });
});
