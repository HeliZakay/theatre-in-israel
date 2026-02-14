import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface UseComboboxOptions {
  items?: string[];
  value?: string;
  onSelect?: (item: string) => void;
  listboxId?: string;
  maxItems?: number;
}

export function useCombobox({
  items = [],
  value = "",
  onSelect,
  listboxId = "combobox-listbox",
  maxItems = 8,
}: UseComboboxOptions = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);

  /* ── close on tap / click outside ── */
  useEffect(() => {
    if (!isOpen) return;

    const onPointerOutside = (e: PointerEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setIsOpen(false);
    };

    // Use pointerdown so it fires for both mouse and touch before any
    // focus / blur shenanigans.
    document.addEventListener("pointerdown", onPointerOutside, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerOutside, true);
    };
  }, [isOpen]);

  /* ── filtered list ── */
  const filteredItems = useMemo(() => {
    const unique = Array.from(new Set(items.filter(Boolean)));
    if (!value.trim()) return unique.slice(0, maxItems);
    const query = value.toLowerCase();
    return unique
      .filter((item) => item.toLowerCase().includes(query))
      .slice(0, maxItems);
  }, [items, value, maxItems]);

  /* ── keep activeIndex in bounds ── */
  useEffect(() => {
    if (!isOpen) {
      setActiveIndex(-1);
      return;
    }
    if (activeIndex >= filteredItems.length) {
      setActiveIndex(filteredItems.length ? 0 : -1);
    }
  }, [isOpen, filteredItems.length, activeIndex]);

  /* ── keyboard helpers ── */
  const moveActiveIndex = (direction: "up" | "down") => {
    setIsOpen(true);
    setActiveIndex((prev) => {
      if (direction === "down") {
        return prev < filteredItems.length - 1 ? prev + 1 : 0;
      }
      return prev > 0 ? prev - 1 : filteredItems.length - 1;
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!filteredItems.length) return;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        moveActiveIndex("down");
        break;
      case "ArrowUp":
        event.preventDefault();
        moveActiveIndex("up");
        break;
      case "Enter":
        if (!isOpen || activeIndex < 0) break;
        event.preventDefault();
        onSelect?.(filteredItems[activeIndex]);
        setIsOpen(false);
        break;
      case "Escape":
        if (isOpen) {
          event.preventDefault();
          setIsOpen(false);
        }
        break;
      default:
        break;
    }
  };

  /* ── item selection (mouse / touch) ── */
  const selectItem = useCallback(
    (item: string) => {
      onSelect?.(item);
      setIsOpen(false);
    },
    [onSelect],
  );

  return {
    activeIndex,
    filteredItems,
    handleKeyDown,
    isOpen,
    listboxId,
    rootRef,
    selectItem,
    setIsOpen,
    setActiveIndex,
  };
}
