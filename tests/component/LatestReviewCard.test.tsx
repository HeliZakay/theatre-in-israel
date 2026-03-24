import { render, screen } from "@testing-library/react";
import LatestReviewCard from "@/components/LatestReviewCard/LatestReviewCard";
import type { LatestReviewItem } from "@/types";

jest.mock("@/utils/formatDate", () => ({
  formatRelativeDate: (d: Date) => `mock-${d.toISOString().slice(0, 10)}`,
}));

const baseReview: LatestReviewItem = {
  id: 1,
  author: "ישראל",
  title: "כותרת ביקורת",
  text: "טקסט קצר של ביקורת.",
  rating: 4,
  createdAt: new Date("2026-03-20"),
  showId: 10,
  showSlug: "hamlet",
  showTitle: "המלט",
  showTheatre: "תיאטרון הבימה",
};

function renderCard(overrides: Partial<LatestReviewItem> = {}) {
  return render(<LatestReviewCard review={{ ...baseReview, ...overrides }} />);
}

describe("LatestReviewCard", () => {
  it("renders show title and theatre", () => {
    renderCard();
    expect(screen.getByText("המלט")).toBeInTheDocument();
    expect(screen.getByText("תיאטרון הבימה")).toBeInTheDocument();
  });

  it("does not truncate text <= 120 chars", () => {
    renderCard({ text: "A".repeat(120) });
    expect(screen.getByText("A".repeat(120))).toBeInTheDocument();
    expect(screen.queryByText(/\.\.\./)).not.toBeInTheDocument();
  });

  it("truncates text > 120 chars with ellipsis", () => {
    const longText = "א".repeat(150);
    renderCard({ text: longText });
    expect(screen.getByText(/\.\.\.$/)).toBeInTheDocument();
  });

  it("shows review title when present", () => {
    renderCard({ title: "ביקורת מעולה" });
    expect(screen.getByText("ביקורת מעולה")).toBeInTheDocument();
  });

  it("does not render title element when title is null", () => {
    renderCard({ title: null });
    expect(screen.queryByText("כותרת ביקורת")).not.toBeInTheDocument();
  });

  it("includes rating in aria-label", () => {
    renderCard({ rating: 5 });
    expect(screen.getByLabelText("דירוג 5 מתוך 5")).toBeInTheDocument();
  });

  it("renders relative date via formatRelativeDate", () => {
    renderCard();
    expect(screen.getByText("mock-2026-03-20")).toBeInTheDocument();
  });

  it("links to the show page", () => {
    renderCard();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/shows/hamlet");
  });

  it("renders author name", () => {
    renderCard({ author: "שרה כהן" });
    expect(screen.getByText("שרה כהן")).toBeInTheDocument();
  });
});
