import { render, screen } from "@testing-library/react";

jest.mock("@/lib/data/homepage", () => ({
  getUpcomingEventsVaried: jest.fn(),
}));

jest.mock("@/components/ui/SectionHeader/SectionHeader", () => {
  const Mock = ({ title }: { title: string }) => <h2>{title}</h2>;
  Mock.displayName = "MockSectionHeader";
  return { __esModule: true, default: Mock };
});

jest.mock("@/components/shows/ShowCarousel/ShowCarousel", () => {
  const Mock = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  );
  Mock.displayName = "MockCarousel";
  return { __esModule: true, default: Mock };
});

jest.mock("@/components/ui/Card/Card", () => {
  const Mock = ({
    children,
    ...rest
  }: { children: React.ReactNode } & Record<string, unknown>) => (
    <div {...(rest as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>
  );
  Mock.displayName = "MockCard";
  return { __esModule: true, default: Mock };
});

jest.mock("@/components/ui/FallbackImage/FallbackImage", () => {
  const Mock = () => <div />;
  Mock.displayName = "MockFallbackImage";
  return { __esModule: true, default: Mock };
});

jest.mock("@/utils/getShowImagePath", () => ({
  getShowImagePath: (t: string) => `/images/${t}.webp`,
}));

jest.mock("@/lib/seo", () => ({
  getShowImageAlt: (t: string) => `alt ${t}`,
}));

jest.mock("@/constants/routes", () => ({
  __esModule: true,
  default: { EVENTS: "/events" },
  showPath: (slug: string) => `/shows/${slug}`,
}));

import UpcomingEventsSection from "@/components/events/UpcomingEventsSection";
import { getUpcomingEventsVaried } from "@/lib/data/homepage";

const mockEvent = {
  id: 1,
  showSlug: "test-show",
  showTitle: "הצגת טסט",
  date: "2026-03-25",
  hour: "20:00",
  dateLabel: "מחר",
  venueName: "תיאטרון הקאמרי",
  venueCity: "תל אביב",
  showTheatre: "הקאמרי",
  showAvgRating: 4.2,
  showReviewCount: 5,
};

describe("UpcomingEventsSection", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns null when no events", async () => {
    jest.mocked(getUpcomingEventsVaried).mockResolvedValue([]);
    const Component = await UpcomingEventsSection();
    expect(Component).toBeNull();
  });

  it("renders section with events", async () => {
    jest.mocked(getUpcomingEventsVaried).mockResolvedValue([mockEvent]);
    const Component = await UpcomingEventsSection();
    render(Component!);
    expect(
      screen.getByRole("heading", { name: "הצגות הקרובות" })
    ).toBeInTheDocument();
    expect(screen.getByText("הצגת טסט")).toBeInTheDocument();
  });

  it("shows venue info", async () => {
    jest.mocked(getUpcomingEventsVaried).mockResolvedValue([mockEvent]);
    const Component = await UpcomingEventsSection();
    render(Component!);
    expect(
      screen.getByText("תיאטרון הקאמרי, תל אביב")
    ).toBeInTheDocument();
  });

  it("shows rating when available", async () => {
    jest.mocked(getUpcomingEventsVaried).mockResolvedValue([mockEvent]);
    const Component = await UpcomingEventsSection();
    render(Component!);
    expect(screen.getByText("4.2")).toBeInTheDocument();
  });

  it("shows 'not rated' when no rating", async () => {
    jest.mocked(getUpcomingEventsVaried).mockResolvedValue([
      { ...mockEvent, showAvgRating: null, showReviewCount: 0 },
    ]);
    const Component = await UpcomingEventsSection();
    render(Component!);
    expect(screen.getByText("טרם דורג")).toBeInTheDocument();
  });
});
