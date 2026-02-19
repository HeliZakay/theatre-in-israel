import {
  createReviewSchema,
  updateReviewSchema,
  formatZodErrors,
} from "@/lib/reviewSchemas";
import { ZodError } from "zod";

describe("createReviewSchema", () => {
  it("accepts valid input", () => {
    const result = createReviewSchema.safeParse({
      showId: 1,
      title: "Great",
      rating: 5,
      text: "A valid review text here",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing showId", () => {
    const result = createReviewSchema.safeParse({
      title: "Great",
      rating: 5,
      text: "A valid review text here",
    });
    expect(result.success).toBe(false);
  });

  it("rejects title shorter than 2 chars", () => {
    const result = createReviewSchema.safeParse({
      showId: 1,
      title: "A",
      rating: 5,
      text: "A valid review text here",
    });
    expect(result.success).toBe(false);
  });

  it("rejects rating outside 1-5", () => {
    const result = createReviewSchema.safeParse({
      showId: 1,
      title: "Great",
      rating: 6,
      text: "A valid review text here",
    });
    expect(result.success).toBe(false);
  });

  it("rejects text shorter than 10 chars", () => {
    const result = createReviewSchema.safeParse({
      showId: 1,
      title: "Great",
      rating: 5,
      text: "Short",
    });
    expect(result.success).toBe(false);
  });

  it("coerces string rating to number", () => {
    const result = createReviewSchema.safeParse({
      showId: 1,
      title: "Great",
      rating: "3",
      text: "A valid review text here",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rating).toBe(3);
    }
  });

  it("coerces string showId to number", () => {
    const result = createReviewSchema.safeParse({
      showId: "7",
      title: "Great",
      rating: 5,
      text: "A valid review text here",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.showId).toBe(7);
    }
  });
});

describe("updateReviewSchema", () => {
  it("accepts valid input", () => {
    const result = updateReviewSchema.safeParse({
      title: "Good",
      rating: 4,
      text: "Valid review text here",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when fields are missing", () => {
    const result = updateReviewSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("formatZodErrors", () => {
  it("formats single error message", () => {
    const result = createReviewSchema.safeParse({
      showId: 1,
      title: "A",
      rating: 5,
      text: "A valid review text here",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const formatted = formatZodErrors(result.error);
      expect(formatted).toContain("הכניס.י כותרת");
    }
  });

  it("joins multiple error messages with '; '", () => {
    const result = createReviewSchema.safeParse({
      showId: 1,
      title: "A",
      rating: 0,
      text: "Short",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const formatted = formatZodErrors(result.error);
      expect(formatted).toContain("; ");
    }
  });

  it("returns default message when issues is not present", () => {
    const fakeError = {} as ZodError;
    const formatted = formatZodErrors(fakeError);
    expect(formatted).toBe("נתונים לא תקינים");
  });
});
