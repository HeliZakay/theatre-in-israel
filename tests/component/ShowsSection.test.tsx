import { render, screen } from "@testing-library/react";

jest.mock("@/components/shows/ShowCarousel/ShowCarousel", () => {
  const Mock = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="carousel">{children}</div>
  );
  Mock.displayName = "MockCarousel";
  return { __esModule: true, default: Mock };
});

jest.mock("@/components/ui/SectionHeader/SectionHeader", () => {
  const Mock = ({ title }: { title: string }) => <h2>{title}</h2>;
  Mock.displayName = "MockSectionHeader";
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
  const Mock = () => <div data-testid="image" />;
  Mock.displayName = "MockFallbackImage";
  return { __esModule: true, default: Mock };
});

jest.mock("@/components/ui/Tag/Tag", () => {
  const Mock = ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  );
  Mock.displayName = "MockTag";
  return { __esModule: true, default: Mock };
});

jest.mock("@/utils/getShowImagePath", () => ({
  getShowImagePath: (t: string) => `/images/${t}.webp`,
}));

import ShowsSection from "@/components/shows/ShowsSection/ShowsSection";
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
  summary: "",
  description: null,
  ...overrides,
});

describe("ShowsSection", () => {
  it("renders section header with title", () => {
    render(<ShowsSection title="דרמות" shows={[makeShow()]} />);
    expect(screen.getByRole("heading", { name: "דרמות" })).toBeInTheDocument();
  });

  it("renders show cards", () => {
    render(
      <ShowsSection
        title="דרמות"
        shows={[makeShow(), makeShow({ id: 2, title: "אותלו", slug: "othello" })]}
      />
    );
    expect(screen.getByText("המלט")).toBeInTheDocument();
    expect(screen.getByText("אותלו")).toBeInTheDocument();
  });

  it("shows rating when avgRating is present", () => {
    render(<ShowsSection title="t" shows={[makeShow({ avgRating: 4.5 })]} />);
    expect(screen.getByText("4.5")).toBeInTheDocument();
  });

  it("shows 'not rated' when avgRating is null", () => {
    render(
      <ShowsSection title="t" shows={[makeShow({ avgRating: null })]} />
    );
    expect(screen.getByText("טרם דורג")).toBeInTheDocument();
  });

  it("promotes sectionGenres to front of displayed genres", () => {
    const show = makeShow({
      genre: ["ישראלי", "דרמה", "קלאסיקה", "קומדיה"],
    });
    render(
      <ShowsSection title="קומדיות" shows={[show]} sectionGenres={["קומדיה"]} />
    );
    // "קומדיה" should be promoted to front and visible (within slice of 3)
    expect(screen.getByText("קומדיה")).toBeInTheDocument();
    // "קלאסיקה" was 3rd but "קומדיה" took its spot, pushing it to 4th (hidden)
    expect(screen.queryByText("קלאסיקה")).not.toBeInTheDocument();
  });

  it("keeps default genre order when sectionGenres is not provided", () => {
    const show = makeShow({
      genre: ["ישראלי", "דרמה", "קלאסיקה", "קומדיה"],
    });
    render(<ShowsSection title="t" shows={[show]} />);
    // First 3 genres in original order
    expect(screen.getByText("ישראלי")).toBeInTheDocument();
    expect(screen.getByText("דרמה")).toBeInTheDocument();
    expect(screen.getByText("קלאסיקה")).toBeInTheDocument();
    // 4th genre hidden
    expect(screen.queryByText("קומדיה")).not.toBeInTheDocument();
  });
});
