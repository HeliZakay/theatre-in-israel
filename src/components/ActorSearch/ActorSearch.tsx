"use client";

import { useCombobox } from "@/hooks/useCombobox";
import styles from "./ActorSearch.module.css";

interface ActorSearchProps {
  names: string[];
  value: string;
  onChange: (value: string) => void;
}

export default function ActorSearch({
  names,
  value,
  onChange,
}: ActorSearchProps) {
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
    items: names,
    value,
    onSelect: (name) => onChange(name),
    listboxId: "actor-suggestions",
    maxItems: 10,
  });

  return (
    <div className={styles.root} ref={rootRef}>
      <div className={styles.shell}>
        <span className={styles.icon} aria-hidden>
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path
              d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm0-2a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11Zm8.2 4.6-4.2-4.2 1.4-1.4 4.2 4.2-1.4 1.4Z"
              fill="currentColor"
            />
          </svg>
        </span>

        <input
          type="search"
          dir="rtl"
          placeholder="חיפוש שחקן/ית..."
          className={styles.input}
          autoComplete="off"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-label="חיפוש שחקן"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={
            activeIndex >= 0 ? `actor-suggestion-${activeIndex}` : undefined
          }
        />

        {value && (
          <button
            type="button"
            className={styles.clear}
            onClick={() => onChange("")}
            aria-label="נקה חיפוש"
          >
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path
                d="M18.3 5.7a1 1 0 0 0-1.4 0L12 10.6 7.1 5.7a1 1 0 0 0-1.4 1.4L10.6 12l-4.9 4.9a1 1 0 1 0 1.4 1.4L12 13.4l4.9 4.9a1 1 0 0 0 1.4-1.4L13.4 12l4.9-4.9a1 1 0 0 0 0-1.4Z"
                fill="currentColor"
              />
            </svg>
          </button>
        )}
      </div>

      {isOpen && value.trim() && (
        <div className={styles.suggestions} id={listboxId} role="listbox">
          {filteredItems.length === 0 ? (
            <div className={styles.empty}>לא נמצאו שחקנים</div>
          ) : (
            filteredItems.map((name, index) => (
              <div
                key={name}
                id={`actor-suggestion-${index}`}
                className={`${styles.suggestion} ${
                  index === activeIndex ? styles.suggestionActive : ""
                }`}
                role="option"
                aria-selected={index === activeIndex}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectItem(name)}
              >
                {name}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
