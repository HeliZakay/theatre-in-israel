import { render, screen } from "@testing-library/react";
import Breadcrumb from "@/components/Breadcrumb/Breadcrumb";

describe("Breadcrumb", () => {
  it("renders the last item as a span with aria-current='page'", () => {
    render(
      <Breadcrumb
        items={[
          { label: "ראשי", href: "/" },
          { label: "הצגות", href: "/shows" },
          { label: "המלט" },
        ]}
      />,
    );
    const last = screen.getByText("המלט");
    expect(last.tagName).toBe("SPAN");
    expect(last).toHaveAttribute("aria-current", "page");
  });

  it("renders non-last items with href as links", () => {
    render(
      <Breadcrumb
        items={[
          { label: "ראשי", href: "/" },
          { label: "הצגות", href: "/shows" },
          { label: "המלט" },
        ]}
      />,
    );
    const homeLink = screen.getByRole("link", { name: "ראשי" });
    expect(homeLink).toHaveAttribute("href", "/");
    const showsLink = screen.getByRole("link", { name: "הצגות" });
    expect(showsLink).toHaveAttribute("href", "/shows");
  });

  it("renders non-last items without href as span", () => {
    render(
      <Breadcrumb
        items={[
          { label: "ראשי" },
          { label: "הצגות" },
        ]}
      />,
    );
    // "ראשי" has no href and is not last, so it should be a span
    const first = screen.getByText("ראשי");
    expect(first.tagName).toBe("SPAN");
    expect(first).toHaveAttribute("aria-current", "page");
  });

  it("renders a single-item list as a span with aria-current", () => {
    render(<Breadcrumb items={[{ label: "ראשי" }]} />);
    const item = screen.getByText("ראשי");
    expect(item.tagName).toBe("SPAN");
    expect(item).toHaveAttribute("aria-current", "page");
  });

  it("has nav element with aria-label='breadcrumb'", () => {
    render(
      <Breadcrumb items={[{ label: "ראשי", href: "/" }, { label: "המלט" }]} />,
    );
    const nav = screen.getByRole("navigation", { name: "breadcrumb" });
    expect(nav).toBeInTheDocument();
  });
});
