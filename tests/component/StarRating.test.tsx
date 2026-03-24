import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StarRating from "@/components/StarRating/StarRating";

function renderStars(
  props: Partial<React.ComponentProps<typeof StarRating>> = {},
) {
  const defaults = { value: null, onChange: jest.fn(), ...props };
  return { ...render(<StarRating {...defaults} />), onChange: defaults.onChange };
}

describe("StarRating", () => {
  it("renders 5 star radio buttons", () => {
    renderStars();
    expect(screen.getAllByRole("radio")).toHaveLength(5);
  });

  it("marks the selected star as aria-checked", () => {
    renderStars({ value: 3 });
    const radios = screen.getAllByRole("radio");
    expect(radios[2]).toHaveAttribute("aria-checked", "true");
    expect(radios[0]).toHaveAttribute("aria-checked", "false");
    expect(radios[4]).toHaveAttribute("aria-checked", "false");
  });

  it("calls onChange when a star is clicked", async () => {
    const user = userEvent.setup();
    const { onChange } = renderStars();

    await user.click(screen.getAllByRole("radio")[2]);
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("does not call onChange when disabled", async () => {
    const user = userEvent.setup();
    const { onChange } = renderStars({ disabled: true });

    await user.click(screen.getAllByRole("radio")[2]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("all buttons are disabled when disabled prop is true", () => {
    renderStars({ disabled: true });
    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toBeDisabled();
    }
  });

  it("sets tabIndex 0 on selected star, -1 on others", () => {
    renderStars({ value: 4 });
    const radios = screen.getAllByRole("radio");
    expect(radios[3]).toHaveAttribute("tabindex", "0");
    expect(radios[0]).toHaveAttribute("tabindex", "-1");
    expect(radios[4]).toHaveAttribute("tabindex", "-1");
  });

  it("sets tabIndex 0 on first star when value is null", () => {
    renderStars({ value: null });
    const radios = screen.getAllByRole("radio");
    expect(radios[0]).toHaveAttribute("tabindex", "0");
    expect(radios[1]).toHaveAttribute("tabindex", "-1");
  });

  it("has accessible labels on each star", () => {
    renderStars();
    expect(screen.getByLabelText("1 מתוך 5")).toBeInTheDocument();
    expect(screen.getByLabelText("5 מתוך 5")).toBeInTheDocument();
  });

  it("renders a radiogroup with the provided label", () => {
    renderStars({ label: "דירוג ההצגה" });
    expect(screen.getByRole("radiogroup")).toHaveAttribute(
      "aria-label",
      "דירוג ההצגה",
    );
  });

  it("uses default label when none provided", () => {
    renderStars();
    expect(screen.getByRole("radiogroup")).toHaveAttribute(
      "aria-label",
      "דירוג",
    );
  });
});
