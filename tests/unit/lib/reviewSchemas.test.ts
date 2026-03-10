import {
  createReviewSchema,
  updateReviewSchema,
  clientAnonymousReviewSchema,
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

  it("accepts empty title (optional)", () => {
    const result = createReviewSchema.safeParse({
      showId: 1,
      title: "",
      rating: 5,
      text: "A valid review text here",
    });
    expect(result.success).toBe(true);
  });

  it("accepts missing title (optional)", () => {
    const result = createReviewSchema.safeParse({
      showId: 1,
      rating: 5,
      text: "A valid review text here",
    });
    expect(result.success).toBe(true);
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

  it("rejects text shorter than 2 chars", () => {
    const result = createReviewSchema.safeParse({
      showId: 1,
      title: "Great",
      rating: 5,
      text: "A",
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

  it("accepts empty title (optional)", () => {
    const result = updateReviewSchema.safeParse({
      title: "",
      rating: 4,
      text: "Valid review text here",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when rating and text are missing", () => {
    const result = updateReviewSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("formatZodErrors", () => {
  it("formats single error message", () => {
    const result = createReviewSchema.safeParse({
      showId: 1,
      title: "Great",
      rating: 5,
      text: "A",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const formatted = formatZodErrors(result.error);
      expect(formatted).toContain("תווים");
    }
  });

  it("joins multiple error messages with '; '", () => {
    const result = createReviewSchema.safeParse({
      showId: 1,
      title: "Good",
      rating: 0,
      text: "A",
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

describe("clientAnonymousReviewSchema", () => {
  it("accepts valid anonymous input with name", () => {
    const result = clientAnonymousReviewSchema.safeParse({
      showId: "1",
      name: "דני",
      title: "Great",
      rating: 5,
      text: "A valid review text here",
      honeypot: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid input without name", () => {
    const result = clientAnonymousReviewSchema.safeParse({
      showId: "1",
      title: "Great",
      rating: 5,
      text: "A valid review text here",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty honeypot", () => {
    const result = clientAnonymousReviewSchema.safeParse({
      showId: "1",
      title: "Great",
      rating: 5,
      text: "A valid review text here",
      honeypot: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts filled honeypot (validation passes, checked in action)", () => {
    const result = clientAnonymousReviewSchema.safeParse({
      showId: "1",
      title: "Great",
      rating: 5,
      text: "A valid review text here",
      honeypot: "bot-value",
    });
    expect(result.success).toBe(true);
  });

  it("rejects name longer than 80 chars", () => {
    const result = clientAnonymousReviewSchema.safeParse({
      showId: "1",
      name: "א".repeat(81),
      title: "Great",
      rating: 5,
      text: "A valid review text here",
    });
    expect(result.success).toBe(false);
  });

  it("requires showId", () => {
    const result = clientAnonymousReviewSchema.safeParse({
      title: "Great",
      rating: 5,
      text: "A valid review text here",
    });
    expect(result.success).toBe(false);
  });
});
