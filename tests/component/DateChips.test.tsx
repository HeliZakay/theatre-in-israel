import { render, screen } from "@testing-library/react";
import DateChips from "@/components/events/DateChips";
import { DATE_SLUGS, DEFAULT_DATE_PRESET } from "@/lib/eventsConstants";

describe("DateChips", () => {
  it("renders all date slug labels", () => {
    render(<DateChips datePreset="7days" />);

    for (const label of Object.values(DATE_SLUGS)) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("active chip has aria-checked='true'", () => {
    render(<DateChips datePreset="today" />);

    const activeChip = screen.getByText(DATE_SLUGS["today"]);
    expect(activeChip).toHaveAttribute("aria-checked", "true");
  });

  it("non-active chips have aria-checked='false'", () => {
    render(<DateChips datePreset="today" />);

    const inactiveChip = screen.getByText(DATE_SLUGS["weekend"]);
    expect(inactiveChip).toHaveAttribute("aria-checked", "false");
  });

  it('default preset "7days" href is /events (no slug segment)', () => {
    render(<DateChips datePreset="7days" />);

    const defaultChip = screen.getByText(DATE_SLUGS[DEFAULT_DATE_PRESET]);
    expect(defaultChip).toHaveAttribute("href", "/events");
  });

  it("non-default slug appears in href", () => {
    render(<DateChips datePreset="weekend" />);

    const weekendChip = screen.getByText(DATE_SLUGS["weekend"]);
    expect(weekendChip).toHaveAttribute("href", "/events/weekend");
  });

  it("locationSlug and theatre params pass through to hrefs", () => {
    render(
      <DateChips
        datePreset="7days"
        locationSlug="center"
        theatre="הבימה"
      />,
    );

    // Default slug: /events/center?theatre=...
    const defaultChip = screen.getByText(DATE_SLUGS[DEFAULT_DATE_PRESET]);
    expect(defaultChip).toHaveAttribute(
      "href",
      `/events/center?theatre=${encodeURIComponent("הבימה")}`,
    );

    // Non-default slug: /events/today/center?theatre=...
    const todayChip = screen.getByText(DATE_SLUGS["today"]);
    expect(todayChip).toHaveAttribute(
      "href",
      `/events/today/center?theatre=${encodeURIComponent("הבימה")}`,
    );
  });
});
