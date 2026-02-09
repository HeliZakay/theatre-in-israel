"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Button from "../Button/Button";
import styles from "./SearchBar.module.css";
import shows from "@/data/shows.json";

const theatres = Array.from(new Set(shows.map((show) => show.theatre))).filter(
  Boolean,
);
const genres = Array.from(
  new Set(shows.flatMap((show) => show.genre ?? [])),
).filter(Boolean);

export function SearchBar() {
  const [value, setValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listboxId = "shows-suggestions";
  const rootRef = useRef(null);

  const suggestions = useMemo(() => {
    const pool = [
      ...shows.map((show) => show.title),
      ...theatres,
      ...genres,
    ].filter(Boolean);
    const unique = Array.from(new Set(pool));
    if (!value.trim()) {
      return unique.slice(0, 8);
    }
    const query = value.toLowerCase();
    return unique
      .filter((item) => item.toLowerCase().includes(query))
      .slice(0, 8);
  }, [value]);

  useEffect(() => {
    if (!isOpen) {
      setActiveIndex(-1);
      return;
    }
    if (activeIndex >= suggestions.length) {
      setActiveIndex(suggestions.length ? 0 : -1);
    }
  }, [isOpen, suggestions.length, activeIndex]);

  const handleKeyDown = (event) => {
    if (!suggestions.length) return;

    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        setIsOpen(true);
        setActiveIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0,
        );
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        setIsOpen(true);
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1,
        );
        break;
      }
      case "Enter": {
        if (isOpen && activeIndex >= 0) {
          event.preventDefault();
          setValue(suggestions[activeIndex]);
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

        {isOpen && suggestions.length ? (
          <div className={styles.suggestions} id={listboxId} role="listbox">
            {suggestions.map((item, index) => (
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
                  setValue(item);
                  setIsOpen(false);
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
