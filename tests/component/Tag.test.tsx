import { render, screen } from "@testing-library/react";
import Tag from "@/components/Tag/Tag";

describe("Tag", () => {
  it("renders children text", () => {
    render(<Tag>דרמה</Tag>);
    expect(screen.getByText("דרמה")).toBeInTheDocument();
  });

  it("renders as a span element", () => {
    render(<Tag>דרמה</Tag>);
    expect(screen.getByText("דרמה").tagName).toBe("SPAN");
  });

  it("applies custom className", () => {
    render(<Tag className="custom">דרמה</Tag>);
    expect(screen.getByText("דרמה")).toHaveClass("custom");
  });
});
