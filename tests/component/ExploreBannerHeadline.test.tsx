import { render, screen } from "@testing-library/react";
import ExploreBannerHeadline from "@/components/shows/ExploreBanner/ExploreBannerHeadline";

describe("ExploreBannerHeadline", () => {
  it('renders headline "גלו הצגות"', () => {
    render(<ExploreBannerHeadline />);
    expect(
      screen.getByRole("heading", { name: "גלו הצגות" }),
    ).toBeInTheDocument();
  });

  it("does not render body text (headline only)", () => {
    const { container } = render(<ExploreBannerHeadline />);
    expect(container.querySelector("h2")).toBeInTheDocument();
    expect(container.childElementCount).toBe(1);
  });
});
