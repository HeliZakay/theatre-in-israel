import { render, screen } from "@testing-library/react";
import LatestReviewsSection from "@/components/reviews/LatestReviewsSection/LatestReviewsSection";
import type { LatestReviewItem } from "@/types";

// Mock ShowCarousel to just render children
jest.mock("@/components/shows/ShowCarousel/ShowCarousel", () => {
  const MockCarousel = ({
    children,
    label,
  }: {
    children: React.ReactNode;
    label: string;
  }) => <div aria-label={label}>{children}</div>;
  MockCarousel.displayName = "MockShowCarousel";
  return { __esModule: true, default: MockCarousel };
});

// Mock LatestReviewCard
jest.mock("@/components/reviews/LatestReviewCard/LatestReviewCard", () => {
  const MockCard = ({ review }: { review: LatestReviewItem }) => (
    <div data-testid="review-card">{review.showTitle}</div>
  );
  MockCard.displayName = "MockLatestReviewCard";
  return { __esModule: true, default: MockCard };
});

function makeReview(id: number): LatestReviewItem {
  return {
    id,
    author: `author-${id}`,
    title: `title-${id}`,
    text: "טקסט ביקורת",
    rating: 4,
    createdAt: new Date(),
    showId: id,
    showSlug: `show-${id}`,
    showTitle: `הצגה ${id}`,
    showTheatre: "תיאטרון",
  };
}

describe("LatestReviewsSection", () => {
  it("returns null when reviews count is below MIN_REVIEWS", () => {
    const { container } = render(
      <LatestReviewsSection reviews={[makeReview(1), makeReview(2)]} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("returns null when reviews array is empty", () => {
    const { container } = render(<LatestReviewsSection reviews={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders section when reviews >= 3", () => {
    const reviews = [makeReview(1), makeReview(2), makeReview(3)];
    render(<LatestReviewsSection reviews={reviews} />);
    expect(
      screen.getByRole("region", { name: "ביקורות אחרונות" }),
    ).toBeInTheDocument();
  });

  it("renders a card for each review", () => {
    const reviews = [makeReview(1), makeReview(2), makeReview(3)];
    render(<LatestReviewsSection reviews={reviews} />);
    expect(screen.getAllByTestId("review-card")).toHaveLength(3);
  });
});
