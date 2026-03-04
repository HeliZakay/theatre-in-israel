import { render, screen } from "@testing-library/react";
import ReviewCard from "@/components/ReviewCard/ReviewCard";
import type { Review } from "@/types";

function makeReview(overrides: Partial<Review> = {}): Review {
  return {
    id: 1,
    showId: 10,
    userId: "user-1",
    author: "יוסי כהן",
    title: "ביקורת נהדרת",
    text: "הצגה מצוינת, ממליץ בחום!",
    rating: 5,
    date: "2025-06-15",
    createdAt: new Date("2025-06-15"),
    updatedAt: new Date("2025-06-15"),
    ...overrides,
  };
}

describe("ReviewCard", () => {
  it("renders as an article", () => {
    render(<ReviewCard review={makeReview()} />);
    expect(screen.getByRole("article")).toBeInTheDocument();
  });

  it("displays the author name", () => {
    render(<ReviewCard review={makeReview({ author: "דנה לוי" })} />);
    expect(screen.getByText("דנה לוי")).toBeInTheDocument();
  });

  it("displays the rating", () => {
    render(<ReviewCard review={makeReview({ rating: 4 })} />);
    expect(screen.getByText("★4")).toBeInTheDocument();
  });

  it("displays the review text", () => {
    render(<ReviewCard review={makeReview({ text: "הצגה מקסימה ומרגשת" })} />);
    expect(screen.getByText("הצגה מקסימה ומרגשת")).toBeInTheDocument();
  });

  it("displays formatted date", () => {
    render(<ReviewCard review={makeReview({ date: "2025-06-15" })} />);
    // Hebrew locale date format (DD.MM.YY)
    expect(screen.getByText("15.06.25")).toBeInTheDocument();
  });

  it("does not render date when date is missing", () => {
    render(<ReviewCard review={makeReview({ date: "" })} />);
    // The dot separator should not appear without a date
    expect(screen.queryByText("•")).not.toBeInTheDocument();
  });

  it("truncates long text and shows read-more toggle", () => {
    const longText = "א".repeat(350);
    render(<ReviewCard review={makeReview({ text: longText })} />);
    // The <details> element should be present for long text
    const details = screen.getByText(longText).closest("details");
    expect(details).toBeInTheDocument();
  });

  it("shows review text directly for short text (no truncation)", () => {
    const shortText = "הצגה טובה מאוד";
    render(<ReviewCard review={makeReview({ text: shortText })} />);
    expect(screen.getByText(shortText).closest("details")).toBeNull();
  });

  describe("isOwn", () => {
    it("renders 'הביקורת שלי' badge when isOwn is true", () => {
      render(<ReviewCard review={makeReview()} isOwn />);
      expect(screen.getByText("הביקורת שלי")).toBeInTheDocument();
    });

    it("does not show guest badge when isOwn is true", () => {
      render(<ReviewCard review={makeReview({ userId: null })} isOwn />);
      expect(screen.queryByText("(אורח/ת)")).not.toBeInTheDocument();
    });

    it("does not show own badge when isOwn is false", () => {
      render(<ReviewCard review={makeReview()} />);
      expect(screen.queryByText("הביקורת שלי")).not.toBeInTheDocument();
    });

    it("does not render edit or delete actions", () => {
      render(<ReviewCard review={makeReview()} isOwn />);
      expect(
        screen.queryByRole("link", { name: "עריכה" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "מחיקה" }),
      ).not.toBeInTheDocument();
    });
  });
});
