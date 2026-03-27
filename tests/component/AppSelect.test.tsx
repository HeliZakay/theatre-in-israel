import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@radix-ui/react-select", () => {
  const Stub = ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  );
  return {
    Root: Stub,
    Trigger: Stub,
    Value: () => null,
    Icon: Stub,
    Content: Stub,
    Viewport: Stub,
    Item: Stub,
    ItemText: Stub,
  };
});

import AppSelect from "@/components/ui/AppSelect/AppSelect";

const options = [
  { value: "a", label: "Option A" },
  { value: "b", label: "Option B" },
];

describe("AppSelect", () => {
  it("renders native select with options", () => {
    render(<AppSelect options={options} />);
    const nativeSelect = screen.getAllByRole("combobox")[0];
    expect(nativeSelect).toBeInTheDocument();
    const nativeOptions = nativeSelect.querySelectorAll("option");
    const labels = Array.from(nativeOptions).map((o) => o.textContent);
    expect(labels).toContain("Option A");
    expect(labels).toContain("Option B");
  });

  it("renders placeholder as disabled option when value is empty", () => {
    render(<AppSelect options={options} placeholder="בחרו" value="" />);
    const placeholderOption = screen.getByText("בחרו");
    expect(placeholderOption).toBeDisabled();
  });

  it("calls onValueChange when native select changes", async () => {
    const onValueChange = jest.fn();
    const user = userEvent.setup();
    render(
      <AppSelect options={options} onValueChange={onValueChange} value="" />
    );
    const nativeSelect = screen.getAllByRole("combobox")[0];
    await user.selectOptions(nativeSelect, "a");
    expect(onValueChange).toHaveBeenCalledWith("a");
  });

  it("renders as disabled when disabled prop is true", () => {
    render(<AppSelect options={options} disabled />);
    const nativeSelect = screen.getAllByRole("combobox")[0];
    expect(nativeSelect).toBeDisabled();
  });

  it("sets required attribute", () => {
    render(<AppSelect options={options} required />);
    const nativeSelect = screen.getAllByRole("combobox")[0];
    expect(nativeSelect).toBeRequired();
  });

  it("applies ariaLabel to native select", () => {
    render(<AppSelect options={options} ariaLabel="בחירת סוג" />);
    const nativeSelect = screen.getByLabelText("בחירת סוג");
    expect(nativeSelect).toBeInTheDocument();
  });
});
