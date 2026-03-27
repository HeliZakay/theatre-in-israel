import { render, screen } from "@testing-library/react";
import EventsList from "@/components/events/EventsList";
import type { DateGroup } from "@/components/events/EventsList";
import type { EventCardProps } from "@/components/events/EventCard";

const makeEvent = (overrides: Partial<EventCardProps> = {}): EventCardProps => ({
  hour: "20:00",
  showTitle: "המלט",
  showSlug: "hamlet",
  showTheatre: "תיאטרון הבימה",
  showAvgRating: null,
  showReviewCount: 0,
  venueName: "אולם רביבים",
  venueCity: "תל אביב",
  ...overrides,
});

const sampleGroups: DateGroup[] = [
  {
    dateKey: "2026-03-24",
    label: "יום שלישי, 24 במרץ",
    events: [
      makeEvent({ hour: "19:00", showTitle: "קברט", showSlug: "cabaret" }),
      makeEvent({ hour: "21:00" }),
    ],
  },
  {
    dateKey: "2026-03-25",
    label: "יום רביעי, 25 במרץ",
    events: [makeEvent({ hour: "20:30", showTitle: "קזבלן", showSlug: "kazablan" })],
  },
];

describe("EventsList", () => {
  it("renders date group headers (h2)", () => {
    render(<EventsList groups={sampleGroups} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "יום שלישי, 24 במרץ" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "יום רביעי, 25 במרץ" }),
    ).toBeInTheDocument();
  });

  it("renders correct number of EventCards per group", () => {
    const { container } = render(<EventsList groups={sampleGroups} />);

    const sections = container.querySelectorAll("section");
    expect(sections).toHaveLength(2);
    // First group has 2 events, second has 1
    expect(screen.getByText("קברט")).toBeInTheDocument();
    expect(screen.getByText("קזבלן")).toBeInTheDocument();
    // Both "המלט" cards in first group
    expect(screen.getAllByText("המלט")).toHaveLength(1);
  });

  it("empty groups array renders nothing", () => {
    const { container } = render(<EventsList groups={[]} />);
    expect(container.querySelectorAll("section")).toHaveLength(0);
    expect(
      screen.queryByRole("heading", { level: 2 }),
    ).not.toBeInTheDocument();
  });

  it("multiple groups render in correct order", () => {
    render(<EventsList groups={sampleGroups} />);

    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings).toHaveLength(2);
    expect(headings[0]).toHaveTextContent("יום שלישי, 24 במרץ");
    expect(headings[1]).toHaveTextContent("יום רביעי, 25 במרץ");
  });
});
