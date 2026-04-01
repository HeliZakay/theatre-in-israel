import { renderHook, act } from "@testing-library/react";
import { useCombobox } from "@/hooks/useCombobox";

describe("useCombobox", () => {
  it("starts closed with activeIndex -1", () => {
    const { result } = renderHook(() =>
      useCombobox({ items: ["a", "b", "c"] }),
    );
    expect(result.current.isOpen).toBe(false);
    expect(result.current.activeIndex).toBe(-1);
  });

  it("returns all items (up to maxItems) when value is empty", () => {
    const { result } = renderHook(() =>
      useCombobox({ items: ["a", "b", "c"], value: "" }),
    );
    expect(result.current.filteredItems).toEqual(["a", "b", "c"]);
  });

  it("filters items case-insensitively", () => {
    const { result } = renderHook(() =>
      useCombobox({ items: ["Apple", "Banana", "Apricot"], value: "ap" }),
    );
    expect(result.current.filteredItems).toEqual(["Apple", "Apricot"]);
  });

  it("matches items when query uses Hebrew geresh instead of ASCII apostrophe", () => {
    const { result } = renderHook(() =>
      useCombobox({ items: ["צ'ילבות", "המלט"], value: "צ\u05F3ילבות" }),
    );
    expect(result.current.filteredItems).toEqual(["צ'ילבות"]);
  });

  it("deduplicates items", () => {
    const { result } = renderHook(() =>
      useCombobox({ items: ["a", "b", "a", "b", "c"], value: "" }),
    );
    expect(result.current.filteredItems).toEqual(["a", "b", "c"]);
  });

  it("excludes falsy/empty items", () => {
    const { result } = renderHook(() =>
      useCombobox({ items: ["a", "", "b", ""], value: "" }),
    );
    expect(result.current.filteredItems).toEqual(["a", "b"]);
  });

  it("limits results to maxItems", () => {
    const items = Array.from({ length: 20 }, (_, i) => `item-${i}`);
    const { result } = renderHook(() =>
      useCombobox({ items, value: "", maxItems: 3 }),
    );
    expect(result.current.filteredItems).toHaveLength(3);
  });

  it("ArrowDown opens the listbox and moves activeIndex forward", () => {
    const { result } = renderHook(() =>
      useCombobox({ items: ["a", "b", "c"] }),
    );

    act(() => {
      result.current.handleKeyDown({
        key: "ArrowDown",
        preventDefault: jest.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.activeIndex).toBe(0);
  });

  it("ArrowDown wraps around at the end", () => {
    const { result } = renderHook(() =>
      useCombobox({ items: ["a", "b"], value: "" }),
    );

    // Move to index 0
    act(() => {
      result.current.handleKeyDown({
        key: "ArrowDown",
        preventDefault: jest.fn(),
      } as unknown as React.KeyboardEvent);
    });
    // Move to index 1
    act(() => {
      result.current.handleKeyDown({
        key: "ArrowDown",
        preventDefault: jest.fn(),
      } as unknown as React.KeyboardEvent);
    });
    // Wrap to index 0
    act(() => {
      result.current.handleKeyDown({
        key: "ArrowDown",
        preventDefault: jest.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(result.current.activeIndex).toBe(0);
  });

  it("ArrowUp moves activeIndex backward and wraps to the last item", () => {
    const { result } = renderHook(() =>
      useCombobox({ items: ["a", "b", "c"], value: "" }),
    );

    // ArrowUp from -1 wraps to last
    act(() => {
      result.current.handleKeyDown({
        key: "ArrowUp",
        preventDefault: jest.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.activeIndex).toBe(2);
  });

  it("Enter selects the active item and closes", () => {
    const onSelect = jest.fn();
    const { result } = renderHook(() =>
      useCombobox({ items: ["a", "b", "c"], value: "", onSelect }),
    );

    // Open and go to first item
    act(() => {
      result.current.handleKeyDown({
        key: "ArrowDown",
        preventDefault: jest.fn(),
      } as unknown as React.KeyboardEvent);
    });

    // Press Enter
    act(() => {
      result.current.handleKeyDown({
        key: "Enter",
        preventDefault: jest.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(onSelect).toHaveBeenCalledWith("a");
    expect(result.current.isOpen).toBe(false);
    expect(result.current.activeIndex).toBe(-1);
  });

  it("Enter does nothing when listbox is closed", () => {
    const onSelect = jest.fn();
    const { result } = renderHook(() =>
      useCombobox({ items: ["a", "b"], value: "", onSelect }),
    );

    act(() => {
      result.current.handleKeyDown({
        key: "Enter",
        preventDefault: jest.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("Escape closes the listbox and resets activeIndex", () => {
    const { result } = renderHook(() =>
      useCombobox({ items: ["a", "b"], value: "" }),
    );

    // Open
    act(() => {
      result.current.setIsOpen(true);
      result.current.setActiveIndex(1);
    });

    act(() => {
      result.current.handleKeyDown({
        key: "Escape",
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.activeIndex).toBe(-1);
  });

  it("selectItem calls onSelect and closes", () => {
    const onSelect = jest.fn();
    const { result } = renderHook(() =>
      useCombobox({ items: ["a", "b"], value: "", onSelect }),
    );

    act(() => {
      result.current.setIsOpen(true);
    });

    act(() => {
      result.current.selectItem("b");
    });

    expect(onSelect).toHaveBeenCalledWith("b");
    expect(result.current.isOpen).toBe(false);
  });

  it("outside pointerdown closes the listbox when open", () => {
    const { result } = renderHook(() =>
      useCombobox({ items: ["a", "b"], value: "" }),
    );

    act(() => {
      result.current.setIsOpen(true);
    });

    // Simulate pointerdown outside
    act(() => {
      const event = new Event("pointerdown", { bubbles: true });
      document.dispatchEvent(event);
    });

    expect(result.current.isOpen).toBe(false);
  });

  it("resolvedActiveIndex returns -1 when closed", () => {
    const { result } = renderHook(() =>
      useCombobox({ items: ["a", "b"], value: "" }),
    );

    // Force activeIndex but keep closed
    act(() => {
      result.current.setActiveIndex(0);
    });

    expect(result.current.activeIndex).toBe(-1);
  });

  it("handleKeyDown does nothing when filteredItems is empty", () => {
    const onSelect = jest.fn();
    const { result } = renderHook(() =>
      useCombobox({ items: ["a"], value: "xyz", onSelect }),
    );

    act(() => {
      result.current.handleKeyDown({
        key: "ArrowDown",
        preventDefault: jest.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(result.current.isOpen).toBe(false);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("works with default options (no args)", () => {
    const { result } = renderHook(() => useCombobox());
    expect(result.current.filteredItems).toEqual([]);
    expect(result.current.isOpen).toBe(false);
    expect(result.current.listboxId).toBe("combobox-listbox");
  });

  it("uses custom listboxId", () => {
    const { result } = renderHook(() =>
      useCombobox({ listboxId: "my-listbox" }),
    );
    expect(result.current.listboxId).toBe("my-listbox");
  });
});
