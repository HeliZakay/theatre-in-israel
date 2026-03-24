import { render, screen } from "@testing-library/react";

jest.mock("@/components/ShowCarousel/ShowCarousel", () => {
  const Mock = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="carousel">{children}</div>
  );
  Mock.displayName = "MockCarousel";
  return { __esModule: true, default: Mock };
});

jest.mock("@/components/SectionHeader/SectionHeader", () => {
  const Mock = ({ title }: { title: string }) => <h2>{title}</h2>;
  Mock.displayName = "MockSectionHeader";
  return { __esModule: true, default: Mock };
});

jest.mock("@/components/Card/Card", () => {
  const Mock = ({
    children,
    ...rest
  }: { children: React.ReactNode } & Record<string, unknown>) => (
    <div {...(rest as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>
  );
  Mock.displayName = "MockCard";
  return { __esModule: true, default: Mock };
});

jest.mock("@/components/FallbackImage/FallbackImage", () => {
  const Mock = () => <div data-testid="image" />;
  Mock.displayName = "MockFallbackImage";
  return { __esModule: true, default: Mock };
});

jest.mock("@/components/Tag/Tag", () => {
  const Mock = ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  );
  Mock.displayName = "MockTag";
  return { __esModule: true, default: Mock };
});

jest.mock("@/utils/getShowImagePath", () => ({
  getShowImagePath: (t: string) => `/images/${t}.webp`,
}));

import ShowsSection from "@/components/ShowsSection/ShowsSection";
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
});
