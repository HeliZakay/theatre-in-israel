import { render, screen } from "@testing-library/react";

jest.mock("@/components/SearchBar/SearchBar", () => {
  const Mock = () => <div data-testid="search-bar" />;
  Mock.displayName = "MockSearchBar";
  return { __esModule: true, default: Mock };
});

jest.mock("@/components/FeaturedShow/FeaturedShow", () => {
  const Mock = ({ title }: { title: string }) => (
    <div data-testid="featured-show">{title}</div>
  );
  Mock.displayName = "MockFeaturedShow";
  return { __esModule: true, default: Mock };
});

jest.mock("@/utils/getShowImagePath", () => ({
  getShowImagePath: (t: string) => `/images/${t}.webp`,
}));

jest.mock("@/constants/routes", () => ({
  __esModule: true,
  default: { SHOWS: "/shows" },
  showPath: (slug: string) => `/shows/${slug}`,
}));

import Hero from "@/components/Hero/Hero";
import type { ShowListItem } from "@/types";

const makeShow = (overrides: Partial<ShowListItem> = {}): ShowListItem => ({
  id: 1,
  title: "המלט",
  slug: "hamlet",
  theatre: "הקאמרי",
  genre: ["דרמה"],
  avgRating: 4.5,
  reviewCount: 10,
  durationMinutes: 120,
  summary: null,
  image: null,
  ...overrides,
});

describe("Hero", () => {
  it("renders title heading", () => {
    render(<Hero />);
    expect(
      screen.getByRole("heading", { name: "דירוגים וביקורות להצגות בישראל" })
    ).toBeInTheDocument();
  });

  it("renders SearchBar", () => {
    render(<Hero />);
    expect(screen.getByTestId("search-bar")).toBeInTheDocument();
  });

  it("renders FeaturedShow when featuredShow is provided", () => {
    render(<Hero featuredShow={makeShow()} />);
    expect(screen.getByTestId("featured-show")).toBeInTheDocument();
  });

  it("does not render FeaturedShow when featuredShow is null", () => {
    render(<Hero featuredShow={null} />);
    expect(screen.queryByTestId("featured-show")).not.toBeInTheDocument();
  });
});
