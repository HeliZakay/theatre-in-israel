import { render, screen } from "@testing-library/react";

jest.mock("embla-carousel-react", () => ({
  __esModule: true,
  default: jest.fn(() => [jest.fn(), null]),
}));

import ShowCarousel from "@/components/shows/ShowCarousel/ShowCarousel";

describe("ShowCarousel", () => {
  it("renders children inside carousel", () => {
    render(
      <ShowCarousel label="test carousel">
        <div>slide 1</div>
      </ShowCarousel>
    );
    expect(screen.getByText("slide 1")).toBeInTheDocument();
  });

  it("has role='region' and aria-roledescription='carousel'", () => {
    render(
      <ShowCarousel label="test">
        <div>slide</div>
      </ShowCarousel>
    );
    const region = screen.getByRole("region");
    expect(region).toHaveAttribute("aria-roledescription", "carousel");
  });

  it("has aria-label matching label prop", () => {
    render(
      <ShowCarousel label="דרמות">
        <div>slide</div>
      </ShowCarousel>
    );
    expect(screen.getByRole("region")).toHaveAttribute("aria-label", "דרמות");
  });

  it("renders prev and next navigation buttons", () => {
    render(
      <ShowCarousel label="test">
        <div>slide</div>
      </ShowCarousel>
    );
    expect(screen.getByLabelText("הצגה הבאה")).toBeInTheDocument();
    expect(screen.getByLabelText("הצגה הקודמת")).toBeInTheDocument();
  });
});
