"use client";

import { Fragment, useState, useRef, useMemo, useCallback } from "react";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import Button from "../Button/Button";
import styles from "./SearchBar.module.css";
import MobileSearchOverlay from "./MobileSearchOverlay";
import { useCombobox } from "@/hooks/useCombobox";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import ROUTES from "@/constants/routes";
import type { Suggestions } from "@/types";

const CATEGORIES = [
  { key: "shows" as const, label: "הצגות" },
  { key: "theatres" as const, label: "תיאטראות" },
  { key: "genres" as const, label: "ז'אנרים" },
];

interface SearchBarProps {
  suggestions?: Suggestions;
}

export default function SearchBar({
  suggestions = { shows: [], theatres: [], genres: [] },
}: SearchBarProps) {
  const [value, setValue] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useMediaQuery(640);

  const allItems = useMemo(
    () => [
      ...(suggestions.shows || []),
      ...(suggestions.theatres || []),
      ...(suggestions.genres || []),
    ],
    [suggestions],
  );

  const categoryLookup = useMemo(() => {
    const lookup = new Map<string, string>();
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

  /* ── mobile overlay handlers ── */
  const handleMobileInputFocus = () => {
    if (isMobile) {
      // Blur the real input immediately so the keyboard doesn't flash,
      // then open the overlay which has its own input.
      inputRef.current?.blur();
      setMobileOpen(true);
    }
  };

  const handleMobileSelect = useCallback(
    (item: string) => {
      setValue(item);
    },
    [],
  );

  return (
    <>
      <form
        className={styles.search}
        role="search"
        aria-label="חיפוש הצגות"
        action={ROUTES.SHOWS}
        method="get"
      >
        <VisuallyHidden.Root asChild>
          <label htmlFor="q">חיפוש</label>
        </VisuallyHidden.Root>

        <div className={styles.searchShell} ref={rootRef}>
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
              if (!isMobile) setIsOpen(true);
            }}
            ref={inputRef}
            aria-haspopup="listbox"
            onFocus={() => {
              if (isMobile) {
                handleMobileInputFocus();
              } else {
                setIsOpen(true);
              }
            }}
            onKeyDown={!isMobile ? handleKeyDown : undefined}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-activedescendant={
              activeIndex >= 0 ? `shows-suggestion-${activeIndex}` : undefined
            }
          />

          {/* Desktop dropdown — only rendered on non-mobile */}
          {!isMobile && isOpen && (
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
                  const catLabel = CATEGORIES.find(
                    (c) => c.key === cat,
                  )?.label;

                  return (
                    <Fragment key={item}>
                      {showHeader && (
                        <div
                          className={styles.groupHeader}
                          role="presentation"
                        >
                          {catLabel}
                        </div>
                      )}
                      <div
                        id={`shows-suggestion-${index}`}
                        className={`${styles.suggestion} ${
                          index === activeIndex ? styles.suggestionActive : ""
                        }`}
                        role="option"
                        aria-selected={index === activeIndex}
                        onMouseDown={(e) => e.preventDefault()}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => selectItem(item)}
                      >
                        {item}
                      </div>
                    </Fragment>
                  );
                })
              )}
            </div>
          )}

          <Button type="submit">לחפש הצגה</Button>
        </div>
      </form>

      {/* Mobile full-screen overlay */}
      {mobileOpen && (
        <MobileSearchOverlay
          initialValue={value}
          onSelect={handleMobileSelect}
          onClose={() => setMobileOpen(false)}
          suggestions={suggestions}
          categoryLookup={categoryLookup}
        />
      )}
    </>
  );
}
