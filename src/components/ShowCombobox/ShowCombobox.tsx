"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useCombobox } from "@/hooks/useCombobox";
import styles from "./ShowCombobox.module.css";
import { cx } from "@/utils/cx";
import type { SelectOption } from "@/types";

interface ShowComboboxProps {
  options?: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  id?: string;
  onBlur?: () => void;
  invalid?: boolean;
  ariaDescribedBy?: string;
}

export default function ShowCombobox({
  options = [],
  value = "",
  onValueChange,
  placeholder = "חפש.י הצגה…",
  id,
  onBlur,
  invalid = false,
  ariaDescribedBy,
}: ShowComboboxProps) {
  const labels = options.map((o) => o.label);
  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";
  const [inputValue, setInputValue] = useState(selectedLabel);
  const inputRef = useRef<HTMLInputElement>(null);

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
    if (!next.trim()) {
      onValueChange?.("");
    }
  };

  const handleItemTap = useCallback(
    (item: string) => (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      selectItem(item);
      inputRef.current?.focus();
    },
    [selectItem],
  );

  /** Revert text on blur if it doesn't match any option. */
  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      // Stay open if focus moved within the combobox root.
      if (rootRef.current?.contains(e.relatedTarget)) return;
      if (!options.some((o) => o.label === inputValue)) {
        setInputValue(selectedLabel);
      }
      onBlur?.();
    },
    [inputValue, options, selectedLabel, onBlur, rootRef],
  );

  return (
    <div ref={rootRef} className={styles.root} onBlur={handleBlur}>
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
        className={cx(styles.input, invalid && styles.inputInvalid)}
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        aria-invalid={invalid}
        aria-describedby={ariaDescribedBy}
      />

      {isOpen && (
        <ul
          id={listboxId}
          role="listbox"
          className={styles.listbox}
          onMouseDown={(e) => e.preventDefault()}
        >
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
                  onTouchEnd={handleItemTap(item)}
                  onClick={handleItemTap(item)}
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
