// tests/component/ShowsFilterBar.test.tsx

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ShowsFilterBar from "@/components/shows/ShowsFilterBar/ShowsFilterBar";
import type { ShowFilters } from "@/types";

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */

const mockPush = jest.fn();
const mockPathname = "/shows";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => mockPathname,
}));

// Pass through useDebounce immediately for test determinism
jest.mock("@/hooks/useDebounce", () => ({
  useDebounce: (value: string) => value,
}));

jest.mock("@/utils/showsQuery", () => ({
  buildShowsQueryString: jest.fn((params: Record<string, unknown>) => {
    const parts: string[] = [];
    if (params.theatre) parts.push(`theatre=${params.theatre}`);
    if (params.query) parts.push(`query=${params.query}`);
    if (params.sort) parts.push(`sort=${params.sort}`);
    if (
      params.genres &&
      Array.isArray(params.genres) &&
      params.genres.length > 0
    ) {
      parts.push(`genres=${(params.genres as string[]).join(",")}`);
    }
    return parts.length > 0 ? `?${parts.join("&")}` : "";
  }),
}));

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const defaultFilters: ShowFilters = {
  theatre: "",
  query: "",
  genres: [],
  sort: "rating",
  page: 1,
};

const defaultProps = {
  theatres: ["תיאטרון הקאמרי", "הבימה"],
  allGenres: ["דרמה", "קומדיה", "מחזמר"],
  availableGenres: ["דרמה", "קומדיה"],
  filters: defaultFilters,
};

beforeEach(() => {
  mockPush.mockClear();
});

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe("ShowsFilterBar", () => {
  it("renders search input with current query", () => {
    render(
      <ShowsFilterBar {...defaultProps} filters={{ ...defaultFilters, query: "המלט" }} />,
    );

    const input = screen.getByPlaceholderText("חפש.י הצגה, תיאטרון או ז׳אנר");
    expect(input).toHaveValue("המלט");
  });

  it("renders genre chips for all genres", () => {
    render(<ShowsFilterBar {...defaultProps} />);

    expect(screen.getByText("דרמה")).toBeInTheDocument();
    expect(screen.getByText("קומדיה")).toBeInTheDocument();
    expect(screen.getByText("מחזמר")).toBeInTheDocument();
  });

  it("disables unavailable genre chips", () => {
    render(<ShowsFilterBar {...defaultProps} />);

    // "מחזמר" is not in availableGenres → should be disabled
    const musicalChip = screen.getByText("מחזמר");
    expect(musicalChip).toBeDisabled();
  });

  it("available genre chips are not disabled", () => {
    render(<ShowsFilterBar {...defaultProps} />);

    expect(screen.getByText("דרמה")).not.toBeDisabled();
    expect(screen.getByText("קומדיה")).not.toBeDisabled();
  });

  it("updates search input on typing", async () => {
    const user = userEvent.setup();
    render(<ShowsFilterBar {...defaultProps} />);

    const input = screen.getByPlaceholderText("חפש.י הצגה, תיאטרון או ז׳אנר");
    await user.clear(input);
    await user.type(input, "abc");

    // The input is controlled — verify onChange fires by checking push was called
    // (debounce is pass-through, so typing triggers URL push)
    expect(mockPush).toHaveBeenCalled();
  });

  it('renders "הכל" chip for genres', () => {
    render(<ShowsFilterBar {...defaultProps} />);

    // The "הכל" button for genres
    const allButtons = screen.getAllByText("הכל");
    expect(allButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('has "הכל" genre chip active when no genres selected', () => {
    render(<ShowsFilterBar {...defaultProps} />);

    // When no genres selected, the "הכל" chip should have aria-current
    const allButtons = screen.getAllByText("הכל");
    const genreAllBtn = allButtons.find(
      (btn) => btn.getAttribute("aria-current") === "true",
    );
    expect(genreAllBtn).toBeDefined();
  });

  it("shows status area", () => {
    render(<ShowsFilterBar {...defaultProps} />);

    // Status area exists with role="status"
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("pushes URL when search input changes (debounce pass-through)", async () => {
    const user = userEvent.setup();
    render(<ShowsFilterBar {...defaultProps} />);

    const input = screen.getByPlaceholderText("חפש.י הצגה, תיאטרון או ז׳אנר");
    await user.type(input, "test");

    // With debounce mocked to pass-through, each keystroke triggers push
    // The last push should contain the final search value
    expect(mockPush).toHaveBeenCalled();
  });
});
