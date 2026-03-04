import { render, screen } from "@testing-library/react";
import ExploreBannerHeadline from "@/components/ExploreBanner/ExploreBannerHeadline";

describe("ExploreBannerHeadline", () => {
  it('renders headline "גלו הצגות חדשות"', () => {
    render(<ExploreBannerHeadline />);
    expect(
      screen.getByRole("heading", { name: "גלו הצגות חדשות" }),
    ).toBeInTheDocument();
  });

  it("renders body text about discovering shows", () => {
    render(<ExploreBannerHeadline />);
    expect(
      screen.getByText(
        /מגוון הצגות מהתיאטרונים המובילים בארץ — בחרו את ההצגה הבאה שלכם/,
      ),
    ).toBeInTheDocument();
  });
});
