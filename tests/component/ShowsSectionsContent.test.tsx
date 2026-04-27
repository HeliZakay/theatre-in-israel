import { render, screen } from "@testing-library/react";

jest.mock("@/lib/data/homepage", () => ({
  getSectionsData: jest.fn(),
}));

const capturedProps: Record<string, string[] | undefined>[] = [];
jest.mock("@/components/shows/ShowsSection/ShowsSection", () => {
  const Mock = ({ title, sectionGenres }: { title: string; sectionGenres?: string[] }) => {
    capturedProps.push({ title: [title], sectionGenres });
    return <div data-testid="shows-section">{title}</div>;
  };
  Mock.displayName = "MockShowsSection";
  return { __esModule: true, default: Mock };
});

jest.mock("@/lib/seo", () => ({
  toAbsoluteUrl: (p: string) => `https://example.com${p}`,
  toJsonLd: (o: unknown) => JSON.stringify(o),
}));

jest.mock("@/constants/routes", () => ({
  __esModule: true,
  default: { SHOWS: "/shows" },
  showPath: (slug: string) => `/shows/${slug}`,
  genrePath: (slug: string) => `/genres/${slug}`,
}));

jest.mock("@/utils/showsQuery", () => ({
  buildShowsQueryString: () => "?genres=test",
}));

import ShowsSectionsContent from "@/components/shows/ShowsSectionsContent/ShowsSectionsContent";
import { getSectionsData } from "@/lib/data/homepage";

const makeShow = (id: number, title: string) => ({
  id,
  title,
  slug: title,
  theatre: "test",
  genre: [],
  avgRating: 4.0,
  reviewCount: 5,
  durationMinutes: 90,
  summary: "",
  description: null,
  isNew: false,
});

const emptySections = {
  topRated: [],
  dramas: [],
  comedies: [],
  musicals: [],
  israeli: [],
  kids: [],
  newShows: [],
  featuredShowId: null,
};

describe("ShowsSectionsContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedProps.length = 0;
  });

  it("renders all 6 genre sections", async () => {
    jest.mocked(getSectionsData).mockResolvedValue(emptySections);
    const Component = await ShowsSectionsContent({});
    render(Component);
    const sections = screen.getAllByTestId("shows-section");
    expect(sections).toHaveLength(6);
  });

  it("renders JSON-LD script when topRated is non-empty", async () => {
    jest.mocked(getSectionsData).mockResolvedValue({
      ...emptySections,
      topRated: [makeShow(1, "show1")],
    });
    const Component = await ShowsSectionsContent({});
    const { container } = render(Component);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();
  });

  it("does not render JSON-LD when topRated is empty", async () => {
    jest.mocked(getSectionsData).mockResolvedValue(emptySections);
    const Component = await ShowsSectionsContent({});
    const { container } = render(Component);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeInTheDocument();
  });

  it("passes sectionGenres to genre sections but not topRated", async () => {
    jest.mocked(getSectionsData).mockResolvedValue(emptySections);
    const Component = await ShowsSectionsContent({});
    render(Component);
    // topRated has no sectionGenres
    expect(capturedProps[0].sectionGenres).toBeUndefined();
    // Genre sections have sectionGenres
    expect(capturedProps[1].sectionGenres).toEqual(["מחזמר"]);
    expect(capturedProps[2].sectionGenres).toEqual(["דרמה"]);
    expect(capturedProps[3].sectionGenres).toEqual(["קומדיה"]);
    expect(capturedProps[4].sectionGenres).toEqual(["ישראלי"]);
    expect(capturedProps[5].sectionGenres).toEqual(["ילדים"]);
  });

  it("renders banner between sections", async () => {
    jest.mocked(getSectionsData).mockResolvedValue(emptySections);
    const Component = await ShowsSectionsContent({
      banner: <div data-testid="banner">banner</div>,
    });
    render(Component);
    expect(screen.getByTestId("banner")).toBeInTheDocument();
  });
});
