import { render, screen } from "@testing-library/react";
import ExploreBannerHeadline from "@/components/ExploreBanner/ExploreBannerHeadline";

describe("ExploreBannerHeadline", () => {
  it('renders headline "גלו הצגות"', () => {
    render(<ExploreBannerHeadline />);
    expect(
      screen.getByRole("heading", { name: "גלו הצגות" }),
    ).toBeInTheDocument();
  });

  it("renders body text about discovering shows", () => {
    render(<ExploreBannerHeadline />);
    expect(
      screen.getByText(
        /מגוון הצגות מכל התיאטרונים בארץ — בחרו את ההצגה הבאה שלכם/,
      ),
    ).toBeInTheDocument();
  });
});
