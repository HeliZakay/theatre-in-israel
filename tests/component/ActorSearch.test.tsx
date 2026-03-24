import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockSelectItem = jest.fn();
const mockSetIsOpen = jest.fn();
const mockSetActiveIndex = jest.fn();
const mockHandleKeyDown = jest.fn();

jest.mock("@/hooks/useCombobox", () => ({
  useCombobox: jest.fn(() => ({
    activeIndex: -1,
    filteredItems: [],
    handleKeyDown: mockHandleKeyDown,
    isOpen: false,
    listboxId: "actor-suggestions",
    rootRef: { current: null },
    selectItem: mockSelectItem,
    setIsOpen: mockSetIsOpen,
    setActiveIndex: mockSetActiveIndex,
  })),
}));

import ActorSearch from "@/components/ActorSearch/ActorSearch";
import { useCombobox } from "@/hooks/useCombobox";

const baseProps = {
  names: ["אלי גורנשטיין", "אלון סנדלר"],
  value: "",
  onChange: jest.fn(),
};

describe("ActorSearch", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders combobox input", () => {
    render(<ActorSearch {...baseProps} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("hides clear button when value is empty", () => {
    render(<ActorSearch {...baseProps} />);
    expect(screen.queryByLabelText("נקה חיפוש")).not.toBeInTheDocument();
  });

  it("shows clear button when value is non-empty", () => {
    render(<ActorSearch {...baseProps} value="אלי" />);
    expect(screen.getByLabelText("נקה חיפוש")).toBeInTheDocument();
  });

  it("calls onChange with empty string when clear button clicked", async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(<ActorSearch {...baseProps} value="אלי" onChange={onChange} />);
    await user.click(screen.getByLabelText("נקה חיפוש"));
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("shows suggestion list when isOpen and value is non-empty", () => {
    jest.mocked(useCombobox).mockReturnValue({
      activeIndex: -1,
      filteredItems: ["אלי גורנשטיין"],
      handleKeyDown: mockHandleKeyDown,
      isOpen: true,
      listboxId: "actor-suggestions",
      rootRef: { current: null },
      selectItem: mockSelectItem,
      setIsOpen: mockSetIsOpen,
      setActiveIndex: mockSetActiveIndex,
    });
    render(<ActorSearch {...baseProps} value="אלי" />);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByRole("option")).toHaveTextContent("אלי גורנשטיין");
  });

  it("shows empty message when no results", () => {
    jest.mocked(useCombobox).mockReturnValue({
      activeIndex: -1,
      filteredItems: [],
      handleKeyDown: mockHandleKeyDown,
      isOpen: true,
      listboxId: "actor-suggestions",
      rootRef: { current: null },
      selectItem: mockSelectItem,
      setIsOpen: mockSetIsOpen,
      setActiveIndex: mockSetActiveIndex,
    });
    render(<ActorSearch {...baseProps} value="xyz" />);
    expect(screen.getByText("לא נמצאו שחקנים")).toBeInTheDocument();
  });
});
