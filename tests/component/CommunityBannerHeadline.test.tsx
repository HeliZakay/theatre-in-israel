import { render, screen } from "@testing-library/react";
import { useSession } from "next-auth/react";
import CommunityBannerHeadline from "@/components/CommunityBanner/CommunityBannerHeadline";

const mockUseSession = useSession as jest.Mock;

describe("CommunityBannerHeadline", () => {
  describe("unauthenticated user", () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
      });
    });

    it('renders headline "בואו להיות חלק מהקהילה"', () => {
      render(<CommunityBannerHeadline />);
      expect(
        screen.getByRole("heading", { name: "בואו להיות חלק מהקהילה" }),
      ).toBeInTheDocument();
    });

    it("renders body text about writing a short review", () => {
      render(<CommunityBannerHeadline />);
      expect(
        screen.getByText(
          /כתבו ביקורת קצרה על הצגה שראיתם — כל מילה עוזרת לאוהבי תיאטרון לבחור את ההצגה הבאה שלהם/,
        ),
      ).toBeInTheDocument();
    });
  });

  describe("authenticated user", () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: { user: { name: "Test" } },
        status: "authenticated",
      });
    });

    it('renders headline "שמחים שאתם חלק מהקהילה"', () => {
      render(<CommunityBannerHeadline />);
      expect(
        screen.getByRole("heading", { name: "שמחים שאתם חלק מהקהילה" }),
      ).toBeInTheDocument();
    });

    it("renders body text about telling about a show", () => {
      render(<CommunityBannerHeadline />);
      expect(
        screen.getByText(
          /יש הצגה שרציתם לספר עליה\? כל מילה עוזרת לאוהבי תיאטרון לבחור את ההצגה הבאה שלהם/,
        ),
      ).toBeInTheDocument();
    });
  });
});
