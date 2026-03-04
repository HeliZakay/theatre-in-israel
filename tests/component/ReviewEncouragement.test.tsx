import { render, screen } from "@testing-library/react";
import ReviewEncouragement from "@/components/ReviewEncouragement/ReviewEncouragement";

describe("ReviewEncouragement", () => {
  const reviewHref = "/shows/hamlet/review";

  describe('variant="empty"', () => {
    it("renders the empty-state headline", () => {
      render(<ReviewEncouragement variant="empty" reviewHref={reviewHref} />);
      expect(
        screen.getByText("היו הראשונים לכתוב ביקורת!"),
      ).toBeInTheDocument();
    });

    it("renders the encouragement body text", () => {
      render(<ReviewEncouragement variant="empty" reviewHref={reviewHref} />);
      expect(
        screen.getByText(
          /כל מילה שלכם שווה זהב — גם משפט אחד עוזר לאחרים להחליט/,
        ),
      ).toBeInTheDocument();
    });

    it("renders a CTA link to the review form", () => {
      render(<ReviewEncouragement variant="empty" reviewHref={reviewHref} />);
      const link = screen.getByRole("link", { name: "כתב.י ביקורת" });
      expect(link).toHaveAttribute("href", reviewHref);
    });

    it("renders the theatre emoji", () => {
      render(<ReviewEncouragement variant="empty" reviewHref={reviewHref} />);
      expect(screen.getByText("🎭")).toBeInTheDocument();
    });
  });

  describe('variant="after-reviews"', () => {
    it("renders the after-reviews headline", () => {
      render(
        <ReviewEncouragement variant="after-reviews" reviewHref={reviewHref} />,
      );
      expect(
        screen.getByText("ראיתם את ההצגה? ספרו גם מה חשבתם"),
      ).toBeInTheDocument();
    });

    it("renders the encouragement body text", () => {
      render(
        <ReviewEncouragement variant="after-reviews" reviewHref={reviewHref} />,
      );
      expect(
        screen.getByText(
          /הדעה שלכם חשובה לנו ולקהילה — גם מילה או שתיים מספיקות/,
        ),
      ).toBeInTheDocument();
    });

    it("renders a CTA link to the review form", () => {
      render(
        <ReviewEncouragement variant="after-reviews" reviewHref={reviewHref} />,
      );
      const link = screen.getByRole("link", { name: "כתב.י ביקורת" });
      expect(link).toHaveAttribute("href", reviewHref);
    });
  });
});
