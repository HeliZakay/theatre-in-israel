// tests/component/EventsClientView.test.tsx

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EventsClientView from "@/components/Events/EventsClientView";
import type { DateTab } from "@/components/Events/DateStrip";
import type { DateGroup } from "@/components/Events/EventsList";

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */

jest.mock("@/components/Events/DateStrip", () => {
  const MockDateStrip = ({
    tabs,
    selected,
    onSelect,
  }: {
    tabs: DateTab[];
    selected: string;
    onSelect: (dateKey: string) => void;
  }) => (
    <div data-testid="date-strip">
      {tabs.map((tab) => (
        <button
          key={tab.dateKey}
          data-selected={tab.dateKey === selected}
          onClick={() => onSelect(tab.dateKey)}
        >
          {tab.dayName}
        </button>
      ))}
    </div>
  );
  MockDateStrip.displayName = "MockDateStrip";
  return { __esModule: true, default: MockDateStrip };
});

jest.mock("@/components/Events/DayView", () => {
  const MockDayView = ({ group }: { group: DateGroup }) => (
    <div data-testid="day-view">{group.dateKey}</div>
  );
  MockDayView.displayName = "MockDayView";
  return { __esModule: true, default: MockDayView };
});

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function makeTab(dateKey: string, dayName: string, count: number): DateTab {
  return { dateKey, dayName, dayNum: "1", monthName: "מרץ", label: "", count };
}

function makeGroup(dateKey: string, eventCount: number): DateGroup {
  return {
    dateKey,
    label: dateKey,
    events: Array.from({ length: eventCount }, (_, i) => ({
      id: i,
      hour: "20:00",
      showTitle: `Show ${i}`,
      showSlug: `show-${i}`,
      showTheatre: "Theatre",
      showAvgRating: null,
      showReviewCount: 0,
      venueName: "Venue",
      venueCity: "City",
    })),
  };
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe("EventsClientView", () => {
  it("renders with first tab selected by default", () => {
    const tabs = [makeTab("2026-03-24", "יום שלישי", 5), makeTab("2026-03-25", "יום רביעי", 3)];
    const groups = [makeGroup("2026-03-24", 5), makeGroup("2026-03-25", 3)];

    render(<EventsClientView groups={groups} dateTabs={tabs} />);

    expect(screen.getByTestId("date-strip")).toBeInTheDocument();
    expect(screen.getByTestId("day-view")).toHaveTextContent("2026-03-24");
  });

  it("shows event count summary for selected group", () => {
    const tabs = [makeTab("2026-03-24", "יום שלישי", 5)];
    const groups = [makeGroup("2026-03-24", 5)];

    render(<EventsClientView groups={groups} dateTabs={tabs} />);

    expect(screen.getByText("5 הופעות")).toBeInTheDocument();
  });

  it('shows "לא נמצאו הופעות" when group not found', () => {
    const tabs = [makeTab("2026-03-24", "יום שלישי", 0)];
    const groups: DateGroup[] = []; // No matching group

    render(<EventsClientView groups={groups} dateTabs={tabs} />);

    expect(screen.getByText("לא נמצאו הופעות")).toBeInTheDocument();
  });

  it("handles empty dateTabs gracefully", () => {
    render(<EventsClientView groups={[]} dateTabs={[]} />);

    expect(screen.getByText("לא נמצאו הופעות")).toBeInTheDocument();
    expect(screen.queryByTestId("day-view")).not.toBeInTheDocument();
  });

  it("changes DayView when selecting a different date", async () => {
    const user = userEvent.setup();
    const tabs = [makeTab("2026-03-24", "יום שלישי", 5), makeTab("2026-03-25", "יום רביעי", 3)];
    const groups = [makeGroup("2026-03-24", 5), makeGroup("2026-03-25", 3)];

    render(<EventsClientView groups={groups} dateTabs={tabs} />);

    expect(screen.getByTestId("day-view")).toHaveTextContent("2026-03-24");

    await user.click(screen.getByText("יום רביעי"));

    expect(screen.getByTestId("day-view")).toHaveTextContent("2026-03-25");
    expect(screen.getByText("3 הופעות")).toBeInTheDocument();
  });
});
