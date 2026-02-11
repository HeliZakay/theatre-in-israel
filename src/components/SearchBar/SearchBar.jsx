"use client";

import { Fragment, useState, useRef, useMemo } from "react";
import Button from "../Button/Button";
import styles from "./SearchBar.module.css";
import { useCombobox } from "@/hooks/useCombobox";
import ROUTES from "@/constants/routes";

const CATEGORIES = [
  { key: "shows", label: "הצגות" },
  { key: "theatres", label: "תיאטראות" },
  { key: "genres", label: "ז'אנרים" },
];

export default function SearchBar({ suggestions = {} }) {
  const [value, setValue] = useState("");
  const inputRef = useRef(null);

  // Build a flat, category-ordered list for the combobox hook.
  const allItems = useMemo(
    () => [
      ...(suggestions.shows || []),
      ...(suggestions.theatres || []),
      ...(suggestions.genres || []),
    ],
    [suggestions],
  );

  // Map each suggestion to its category for rendering group headers.
  const categoryLookup = useMemo(() => {
    const lookup = new Map();
    for (const cat of CATEGORIES) {
      for (const item of suggestions[cat.key] || []) {
        if (!lookup.has(item)) lookup.set(item, cat.key);
      }
    }
    return lookup;
  }, [suggestions]);

  const {
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
  } = useCombobox({
    items: allItems,
    value,
    onSelect: (item) => setValue(item),
    listboxId: "shows-suggestions",
    maxItems: 50,
  });

  return (
    <form
      className={styles.search}
      role="search"
      aria-label="חיפוש הצגות"
      action={ROUTES.SHOWS}
      method="get"
    >
      <label className={styles.srOnly} htmlFor="q">
        חיפוש
      </label>

      <div className={styles.searchShell} ref={rootRef} onBlur={handleBlur}>
        <span className={styles.searchIcon} aria-hidden>
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path
              d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm0-2a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11Zm8.2 4.6-4.2-4.2 1.4-1.4 4.2 4.2-1.4 1.4Z"
              fill="currentColor"
            />
          </svg>
        </span>

        <input
          id="q"
          type="search"
          dir="rtl"
          placeholder="חפש.י הצגה, תיאטרון או ז'אנר..."
          className={styles.searchInput}
          autoComplete="off"
          name="query"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setIsOpen(true);
          }}
          ref={inputRef}
          aria-haspopup="listbox"
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={
            activeIndex >= 0 ? `shows-suggestion-${activeIndex}` : undefined
          }
        />

        {isOpen && (
          <div className={styles.suggestions} id={listboxId} role="listbox">
            {filteredItems.length === 0 ? (
              <div className={styles.empty}>לא נמצאו תוצאות</div>
            ) : (
              filteredItems.map((item, index) => {
                const cat = categoryLookup.get(item);
                const prevCat =
                  index > 0
                    ? categoryLookup.get(filteredItems[index - 1])
                    : null;
                const showHeader = cat !== prevCat;
                const catLabel = CATEGORIES.find((c) => c.key === cat)?.label;

                return (
                  <Fragment key={item}>
                    {showHeader && (
                      <div className={styles.groupHeader} role="presentation">
                        {catLabel}
                      </div>
                    )}
                    <button
                      type="button"
                      id={`shows-suggestion-${index}`}
                      className={`${styles.suggestion} ${
                        index === activeIndex ? styles.suggestionActive : ""
                      }`}
                      role="option"
                      aria-selected={index === activeIndex}
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => {
                        setValue(item);
                        setIsOpen(false);
                        inputRef.current?.focus();
                      }}
                    >
                      {item}
                    </button>
                  </Fragment>
                );
              })
            )}
          </div>
        )}

        <Button type="submit">לחפש הצגה</Button>
      </div>
    </form>
  );
}
