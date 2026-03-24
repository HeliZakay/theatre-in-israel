import { render, screen } from "@testing-library/react";
import EventCard from "@/components/Events/EventCard";
import type { EventCardProps } from "@/components/Events/EventCard";

const baseProps: EventCardProps = {
  hour: "20:00",
  showTitle: "המלט",
  showSlug: "hamlet",
  showTheatre: "תיאטרון הבימה",
  showAvgRating: null,
  showReviewCount: 0,
  venueName: "אולם רביבים",
  venueCity: "תל אביב",
};

function renderCard(overrides: Partial<EventCardProps> = {}) {
  return render(<EventCard {...baseProps} {...overrides} />);
}

describe("EventCard", () => {
  it("renders show title, hour, and venue text", () => {
    renderCard();
    expect(screen.getByText("המלט")).toBeInTheDocument();
    expect(screen.getByText("20:00")).toBeInTheDocument();
    expect(screen.getByText("אולם רביבים, תל אביב")).toBeInTheDocument();
  });

  it("shows rating badge when avgRating is not null", () => {
    renderCard({ showAvgRating: 4.2, showReviewCount: 8 });
    expect(screen.getByText(/4\.2/)).toBeInTheDocument();
    expect(screen.getByText(/8 ביקורות/)).toBeInTheDocument();
  });

  it("shows review CTA when avgRating is null and reviewCount is 0", () => {
    renderCard({ showAvgRating: null, showReviewCount: 0 });
    expect(screen.getByText(/כתבו ביקורת/)).toBeInTheDocument();
    expect(screen.getByLabelText("כתבו ביקורת על המלט")).toHaveAttribute(
      "href",
      "/shows/hamlet/review",
    );
  });

  it("shows nothing when avgRating is null and reviewCount > 0", () => {
    renderCard({ showAvgRating: null, showReviewCount: 3 });
    expect(screen.queryByText(/כתבו ביקורת/)).not.toBeInTheDocument();
    expect(screen.queryByText("★")).not.toBeInTheDocument();
  });

  it("renders optional dateLabel", () => {
    renderCard({ dateLabel: "יום ד׳" });
    expect(screen.getByText("יום ד׳")).toBeInTheDocument();
  });

  it("does not render dateLabel when not provided", () => {
    renderCard();
    // Only the hour should be in the time element
    const time = screen.getByText("20:00").closest("time");
    expect(time?.children).toHaveLength(0);
  });

  it("links to the show page", () => {
    renderCard();
    expect(screen.getByText("המלט")).toHaveAttribute("href", "/shows/hamlet");
  });
});
