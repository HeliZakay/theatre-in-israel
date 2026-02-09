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

  useEffect(() => {
    if (!isOpen) {
      setActiveIndex(-1);
      return;
    }
    if (activeIndex >= filteredItems.length) {
      setActiveIndex(filteredItems.length ? 0 : -1);
    }
  }, [isOpen, filteredItems.length, activeIndex]);

  const handleKeyDown = (event) => {
    if (!filteredItems.length) return;

    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        setIsOpen(true);
        setActiveIndex((prev) =>
          prev < filteredItems.length - 1 ? prev + 1 : 0,
        );
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        setIsOpen(true);
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : filteredItems.length - 1,
        );
        break;
      }
      case "Enter": {
        if (isOpen && activeIndex >= 0) {
          event.preventDefault();
          onSelect?.(filteredItems[activeIndex]);
          setIsOpen(false);
        }
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
    if (rootRef.current?.contains(event.relatedTarget)) {
      return;
    }
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
    setActiveIndex,
  };
}
