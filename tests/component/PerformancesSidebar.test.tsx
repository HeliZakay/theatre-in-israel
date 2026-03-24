import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PerformancesSidebar from "@/components/PerformancesSidebar/PerformancesSidebar";
import type { ShowEvent } from "@/types";

function makeEvent(overrides: Partial<ShowEvent> & { id: number; date: string; hour: string }): ShowEvent {
  return {
    venue: { name: "אולם 1", city: "תל אביב", address: null, regions: [] },
    ...overrides,
  };
}

function renderSidebar(events: ShowEvent[], theatre = "תיאטרון הקאמרי") {
  return render(<PerformancesSidebar events={events} theatre={theatre} />);
}

describe("PerformancesSidebar", () => {
  it("returns null for empty events", () => {
    const { container } = renderSidebar([]);
    expect(container.innerHTML).toBe("");
  });

  it("groups events by date and renders date headings", () => {
    const events = [
      makeEvent({ id: 1, date: "2026-04-01T19:00:00", hour: "19:00" }),
      makeEvent({ id: 2, date: "2026-04-01T21:00:00", hour: "21:00" }),
      makeEvent({ id: 3, date: "2026-04-02T20:00:00", hour: "20:00" }),
    ];
    renderSidebar(events);

    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings).toHaveLength(2); // two distinct dates
  });

  it("shows all groups when total events <= 8", () => {
    const events = Array.from({ length: 8 }, (_, i) =>
      makeEvent({
        id: i + 1,
        date: `2026-04-${String(i + 1).padStart(2, "0")}T19:00:00`,
        hour: "19:00",
      }),
    );
    renderSidebar(events);

    // No "show more" button when exactly at threshold
    expect(screen.queryByText("הצג עוד")).not.toBeInTheDocument();
  });

  it("collapses to 3 groups when events > 8 and shows toggle", async () => {
    // Create 10 events across 10 different dates
    const events = Array.from({ length: 10 }, (_, i) =>
      makeEvent({
        id: i + 1,
        date: `2026-04-${String(i + 1).padStart(2, "0")}T19:00:00`,
        hour: "19:00",
      }),
    );
    renderSidebar(events);

    // Initially collapsed: only 3 date groups visible
    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings).toHaveLength(3);

    expect(screen.getByText("הצג עוד")).toBeInTheDocument();
  });

  it("expands all groups on 'show more' click", async () => {
    const user = userEvent.setup();
    const events = Array.from({ length: 10 }, (_, i) =>
      makeEvent({
        id: i + 1,
        date: `2026-04-${String(i + 1).padStart(2, "0")}T19:00:00`,
        hour: "19:00",
      }),
    );
    renderSidebar(events);

    await user.click(screen.getByText("הצג עוד"));

    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings).toHaveLength(10);
    expect(screen.getByText("הצג פחות")).toBeInTheDocument();
  });

  it("renders hour and venue for each event", () => {
    const events = [
      makeEvent({
        id: 1,
        date: "2026-04-01T19:00:00",
        hour: "19:00",
        venue: { name: "אולם מרכזי", city: "חיפה", address: null, regions: [] },
      }),
    ];
    renderSidebar(events);

    expect(screen.getByText("19:00")).toBeInTheDocument();
    expect(screen.getByText("אולם מרכזי")).toBeInTheDocument();
  });
});
