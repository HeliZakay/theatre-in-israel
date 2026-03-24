import { render, screen } from "@testing-library/react";
import LotteryBadge from "@/components/LotteryBadge/LotteryBadge";

jest.mock("@/constants/lottery", () => ({
  isLotteryActive: jest.fn(),
}));

import { isLotteryActive } from "@/constants/lottery";
const mockIsLotteryActive = isLotteryActive as jest.MockedFunction<
  typeof isLotteryActive
>;

describe("LotteryBadge", () => {
  it("returns null when lottery is inactive", () => {
    mockIsLotteryActive.mockReturnValue(false);
    const { container } = render(<LotteryBadge />);
    expect(container.innerHTML).toBe("");
  });

  it("renders default badge text when lottery is active", () => {
    mockIsLotteryActive.mockReturnValue(true);
    render(<LotteryBadge />);
    expect(screen.getByText("🎟️ הגרלה")).toBeInTheDocument();
  });

  it("renders custom text when provided", () => {
    mockIsLotteryActive.mockReturnValue(true);
    render(<LotteryBadge text="הגרלה מיוחדת" />);
    expect(screen.getByText("הגרלה מיוחדת")).toBeInTheDocument();
  });
});
