import { render, screen } from "@testing-library/react";

jest.mock("@/lib/fonts", () => ({
  titleFont: { variable: "mock-title-font" },
}));

import Logo from "@/components/Logo/Logo";

describe("Logo", () => {
  it("renders link to home page", () => {
    render(<Logo />);
    expect(screen.getByRole("link", { name: "דף הבית" })).toHaveAttribute(
      "href",
      "/"
    );
  });

  it("renders image element", () => {
    const { container } = render(<Logo />);
    const img = container.querySelector("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/logo-img.png");
  });

  it("renders site title text", () => {
    render(<Logo />);
    expect(screen.getByText("תיאטרון בישראל")).toBeInTheDocument();
  });

  it("renders subtitle text", () => {
    render(<Logo />);
    expect(screen.getByText("פורטל ביקורות להצגות")).toBeInTheDocument();
  });
});
