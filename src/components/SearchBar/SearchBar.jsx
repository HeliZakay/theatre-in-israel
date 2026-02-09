"use client";

import { useState } from "react";
import Button from "../Button/Button";
import styles from "./SearchBar.module.css";
import { useCombobox } from "@/hooks/useCombobox";

export default function SearchBar({ suggestions = [] }) {
  const [value, setValue] = useState("");
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
  } = useCombobox({
    items: suggestions,
    value,
    onSelect: (item) => setValue(item),
    listboxId: "shows-suggestions",
  });

  return (
    <form
      className={styles.search}
      role="search"
      aria-label="חיפוש הצגות"
      action="/shows"
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

        {isOpen && filteredItems.length ? (
          <div className={styles.suggestions} id={listboxId} role="listbox">
            {filteredItems.map((item, index) => (
              <button
                key={item}
                type="button"
                id={`shows-suggestion-${index}`}
                className={`${styles.suggestion} ${
                  index === activeIndex ? styles.suggestionActive : ""
                }`}
                role="option"
                aria-selected={index === activeIndex}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  selectItem(item);
                }}
              >
                {item}
              </button>
            ))}
          </div>
        ) : null}

        <Button type="submit">לחפש הצגה</Button>
      </div>
    </form>
  );
}
