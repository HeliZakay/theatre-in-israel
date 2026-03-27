jest.mock("@/components/ui/FallbackImage/FallbackImage", () => {
  const MockFallbackImage = (props: Record<string, unknown>) => (
    <img alt={props.alt as string} src={props.src as string} />
  );
  MockFallbackImage.displayName = "MockFallbackImage";
  return { __esModule: true, default: MockFallbackImage };
});

jest.mock("@/components/ui/Tag/Tag", () => {
  const MockTag = ({ children }: { children: React.ReactNode }) => (
    <span data-testid="tag">{children}</span>
  );
  MockTag.displayName = "MockTag";
  return { __esModule: true, default: MockTag };
});

import { render, screen } from "@testing-library/react";
import ShowCard from "@/components/shows/ShowCard/ShowCard";
import type { ShowListItem } from "@/types";

function makeShow(overrides: Partial<ShowListItem> = {}): ShowListItem {
  return {
    id: 1,
    slug: "hamlet",
    title: "המלט",
    theatre: "תיאטרון הקאמרי",
    durationMinutes: 120,
    summary: "הצגה קלאסית",
    description: null,
    genre: ["דרמה"],
    reviewCount: 5,
    avgRating: 4.5,
    ...overrides,
  };
}

describe("ShowCard", () => {
  it("renders the show title and theatre name", () => {
    render(<ShowCard show={makeShow()} />);
    expect(screen.getByText("המלט")).toBeInTheDocument();
    expect(screen.getByText("תיאטרון הקאמרי")).toBeInTheDocument();
  });

  it("uses slug in the link href", () => {
    render(<ShowCard show={makeShow({ slug: "my-show" })} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/shows/my-show");
  });

  it("falls back to id when slug is nullish", () => {
    render(
      <ShowCard show={makeShow({ slug: undefined as unknown as string })} />,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/shows/1");
  });

  it("displays avgRating with toFixed(1)", () => {
    render(<ShowCard show={makeShow({ avgRating: 3.456 })} />);
    expect(screen.getByText("3.5")).toBeInTheDocument();
  });

  it("shows placeholder text when avgRating is null", () => {
    render(<ShowCard show={makeShow({ avgRating: null })} />);
    expect(screen.getByText("עדיין אין דירוגים")).toBeInTheDocument();
  });

  it("renders no tags when genre array is empty", () => {
    render(<ShowCard show={makeShow({ genre: [] })} />);
    expect(screen.queryAllByTestId("tag")).toHaveLength(0);
  });

  it("slices genre array to max 3 tags", () => {
    render(
      <ShowCard
        show={makeShow({ genre: ["דרמה", "קומדיה", "מחזמר", "ילדים"] })}
      />,
    );
    const tags = screen.getAllByTestId("tag");
    expect(tags).toHaveLength(3);
    expect(tags[0]).toHaveTextContent("דרמה");
    expect(tags[1]).toHaveTextContent("קומדיה");
    expect(tags[2]).toHaveTextContent("מחזמר");
  });
});
