"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import styles from "./MobileSearchOverlay.module.css";
import type { Suggestions } from "@/types";

const CATEGORIES = [
  { key: "shows" as const, label: "הצגות" },
  { key: "theatres" as const, label: "תיאטראות" },
  { key: "genres" as const, label: "ז'אנרים" },
] as const;

interface MobileSearchOverlayProps {
  initialValue: string;
  onSelect: (item: string) => void;
  onClose: () => void;
  suggestions: Suggestions;
  categoryLookup: Map<string, string>;
}

export default function MobileSearchOverlay({
  initialValue,
  onSelect,
  onClose,
  suggestions,
  categoryLookup,
}: MobileSearchOverlayProps) {
  const [query, setQuery] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  const allItems = useMemo(
    () => [
      ...(suggestions.shows || []),
      ...(suggestions.theatres || []),
      ...(suggestions.genres || []),
    ],
    [suggestions],
  );

  const filteredItems = useMemo(() => {
    const unique = Array.from(new Set(allItems.filter(Boolean)));
    if (!query.trim()) return unique.slice(0, 50);
    const q = query.toLowerCase();
    return unique.filter((item) => item.toLowerCase().includes(q)).slice(0, 50);
  }, [allItems, query]);

  // Auto-focus the input when overlay opens.
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  // Lock body scroll while overlay is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Close on Escape.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSelect = (item: string) => {
    onSelect(item);
    onClose();
  };

  return (
    <div className={styles.overlay} role="dialog" aria-label="חיפוש הצגות">
      {/* Header bar */}
      <div className={styles.header}>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="סגור חיפוש"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
            <path
              d="M18 6 6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className={styles.inputWrap}>
          <input
            ref={inputRef}
            type="search"
            dir="rtl"
            placeholder="חפש.י הצגה, תיאטרון או ז'אנר..."
            className={styles.input}
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className={styles.searchIcon} aria-hidden>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path
                d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm0-2a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11Zm8.2 4.6-4.2-4.2 1.4-1.4 4.2 4.2-1.4 1.4Z"
                fill="currentColor"
              />
            </svg>
          </span>
        </div>
      </div>

      {/* Scrollable suggestions list */}
      <div className={styles.list}>
        {filteredItems.length === 0 ? (
          <div className={styles.empty}>לא נמצאו תוצאות</div>
        ) : (
          filteredItems.map((item, index) => {
            const cat = categoryLookup.get(item);
            const prevCat =
              index > 0 ? categoryLookup.get(filteredItems[index - 1]) : null;
            const showHeader = cat !== prevCat;
            const catLabel = CATEGORIES.find((c) => c.key === cat)?.label;

            return (
              <Fragment key={item}>
                {showHeader && (
                  <div className={styles.groupHeader}>{catLabel}</div>
                )}
                <button
                  type="button"
                  className={styles.item}
                  onClick={() => handleSelect(item)}
                >
                  {item}
                </button>
              </Fragment>
            );
          })
        )}
      </div>
    </div>
  );
}
