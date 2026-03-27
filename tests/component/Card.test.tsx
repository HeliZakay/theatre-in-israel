import { render, screen } from "@testing-library/react";
import Card from "@/components/ui/Card/Card";

describe("Card", () => {
  it("renders children in a div by default", () => {
    render(<Card>Hello</Card>);
    const el = screen.getByText("Hello");
    expect(el.tagName).toBe("DIV");
  });

  it("renders with no extra className by default", () => {
    const { container } = render(<Card>Test</Card>);
    const card = container.firstChild as HTMLElement;
    // Should only have the module CSS class, not any extra custom one
    expect(card.className).not.toContain("custom");
  });

  it("renders as a different element via the as prop", () => {
    render(<Card as="section">Section content</Card>);
    const el = screen.getByText("Section content");
    expect(el.tagName).toBe("SECTION");
  });

  it("merges custom className", () => {
    const { container } = render(<Card className="custom">Styled</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("custom");
  });

  it("passes additional HTML attributes", () => {
    render(<Card data-testid="my-card">Attrs</Card>);
    expect(screen.getByTestId("my-card")).toBeInTheDocument();
  });
});
