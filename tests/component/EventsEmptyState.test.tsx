import { render, screen } from "@testing-library/react";
import EventsEmptyState from "@/components/events/EventsEmptyState";

jest.mock("@/components/events/buildFilterUrl", () => ({
  buildFilterUrl: (...args: unknown[]) => `/events/mock?${args.join(",")}`,
}));

describe("EventsEmptyState", () => {
  it("shows theatre-specific message when theatre filter is set", () => {
    render(
      <EventsEmptyState
        datePreset="all"
        theatre="תיאטרון הקאמרי"
        nearestRegion={null}
      />,
    );
    expect(
      screen.getByText(/אין הופעות קרובות של תיאטרון הקאמרי/),
    ).toBeInTheDocument();
  });

  it("shows generic message when no filters and no nearestRegion", () => {
    render(
      <EventsEmptyState datePreset="all" nearestRegion={null} />,
    );
    expect(screen.getByText("אין הופעות קרובות כרגע.")).toBeInTheDocument();
  });

  it("shows nearest region suggestion when non-default filter + nearestRegion", () => {
    render(
      <EventsEmptyState
        datePreset="today"
        region="north"
        nearestRegion={{ slug: "center", label: "מרכז", count: 15 }}
      />,
    );
    expect(screen.getByText(/לא נמצאו הופעות/)).toBeInTheDocument();
    expect(screen.getByText(/בצפון/)).toBeInTheDocument();
    expect(screen.getByText(/בהיום/)).toBeInTheDocument();
    expect(screen.getByText(/15 הופעות במרכז/)).toBeInTheDocument();
  });

  it("shows city name when city filter is set", () => {
    render(
      <EventsEmptyState
        datePreset="today"
        city="tel-aviv"
        nearestRegion={{ slug: "north", label: "צפון", count: 5 }}
      />,
    );
    expect(screen.getByText(/בתל אביב/)).toBeInTheDocument();
  });

  it("shows region suggestion with default date when region filter is non-default", () => {
    render(
      <EventsEmptyState
        datePreset="all"
        region="south"
        nearestRegion={{ slug: "center", label: "מרכז", count: 10 }}
      />,
    );
    expect(screen.getByText(/בדרום/)).toBeInTheDocument();
    // Should not include date text since it's the default preset
    expect(screen.queryByText(/בהכל/)).not.toBeInTheDocument();
  });
});
