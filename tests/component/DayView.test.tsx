import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DayView from "@/components/Events/DayView";
import type { EventCardProps } from "@/components/Events/EventCard";
import type { DateGroup } from "@/components/Events/EventsList";

function makeEvent(hour: string, overrides: Partial<EventCardProps> = {}): EventCardProps {
  return {
    hour,
    showTitle: "הצגת מבחן",
    showSlug: "test-show",
    showTheatre: "תיאטרון הקאמרי",
    showAvgRating: null,
    showReviewCount: 0,
    venueName: "אולם 1",
    venueCity: "תל אביב",
    ...overrides,
  };
}

function makeGroup(events: EventCardProps[]): DateGroup {
  return {
    dateKey: "2026-04-01",
    label: "יום ד׳, 1 באפריל",
    events,
  };
}

describe("DayView", () => {
  it("groups events into morning slot (8-12)", () => {
    const group = makeGroup([makeEvent("10:00"), makeEvent("11:30")]);
    render(<DayView group={group} />);

    expect(screen.getByText("בוקר")).toBeInTheDocument();
    expect(screen.getByText(/2 הופעות/)).toBeInTheDocument();
  });

  it("groups events into afternoon slot (13-18)", () => {
    const group = makeGroup([makeEvent("14:00")]);
    render(<DayView group={group} />);
    expect(screen.getByText("אחר הצהריים")).toBeInTheDocument();
  });

  it("groups events into evening slot (19-20)", () => {
    const group = makeGroup([makeEvent("19:30"), makeEvent("20:00")]);
    render(<DayView group={group} />);
    expect(screen.getByText("ערב")).toBeInTheDocument();
  });

  it("groups events into night slot (21-23)", () => {
    const group = makeGroup([makeEvent("22:00")]);
    render(<DayView group={group} />);
    expect(screen.getByText("לילה")).toBeInTheDocument();
  });

  it("maps hour < 8 to morning", () => {
    const group = makeGroup([makeEvent("06:00")]);
    render(<DayView group={group} />);
    expect(screen.getByText("בוקר")).toBeInTheDocument();
  });

  it("maps hour > 23 to night (edge)", () => {
    // 24:00 edge case — parseInt("24") > 23
    const group = makeGroup([makeEvent("24:00")]);
    render(<DayView group={group} />);
    expect(screen.getByText("לילה")).toBeInTheDocument();
  });

  it("all slots start expanded", () => {
    const group = makeGroup([makeEvent("10:00"), makeEvent("20:00")]);
    render(<DayView group={group} />);

    const buttons = screen.getAllByRole("button");
    for (const btn of buttons) {
      expect(btn).toHaveAttribute("aria-expanded", "true");
    }
  });

  it("toggles slot collapse on click", async () => {
    const user = userEvent.setup();
    const group = makeGroup([makeEvent("10:00")]);
    render(<DayView group={group} />);

    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("aria-expanded", "true");

    await user.click(btn);
    expect(btn).toHaveAttribute("aria-expanded", "false");

    await user.click(btn);
    expect(btn).toHaveAttribute("aria-expanded", "true");
  });

  it("renders rating when avgRating is present", () => {
    const group = makeGroup([
      makeEvent("20:00", { showAvgRating: 4.5, showReviewCount: 12 }),
    ]);
    render(<DayView group={group} />);
    expect(screen.getByText(/4\.5/)).toBeInTheDocument();
    expect(screen.getByText(/12 ביקורות/)).toBeInTheDocument();
  });

  it("does not render rating when avgRating is null", () => {
    const group = makeGroup([makeEvent("20:00", { showAvgRating: null })]);
    render(<DayView group={group} />);
    expect(screen.queryByText("★")).not.toBeInTheDocument();
  });

  it("does not render empty slots", () => {
    // Only evening events — no morning/afternoon/night sections
    const group = makeGroup([makeEvent("19:00")]);
    render(<DayView group={group} />);
    expect(screen.queryByText("בוקר")).not.toBeInTheDocument();
    expect(screen.queryByText("אחר הצהריים")).not.toBeInTheDocument();
    expect(screen.queryByText("לילה")).not.toBeInTheDocument();
  });
});
