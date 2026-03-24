import { render, screen } from "@testing-library/react";
import LotteryBanner from "@/components/LotteryBanner/LotteryBanner";

jest.mock("@/constants/lottery", () => ({
  isLotteryActive: jest.fn(),
}));

import { isLotteryActive } from "@/constants/lottery";
const mockIsLotteryActive = isLotteryActive as jest.MockedFunction<
  typeof isLotteryActive
>;

describe("LotteryBanner", () => {
  it("returns null when lottery is inactive", () => {
    mockIsLotteryActive.mockReturnValue(false);
    const { container } = render(<LotteryBanner />);
    expect(container.innerHTML).toBe("");
  });

  it("renders banner with headline when lottery is active", () => {
    mockIsLotteryActive.mockReturnValue(true);
    render(<LotteryBanner />);
    expect(
      screen.getByRole("region", { name: "הגרלה" }),
    ).toBeInTheDocument();
  });

  it("renders CTA link to write a review", () => {
    mockIsLotteryActive.mockReturnValue(true);
    render(<LotteryBanner />);
    const link = screen.getByRole("link", { name: "כתב.י ביקורת" });
    expect(link).toHaveAttribute("href", "/reviews/new");
  });
});
