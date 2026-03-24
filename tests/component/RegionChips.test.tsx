import { render, screen } from "@testing-library/react";
import RegionChips from "@/components/Events/RegionChips";

jest.mock("@/components/Events/buildFilterUrl", () => ({
  buildFilterUrl: (date: string | undefined, region: string | undefined, theatre?: string) =>
    `/events/${date ?? ""}/${region ?? ""}${theatre ? `?theatre=${theatre}` : ""}`,
}));

const regionCounts: Record<string, number> = {
  center: 10,
  sharon: 3,
  shfela: 0,
  jerusalem: 5,
  north: 2,
  south: 0,
};

describe("RegionChips", () => {
  it("renders 'all' chip plus one chip per region", () => {
    render(
      <RegionChips
        datePreset="7days"
        regionCounts={regionCounts}
      />,
    );
    const radios = screen.getAllByRole("radio");
    // 1 "all" + 6 regions
    expect(radios).toHaveLength(7);
  });

  it("marks 'all' chip as checked when no region is selected", () => {
    render(
      <RegionChips datePreset="7days" regionCounts={regionCounts} />,
    );
    expect(screen.getByText("הכל")).toHaveAttribute("aria-checked", "true");
  });

  it("marks the matching region chip as checked", () => {
    render(
      <RegionChips
        datePreset="7days"
        region="center"
        regionCounts={regionCounts}
      />,
    );
    expect(screen.getByText("מרכז").closest("[role='radio']")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByText("הכל")).toHaveAttribute("aria-checked", "false");
  });

  it("disables chips with count 0", () => {
    render(
      <RegionChips datePreset="7days" regionCounts={regionCounts} />,
    );
    const shfela = screen.getByText("שפלה").closest("[role='radio']");
    expect(shfela).toHaveAttribute("aria-disabled", "true");
    expect(shfela).toHaveAttribute("tabindex", "-1");
  });

  it("does not disable chips with count > 0", () => {
    render(
      <RegionChips datePreset="7days" regionCounts={regionCounts} />,
    );
    const center = screen.getByText("מרכז").closest("[role='radio']");
    expect(center).not.toHaveAttribute("aria-disabled");
  });

  it("renders count badges", () => {
    render(
      <RegionChips datePreset="7days" regionCounts={regionCounts} />,
    );
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getAllByText("0")).toHaveLength(2); // shfela + south
  });

  it("has accessible radiogroup label", () => {
    render(
      <RegionChips datePreset="7days" regionCounts={regionCounts} />,
    );
    expect(screen.getByRole("radiogroup")).toHaveAttribute(
      "aria-label",
      "סינון לפי אזור",
    );
  });
});
