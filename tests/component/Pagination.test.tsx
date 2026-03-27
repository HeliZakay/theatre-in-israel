import { render, screen } from "@testing-library/react";
import Pagination from "@/components/ui/Pagination/Pagination";
import type { ShowFilters } from "@/types";

function makeFilters(overrides: Partial<ShowFilters> = {}): ShowFilters {
  return {
    query: "",
    theatre: "",
    genres: [],
    sort: "",
    page: 1,
    totalPages: 5,
    ...overrides,
  };
}

describe("Pagination", () => {
  it("renders navigation with page links", () => {
    render(<Pagination filters={makeFilters({ page: 3, totalPages: 5 })} />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders nothing when totalPages is 1", () => {
    const { container } = render(
      <Pagination filters={makeFilters({ totalPages: 1 })} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("disables 'previous' on first page", () => {
    render(<Pagination filters={makeFilters({ page: 1, totalPages: 3 })} />);
    // First page: "הקודם" is a disabled span, not a link
    const prev = screen.getByText("הקודם");
    expect(prev.tagName).not.toBe("A");
  });

  it("disables 'next' on last page", () => {
    render(<Pagination filters={makeFilters({ page: 5, totalPages: 5 })} />);
    const next = screen.getByText("הבא");
    expect(next.tagName).not.toBe("A");
  });

  it("renders 'previous' as a link when not on first page", () => {
    render(<Pagination filters={makeFilters({ page: 2, totalPages: 5 })} />);
    const prev = screen.getByText("הקודם");
    expect(prev.tagName).toBe("A");
  });

  it("renders 'next' as a link when not on last page", () => {
    render(<Pagination filters={makeFilters({ page: 2, totalPages: 5 })} />);
    const next = screen.getByText("הבא");
    expect(next.tagName).toBe("A");
  });

  it("renders correct page numbers around current page", () => {
    render(<Pagination filters={makeFilters({ page: 3, totalPages: 7 })} />);
    // Should show pages 1-5 (3 ± 2)
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("shows ellipsis when there are gaps", () => {
    render(<Pagination filters={makeFilters({ page: 5, totalPages: 10 })} />);
    const ellipses = screen.getAllByText("…");
    expect(ellipses.length).toBeGreaterThanOrEqual(1);
  });

  it("includes correct aria-label on nav", () => {
    render(<Pagination filters={makeFilters({ page: 1, totalPages: 3 })} />);
    expect(screen.getByRole("navigation")).toHaveAttribute(
      "aria-label",
      "ניווט עמודים",
    );
  });
});
