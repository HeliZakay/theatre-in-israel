import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ShowCombobox from "@/components/ShowCombobox/ShowCombobox";

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
