"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useCombobox } from "@/hooks/useCombobox";
import styles from "./CityCombobox.module.css";
import { cx } from "@/utils/cx";

interface CityOption {
  value: string;
  label: string;
}

interface CityComboboxProps {
  options: CityOption[];
  value: string;
  onValueChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
  id?: string;
  ariaLabel?: string;
}

export default function CityCombobox({
  options,
  value,
  onValueChange,
  onClear,
  placeholder = "חפשו עיר…",
  id,
  ariaLabel,
}: CityComboboxProps) {
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
        onValueChange(match.value);
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
  } = useCombobox<HTMLDivElement>({
    items: labels,
    value: inputValue,
    onSelect: handleSelect,
    listboxId: id ? `${id}-listbox` : "city-combobox-listbox",
    maxItems: 50,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsOpen(true);
  };

  const handleItemTap = useCallback(
    (item: string) => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      selectItem(item);
      inputRef.current?.blur();
    },
    [selectItem],
  );

  const handleClear = useCallback(() => {
    setInputValue("");
    onClear();
    inputRef.current?.focus();
    setIsOpen(true);
  }, [onClear, setIsOpen]);

  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      if (rootRef.current?.contains(e.relatedTarget)) return;
      if (!options.some((o) => o.label === inputValue)) {
        setInputValue(selectedLabel);
      }
    },
    [inputValue, options, selectedLabel, rootRef],
  );

  const hasValue = inputValue.length > 0;

  return (
    <div ref={rootRef} className={styles.root} onBlur={handleBlur}>
      <span className={styles.searchIcon} aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 16 16">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            d="M10.5 10.5L14 14M7 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"
          />
        </svg>
      </span>
      <input
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        aria-activedescendant={
          isOpen && activeIndex >= 0
            ? `${listboxId}-option-${activeIndex}`
            : undefined
        }
        className={styles.input}
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
      />
      {hasValue && (
        <button
          type="button"
          className={styles.clearBtn}
          onClick={handleClear}
          aria-label="נקו בחירת עיר"
        >
          ✕
        </button>
      )}

      {isOpen && (
        <ul
          id={listboxId}
          role="listbox"
          className={styles.listbox}
          onPointerDown={(e) => e.preventDefault()}
        >
          {filteredItems.length === 0 ? (
            <li className={styles.empty}>לא נמצאה עיר תואמת</li>
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
                  className={cx(
                    styles.option,
                    index === activeIndex && styles.optionActive,
                    isSelected && styles.optionSelected,
                  )}
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
