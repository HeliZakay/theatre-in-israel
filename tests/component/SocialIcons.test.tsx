import { render } from "@testing-library/react";
import { GoogleIcon } from "@/components/SocialIcons/SocialIcons";

describe("GoogleIcon", () => {
  it("renders an SVG with aria-hidden='true'", () => {
    const { container } = render(<GoogleIcon />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("applies custom className", () => {
    const { container } = render(<GoogleIcon className="custom" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveClass("custom");
  });
});
