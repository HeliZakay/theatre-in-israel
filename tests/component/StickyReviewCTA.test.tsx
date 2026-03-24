import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@/constants/lottery", () => ({
  isLotteryActive: jest.fn(() => false),
}));

import StickyReviewCTA from "@/components/StickyReviewCTA/StickyReviewCTA";
import { isLotteryActive } from "@/constants/lottery";

describe("StickyReviewCTA", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  it("returns null when dismissed via sessionStorage", () => {
    sessionStorage.setItem("stickyReviewCTA_dismissed", "1");
    const { container } = render(<StickyReviewCTA />);
    expect(container.innerHTML).toBe("");
  });

  it("renders CTA bar when not dismissed", () => {
    render(<StickyReviewCTA />);
    expect(screen.getByRole("complementary")).toBeInTheDocument();
  });

  it("renders default text when lottery is inactive", () => {
    render(<StickyReviewCTA />);
    expect(
      screen.getByText("ראיתם את ההצגה? ספרו מה חשבתם")
    ).toBeInTheDocument();
  });

  it("renders lottery text when lottery is active", () => {
    jest.mocked(isLotteryActive).mockReturnValue(true);
    render(<StickyReviewCTA />);
    expect(
      screen.getByText(/כתב.י ביקורת ואולי תזכ.י בכרטיסים/)
    ).toBeInTheDocument();
  });

  it("dismiss button hides bar and sets sessionStorage", async () => {
    const user = userEvent.setup();
    render(<StickyReviewCTA />);
    await user.click(screen.getByLabelText("סגירה"));
    expect(sessionStorage.getItem("stickyReviewCTA_dismissed")).toBe("1");
  });

  it("renders Link with href when href prop is provided", () => {
    render(<StickyReviewCTA href="/shows/test/review" />);
    const link = screen.getByRole("link", { name: "כתב.י ביקורת" });
    expect(link).toHaveAttribute("href", "/shows/test/review");
  });

  it("renders anchor to #write-review when no href", () => {
    render(<StickyReviewCTA />);
    const anchor = screen.getByText("כתב.י ביקורת");
    expect(anchor).toHaveAttribute("href", "#write-review");
  });
});
