import { useEffect, useMemo, useRef, useState } from "react";

export function useCombobox({
  items = [],
  value = "",
  onSelect,
  listboxId = "combobox-listbox",
  maxItems = 8,
} = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef(null);

  const filteredItems = useMemo(() => {
    const unique = Array.from(new Set(items.filter(Boolean)));
    if (!value.trim()) {
      return unique.slice(0, maxItems);
    }
    const query = value.toLowerCase();
    return unique
      .filter((item) => item.toLowerCase().includes(query))
      .slice(0, maxItems);
  }, [items, value, maxItems]);

  // `filteredItems` is memoized to avoid recalculating the list on every
  // render unless the inputs change (items, value or maxItems).

  const queueActiveIndexUpdate = (nextIndex) => {
    Promise.resolve().then(() => setActiveIndex(nextIndex));
  };

  useEffect(() => {
    if (!isOpen) {
      // Only update when necessary to avoid unnecessary re-renders.
      if (activeIndex !== -1) queueActiveIndexUpdate(-1);
      return;
    }

    if (activeIndex >= filteredItems.length) {
      const nextIndex = filteredItems.length ? 0 : -1;
      if (activeIndex !== nextIndex) queueActiveIndexUpdate(nextIndex);
    }
  }, [isOpen, filteredItems.length, activeIndex]);

  const moveActiveIndex = (direction) => {
    setIsOpen(true);
    setActiveIndex((previousIndex) => {
      if (direction === "down") {
        return previousIndex < filteredItems.length - 1 ? previousIndex + 1 : 0;
      }
      return previousIndex > 0 ? previousIndex - 1 : filteredItems.length - 1;
    });
  };

  const selectActiveItem = () => {
    if (!isOpen || activeIndex < 0) return;
    onSelect?.(filteredItems[activeIndex]);
    setIsOpen(false);
  };

  const handleKeyDown = (event) => {
    if (!filteredItems.length) return;

    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        moveActiveIndex("down");
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        moveActiveIndex("up");
        break;
      }
      case "Enter": {
        if (!isOpen || activeIndex < 0) break;
        event.preventDefault();
        selectActiveItem();
        break;
      }
      case "Escape": {
        if (isOpen) {
          event.preventDefault();
          setIsOpen(false);
        }
        break;
      }
      default:
        break;
    }
  };

  const handleBlur = (event) => {
    if (rootRef.current?.contains(event.relatedTarget)) return;
    setIsOpen(false);
  };

  const selectItem = (item) => {
    onSelect?.(item);
    setIsOpen(false);
  };

  return {
    activeIndex,
    filteredItems,
    handleBlur,
    handleKeyDown,
    isOpen,
    listboxId,
    rootRef,
    selectItem,
    setIsOpen,
    // Expose `setActiveIndex` so callers (components) can update the
    // highlighted item on mouse hover for better UX.
    setActiveIndex,
  };
}
