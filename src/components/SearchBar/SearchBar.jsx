"use client";

import { useMemo, useState } from "react";
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

      <div className={styles.searchShell}>
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
          onChange={(event) => setValue(event.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          aria-expanded={isOpen}
          aria-controls="shows-suggestions"
        />

        {isOpen && suggestions.length ? (
          <div
            className={styles.suggestions}
            id="shows-suggestions"
            role="listbox"
          >
            {suggestions.map((item) => (
              <button
                key={item}
                type="button"
                className={styles.suggestion}
                role="option"
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
