import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ShowCombobox from "@/components/ShowCombobox/ShowCombobox";

/* ── Mock useMediaQuery so desktop tests keep the inline dropdown ── */
const mockUseMediaQuery = jest.fn(() => false);
jest.mock("@/hooks/useMediaQuery", () => ({
  useMediaQuery: (...args: unknown[]) => mockUseMediaQuery(...args),
}));

const OPTIONS = [
  { value: "1", label: "המלט" },
  { value: "2", label: "קברט" },
  { value: "3", label: "שיכור" },
  { value: "4", label: "קזבלן" },
  { value: "5", label: "המכתש" },
];

function renderCombobox(
  props: Partial<React.ComponentProps<typeof ShowCombobox>> = {},
) {
  const onValueChange = jest.fn();
  const onBlur = jest.fn();
  const result = render(
    <ShowCombobox
      options={OPTIONS}
      value=""
      onValueChange={onValueChange}
      onBlur={onBlur}
      placeholder="חפש.י הצגה…"
      id="test-combobox"
      {...props}
    />,
  );
  return { ...result, onValueChange, onBlur };
}

describe("ShowCombobox", () => {
  it("renders with the combobox role", () => {
    renderCombobox();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("shows placeholder text", () => {
    renderCombobox();
    expect(screen.getByPlaceholderText("חפש.י הצגה…")).toBeInTheDocument();
  });

  it("opens listbox on focus and shows all options", async () => {
    const user = userEvent.setup();
    renderCombobox();

    const input = screen.getByRole("combobox");
    await user.click(input);

    const listbox = screen.getByRole("listbox");
    expect(listbox).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(OPTIONS.length);
  });

  it("filters options when typing", async () => {
    const user = userEvent.setup();
    renderCombobox();

    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.type(input, "קב");

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("קברט");
  });

  it("shows empty message when no match", async () => {
    const user = userEvent.setup();
    renderCombobox();

    const input = screen.getByRole("combobox");
    await user.type(input, "xyz123");

    expect(screen.getByText("לא נמצאו תוצאות")).toBeInTheDocument();
  });

  it("calls onValueChange when selecting an option by click", async () => {
    const user = userEvent.setup();
    const { onValueChange } = renderCombobox();

    const input = screen.getByRole("combobox");
    await user.click(input);

    const option = screen.getByText("קזבלן");
    await user.click(option);

    expect(onValueChange).toHaveBeenCalledWith("4");
  });

  it("selects option with keyboard (ArrowDown + Enter)", async () => {
    const user = userEvent.setup();
    const { onValueChange } = renderCombobox();

    const input = screen.getByRole("combobox");
    await user.click(input);
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");

    // ArrowDown twice → second option (קברט, index 1)
    expect(onValueChange).toHaveBeenCalledWith("2");
  });

  it("closes listbox on Escape", async () => {
    const user = userEvent.setup();
    renderCombobox();

    const input = screen.getByRole("combobox");
    await user.click(input);
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("sets aria-expanded correctly", async () => {
    const user = userEvent.setup();
    renderCombobox();

    const input = screen.getByRole("combobox");
    expect(input).toHaveAttribute("aria-expanded", "false");

    await user.click(input);
    expect(input).toHaveAttribute("aria-expanded", "true");
  });

  it("marks aria-invalid when invalid prop is true", () => {
    renderCombobox({ invalid: true });
    expect(screen.getByRole("combobox")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("displays the selected option label when value is provided", () => {
    renderCombobox({ value: "3" });
    expect(screen.getByRole("combobox")).toHaveValue("שיכור");
  });

  it("clears value when input is cleared", async () => {
    const user = userEvent.setup();
    const { onValueChange } = renderCombobox({ value: "1" });

    const input = screen.getByRole("combobox");
    await user.clear(input);

    expect(onValueChange).toHaveBeenCalledWith("");
  });

  // ── Branch coverage improvements ──

  it("renders with all default props", () => {
    render(<ShowCombobox />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("חפש.י הצגה…")).toBeInTheDocument();
  });

  it("renders without id and uses default listbox id", async () => {
    const user = userEvent.setup();
    render(
      <ShowCombobox
        options={OPTIONS}
        value=""
        onValueChange={jest.fn()}
        onBlur={jest.fn()}
      />,
    );

    const input = screen.getByRole("combobox");
    await user.click(input);

    const listbox = screen.getByRole("listbox");
    expect(listbox).toHaveAttribute("id", "show-combobox-listbox");
  });

  it("selects an option without onValueChange provided", async () => {
    const user = userEvent.setup();
    render(<ShowCombobox options={OPTIONS} value="" />);

    const input = screen.getByRole("combobox");
    await user.click(input);

    // Should not throw when clicking an option without onValueChange
    await user.click(screen.getByText("קזבלן"));
  });

  it("reverts input text on blur when it does not match any option", async () => {
    const user = userEvent.setup();
    const onBlur = jest.fn();
    const { container } = render(
      <div>
        <ShowCombobox
          options={OPTIONS}
          value="1"
          onValueChange={jest.fn()}
          onBlur={onBlur}
        />
        <button>outside</button>
      </div>,
    );

    const input = screen.getByRole("combobox");
    await user.clear(input);
    await user.type(input, "nonexistent");

    // Click outside to trigger blur
    await user.click(screen.getByText("outside"));

    // Input should revert to the selected option's label
    expect(input).toHaveValue("המלט");
    expect(onBlur).toHaveBeenCalled();
  });
});

/* ── Mobile bottom-sheet variant ── */

describe("ShowCombobox (mobile)", () => {
  beforeEach(() => {
    mockUseMediaQuery.mockReturnValue(true);
  });

  afterEach(() => {
    mockUseMediaQuery.mockReturnValue(false);
  });

  it("renders a trigger button instead of a combobox input", () => {
    render(
      <ShowCombobox
        options={OPTIONS}
        value=""
        onValueChange={jest.fn()}
        placeholder="חפש.י הצגה…"
      />,
    );
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    const trigger = screen.getByRole("button", { name: /חפש.י הצגה…/ });
    expect(trigger).toBeInTheDocument();
  });

  it("shows the selected option label in the trigger", () => {
    render(
      <ShowCombobox options={OPTIONS} value="3" onValueChange={jest.fn()} />,
    );
    expect(screen.getByRole("button")).toHaveTextContent("שיכור");
  });

  it("opens a dialog sheet when trigger is tapped", async () => {
    const user = userEvent.setup();
    render(
      <ShowCombobox options={OPTIONS} value="" onValueChange={jest.fn()} />,
    );

    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(OPTIONS.length);
  });

  it("filters options via the search input inside the sheet", async () => {
    const user = userEvent.setup();
    render(
      <ShowCombobox options={OPTIONS} value="" onValueChange={jest.fn()} />,
    );

    await user.click(screen.getByRole("button"));
    const searchInput = screen.getByPlaceholderText("חפש.י הצגה…");
    await user.type(searchInput, "קב");

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("קברט");
  });

  it("calls onValueChange and closes sheet on option tap", async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    render(
      <ShowCombobox options={OPTIONS} value="" onValueChange={onValueChange} />,
    );

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByText("קזבלן"));

    expect(onValueChange).toHaveBeenCalledWith("4");
    // Dialog should close after selection
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows empty message when no match in sheet", async () => {
    const user = userEvent.setup();
    render(
      <ShowCombobox options={OPTIONS} value="" onValueChange={jest.fn()} />,
    );

    await user.click(screen.getByRole("button"));
    const searchInput = screen.getByPlaceholderText("חפש.י הצגה…");
    await user.type(searchInput, "xyz123");

    expect(screen.getByText("לא נמצאו תוצאות")).toBeInTheDocument();
  });

  it("marks aria-invalid on trigger when invalid", () => {
    render(
      <ShowCombobox
        options={OPTIONS}
        value=""
        onValueChange={jest.fn()}
        invalid
      />,
    );
    expect(screen.getByRole("button")).toHaveAttribute("aria-invalid", "true");
  });
});
