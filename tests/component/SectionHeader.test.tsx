import { render, screen } from "@testing-library/react";
import SectionHeader from "@/components/ui/SectionHeader/SectionHeader";

describe("SectionHeader", () => {
  it("renders the title", () => {
    render(<SectionHeader title="הצגות מובילות" />);
    expect(
      screen.getByRole("heading", { name: "הצגות מובילות" }),
    ).toBeInTheDocument();
  });

  it("renders kicker when provided", () => {
    render(<SectionHeader title="ביקורות" kicker="מהקהל" />);
    expect(screen.getByText("מהקהל")).toBeInTheDocument();
  });

  it("does not render kicker when omitted", () => {
    render(<SectionHeader title="ביקורות" />);
    expect(screen.queryByText("מהקהל")).not.toBeInTheDocument();
  });

  it("renders link when both href and text are provided", () => {
    render(
      <SectionHeader
        title="הצגות"
        linkHref="/shows"
        linkText="כל ההצגות"
      />,
    );
    const link = screen.getByRole("link", { name: "כל ההצגות" });
    expect(link).toHaveAttribute("href", "/shows");
  });

  it("does not render link when only href is provided", () => {
    render(<SectionHeader title="הצגות" linkHref="/shows" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
