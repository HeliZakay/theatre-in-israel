"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useCombobox } from "@/hooks/useCombobox";
import styles from "./ShowCombobox.module.css";
import type { SelectOption } from "@/types";

interface ShowComboboxProps {
  options?: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  id?: string;
  onBlur?: () => void;
}

export default function ShowCombobox({
  options = [],
  value = "",
  onValueChange,
  placeholder = "חפש.י הצגה…",
  id,
  onBlur,
}: ShowComboboxProps) {
  const labels = options.map((o) => o.label);

  // Derive the display text from the selected value.
  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";

  const [inputValue, setInputValue] = useState(selectedLabel);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep display in sync when value changes externally.
  useEffect(() => {
    setInputValue(selectedLabel);
  }, [selectedLabel]);

  const handleSelect = useCallback(
    (label: string) => {
      const match = options.find((o) => o.label === label);
      if (match) {
        onValueChange?.(match.value);
        setInputValue(match.label);
      }
    },
    [options, onValueChange],
  );

  const {
    activeIndex,
    filteredItems,
    handleBlur: comboboxBlur,
    handleKeyDown,
    isOpen,
    listboxId,
    rootRef,
    selectItem,
    setIsOpen,
    setActiveIndex,
  } = useCombobox({
    items: labels,
    value: inputValue,
    onSelect: handleSelect,
    listboxId: id ? `${id}-listbox` : "show-combobox-listbox",
    maxItems: 50,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setInputValue(next);
    setIsOpen(true);

    // If the user clears the input, clear the selection.
    if (!next.trim()) {
      onValueChange?.("");
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleItemClick = (item: string) => {
    selectItem(item);
  };

  const handleBlurWrapper = (e: React.FocusEvent) => {
    comboboxBlur(e);
    // If user typed something that doesn't match, revert to the selected label.
    if (!options.some((o) => o.label === inputValue)) {
      setInputValue(selectedLabel);
    }
    onBlur?.();
  };

  return (
    <div ref={rootRef} className={styles.root} onBlur={handleBlurWrapper}>
      <input
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={
          isOpen && activeIndex >= 0
            ? `${listboxId}-option-${activeIndex}`
            : undefined
        }
        className={styles.input}
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
      />

      {isOpen && (
        <ul id={listboxId} role="listbox" className={styles.listbox}>
          {filteredItems.length === 0 ? (
            <li className={styles.empty}>לא נמצאו תוצאות</li>
          ) : (
            filteredItems.map((item, index) => {
              const opt = options.find((o) => o.label === item);
              const isSelected = opt?.value === value;
              return (
                <li
                  key={item}
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  className={[
                    styles.option,
                    index === activeIndex ? styles.optionActive : "",
                    isSelected ? styles.optionSelected : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleItemClick(item);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  {item}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
