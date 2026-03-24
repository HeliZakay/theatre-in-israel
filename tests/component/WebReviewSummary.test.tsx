import { render, screen } from "@testing-library/react";
import WebReviewSummary from "@/components/WebReviewSummary/WebReviewSummary";

describe("WebReviewSummary", () => {
  it("returns null when summary is null", () => {
    const { container } = render(<WebReviewSummary summary={null} />);
    expect(container.innerHTML).toBe("");
  });

  it("returns null when summary is an empty string", () => {
    const { container } = render(<WebReviewSummary summary="" />);
    expect(container.innerHTML).toBe("");
  });

  it("renders section with summary text when provided", () => {
    render(<WebReviewSummary summary="ביקורת מצוינת על ההצגה" />);
    expect(
      screen.getByRole("heading", { name: "סקירת ביקורות חיצוניות" }),
    ).toBeInTheDocument();
    expect(screen.getByText("ביקורת מצוינת על ההצגה")).toBeInTheDocument();
  });
});
