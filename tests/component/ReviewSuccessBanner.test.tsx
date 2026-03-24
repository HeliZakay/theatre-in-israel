jest.mock("@/components/ShareButtons/ShareButtons", () => {
  const MockShareButtons = () => <div data-testid="share-buttons" />;
  MockShareButtons.displayName = "MockShareButtons";
  return { __esModule: true, default: MockShareButtons };
});

import { render, screen } from "@testing-library/react";
import ReviewSuccessBanner from "@/components/ReviewSuccessBanner/ReviewSuccessBanner";

const defaultProps = {
  showSlug: "hamlet",
  showTitle: "המלט",
  reviewCount: 3,
  review: { rating: 4, title: "ביקורת נהדרת", text: "הצגה מדהימה" },
};

describe("ReviewSuccessBanner", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the success title text", () => {
    render(<ReviewSuccessBanner {...defaultProps} />);
    expect(screen.getByText(/הביקורת שלך פורסמה/)).toBeInTheDocument();
  });

  it("shows first-review subtitle when count is 1", () => {
    render(<ReviewSuccessBanner {...defaultProps} reviewCount={1} />);
    expect(screen.getByText(/הביקורת הראשונה/)).toBeInTheDocument();
  });

  it("shows numbered subtitle when count is greater than 1", () => {
    render(<ReviewSuccessBanner {...defaultProps} reviewCount={5} />);
    expect(screen.getByText(/הביקורת ה-5/)).toBeInTheDocument();
  });

  it("does not render subtitle when reviewCount is null", () => {
    render(<ReviewSuccessBanner {...defaultProps} reviewCount={null} />);
    expect(screen.queryByText(/הביקורת ה/)).not.toBeInTheDocument();
    expect(screen.queryByText(/הביקורת הראשונה/)).not.toBeInTheDocument();
  });

  it("fills the correct number of stars matching rating", () => {
    const { container } = render(
      <ReviewSuccessBanner
        {...defaultProps}
        review={{ rating: 3, title: null, text: "טוב" }}
      />,
    );
    const stars = container.querySelectorAll("svg");
    expect(stars).toHaveLength(5);
    // Stars 1-3 should be filled, 4-5 empty
    const filledStars = container.querySelectorAll(
      "svg[class*='starFilled']",
    );
    const emptyStars = container.querySelectorAll("svg[class*='starEmpty']");
    // We check via aria-label on the parent
    const starsContainer = screen.getByLabelText("דירוג 3 מתוך 5");
    expect(starsContainer).toBeInTheDocument();
  });

  it("renders review title when provided", () => {
    render(<ReviewSuccessBanner {...defaultProps} />);
    expect(screen.getByText(/ביקורת נהדרת/)).toBeInTheDocument();
  });

  it("does not render review title when title is null", () => {
    render(
      <ReviewSuccessBanner
        {...defaultProps}
        review={{ rating: 4, title: null, text: "הצגה מדהימה" }}
      />,
    );
    // The success title should still be there, but no review title with quotation marks
    expect(screen.queryByText(/״/)).not.toBeInTheDocument();
  });

  it("calls history.replaceState to clean URL by default", () => {
    const replaceStateSpy = jest.spyOn(window.history, "replaceState");
    render(<ReviewSuccessBanner {...defaultProps} />);
    expect(replaceStateSpy).toHaveBeenCalledWith(null, "", "/shows/hamlet");
  });

  it("does not call history.replaceState when cleanUrl is false", () => {
    const replaceStateSpy = jest.spyOn(window.history, "replaceState");
    render(<ReviewSuccessBanner {...defaultProps} cleanUrl={false} />);
    expect(replaceStateSpy).not.toHaveBeenCalled();
  });
});
