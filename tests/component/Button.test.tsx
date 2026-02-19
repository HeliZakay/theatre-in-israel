import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Button from "@/components/Button/Button";

describe("Button", () => {
  it("renders as a button element by default", () => {
    render(<Button>לחצו כאן</Button>);
    expect(
      screen.getByRole("button", { name: "לחצו כאן" }),
    ).toBeInTheDocument();
  });

  it("renders as a link when href is provided", () => {
    render(<Button href="/shows">כל ההצגות</Button>);
    const link = screen.getByRole("link", { name: "כל ההצגות" });
    expect(link).toHaveAttribute("href", "/shows");
  });

  it("renders as disabled span with href when disabled", () => {
    render(
      <Button href="/shows" disabled>
        לא זמין
      </Button>,
    );
    const el = screen.getByText("לא זמין");
    expect(el).toHaveAttribute("aria-disabled", "true");
    expect(el.tagName).not.toBe("A");
  });

  it("disables the button element when disabled prop is true", () => {
    render(<Button disabled>לחצו כאן</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("sets type attribute", () => {
    render(<Button type="submit">שלח</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("fires onClick handler", async () => {
    const onClick = jest.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>לחצו</Button>);

    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("passes aria-label", () => {
    render(<Button aria-label="סגור">X</Button>);
    expect(screen.getByRole("button", { name: "סגור" })).toBeInTheDocument();
  });
});
