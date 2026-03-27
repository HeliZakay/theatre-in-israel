import { render, screen } from "@testing-library/react";
import BackLink from "@/components/layout/BackLink/BackLink";

describe("BackLink", () => {
  it("renders default text and href when no props given", () => {
    render(<BackLink />);
    const link = screen.getByRole("link", { name: "חזרה לדף הבית →" });
    expect(link).toHaveAttribute("href", "/");
  });

  it("renders custom href", () => {
    render(<BackLink href="/shows" />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/shows");
  });

  it("renders custom children text", () => {
    render(<BackLink>חזרה</BackLink>);
    expect(screen.getByRole("link", { name: "חזרה" })).toBeInTheDocument();
  });
});
