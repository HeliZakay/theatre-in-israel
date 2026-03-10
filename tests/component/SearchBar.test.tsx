import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchBar from "@/components/SearchBar/SearchBar";

const SUGGESTIONS = {
  shows: ["המלט", "קברט", "שיכור"],
  theatres: ["הבימה", "קאמרי"],
  genres: ["דרמה", "קומדיה", "מחזמר"],
};

function renderSearchBar(
  props: Partial<React.ComponentProps<typeof SearchBar>> = {},
) {
  return render(<SearchBar suggestions={SUGGESTIONS} {...props} />);
}

describe("SearchBar", () => {
  it("renders with search role", () => {
    renderSearchBar();
    expect(screen.getByRole("search")).toBeInTheDocument();
  });

  it("renders a search input", () => {
    renderSearchBar();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("renders a submit button", () => {
    renderSearchBar();
    expect(
      screen.getByRole("button", { name: "חפש.י הצגה" }),
    ).toBeInTheDocument();
  });

  it("opens suggestions on focus", async () => {
    const user = userEvent.setup();
    renderSearchBar();

    const input = screen.getByRole("combobox");
    await user.click(input);

    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("shows all suggestions when query is empty", async () => {
    const user = userEvent.setup();
    renderSearchBar();

    const input = screen.getByRole("combobox");
    await user.click(input);

    // All items from all categories
    const options = screen.getAllByRole("option");
    const totalItems =
      SUGGESTIONS.shows.length +
      SUGGESTIONS.theatres.length +
      SUGGESTIONS.genres.length;
    expect(options).toHaveLength(totalItems);
  });

  it("filters suggestions based on input", async () => {
    const user = userEvent.setup();
    renderSearchBar();

    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.type(input, "קב");

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("קברט");
  });

  it("shows empty message when no results match", async () => {
    const user = userEvent.setup();
    renderSearchBar();

    const input = screen.getByRole("combobox");
    await user.type(input, "nothing_matches");

    expect(screen.getByText("לא נמצאו תוצאות")).toBeInTheDocument();
  });

  it("displays category group headers", async () => {
    const user = userEvent.setup();
    renderSearchBar();

    const input = screen.getByRole("combobox");
    await user.click(input);

    expect(screen.getByText("הצגות")).toBeInTheDocument();
    expect(screen.getByText("תיאטראות")).toBeInTheDocument();
    expect(screen.getByText("ז'אנרים")).toBeInTheDocument();
  });

  it("selects a suggestion into the input", async () => {
    const user = userEvent.setup();
    renderSearchBar();

    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.click(screen.getByText("הבימה"));

    expect(input).toHaveValue("הבימה");
  });

  it("has correct form action", () => {
    renderSearchBar();
    const form = screen.getByRole("search");
    expect(form).toHaveAttribute("action", "/shows#results");
  });

  it("input name is 'query' for form submission", () => {
    renderSearchBar();
    const input = screen.getByRole("combobox");
    expect(input).toHaveAttribute("name", "query");
  });

  it("renders with default empty suggestions", () => {
    render(<SearchBar />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("navigates suggestions with keyboard", async () => {
    const user = userEvent.setup();
    renderSearchBar();

    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");

    // Second item is "קברט"
    expect(input).toHaveValue("קברט");
  });

  // ── Branch coverage improvements ──

  it("uses shorter placeholder on mobile", () => {
    // Override matchMedia to return matches: true (mobile)
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    renderSearchBar();

    const input = screen.getByPlaceholderText("חפש.י הצגה או ז׳אנר");
    expect(input).toBeInTheDocument();

    // On mobile there is no combobox role
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();

    // Restore
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  it("handles suggestions with missing category keys", async () => {
    const user = userEvent.setup();
    render(<SearchBar suggestions={{ shows: ["המלט"] } as any} />);

    const input = screen.getByRole("combobox");
    await user.click(input);

    // Should show the one available item without crashing
    expect(screen.getByRole("option")).toHaveTextContent("המלט");
  });

  it("handles empty suggestions object", async () => {
    const user = userEvent.setup();
    render(<SearchBar suggestions={{} as any} />);

    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.type(input, "test");

    expect(screen.getByText("לא נמצאו תוצאות")).toBeInTheDocument();
  });
});
