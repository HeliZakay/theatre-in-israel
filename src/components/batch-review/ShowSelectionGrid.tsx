"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import SelectableShowCard from "./SelectableShowCard";
import styles from "./ShowSelectionGrid.module.css";
import type { BatchShowItem } from "@/lib/data/batchReview";

interface ShowSelectionGridProps {
  shows: BatchShowItem[];
  selectedIds: Set<number>;
  reviewedIds: Set<number>;
  onToggle: (showId: number) => void;
  announceSelection?: (message: string) => void;
}

/** Strip leading ה from a Hebrew string for prefix-aware search. */
function stripHePrefix(text: string): string {
  return text.startsWith("ה") ? text.slice(1) : text;
}

function matchesSearch(title: string, query: string): boolean {
  const normalizedTitle = title.toLowerCase();
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return true;

  // Direct substring match
  if (normalizedTitle.includes(normalizedQuery)) return true;

  // Hebrew ה-prefix aware: strip ה from both and compare
  const strippedTitle = stripHePrefix(normalizedTitle);
  const strippedQuery = stripHePrefix(normalizedQuery);
  return strippedTitle.includes(strippedQuery);
}

/** Determine column count matching CSS grid breakpoints. */
function getColumnCount(): number {
  return typeof window !== "undefined" && window.innerWidth >= 480 ? 3 : 2;
}

export default function ShowSelectionGrid({
  shows,
  selectedIds,
  reviewedIds,
  onToggle,
  announceSelection,
}: ShowSelectionGridProps) {
  const [search, setSearch] = useState("");
  const [theatreFilter, setTheatreFilter] = useState("");
  const gridRef = useRef<HTMLDivElement>(null);

  const theatres = useMemo(() => {
    const set = new Set(shows.map((s) => s.theatre));
    return [...set].filter(Boolean).sort();
  }, [shows]);

  const isSearching = search.trim().length > 0 || theatreFilter.length > 0;

  const filtered = useMemo(() => {
    return shows.filter((show) => {
      if (theatreFilter && show.theatre !== theatreFilter) return false;
      if (search && !matchesSearch(show.title, search)) return false;
      // Hide reviewed shows unless user is actively searching
      if (reviewedIds.has(show.id) && !search.trim()) return false;
      return true;
    });
  }, [shows, search, theatreFilter, reviewedIds, isSearching]);

  const maxReached = selectedIds.size >= 50;
  const hasResults = filtered.length > 0;

  const handleToggle = useCallback(
    (showId: number) => {
      const show = shows.find((s) => s.id === showId);
      const wasSelected = selectedIds.has(showId);
      onToggle(showId);
      if (announceSelection && show) {
        const newCount = wasSelected
          ? selectedIds.size - 1
          : selectedIds.size + 1;
        announceSelection(
          wasSelected
            ? `הוסרה: ${show.title}`
            : `נבחרה: ${show.title}. ${newCount} הצגות נבחרו`,
        );
      }
    },
    [shows, selectedIds, onToggle, announceSelection],
  );

  /** Roving tabindex: arrow keys navigate between grid cells. */
  const handleGridKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const { key } = e;
      if (!["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(key))
        return;

      const cards = gridRef.current?.querySelectorAll<HTMLElement>(
        '[role="gridcell"] > [role="checkbox"]',
      );
      if (!cards?.length) return;

      const current = document.activeElement as HTMLElement;
      const items = Array.from(cards);
      const idx = items.indexOf(current);
      if (idx === -1) return;

      e.preventDefault();
      const cols = getColumnCount();
      let next = idx;

      // RTL: ArrowRight = previous, ArrowLeft = next
      if (key === "ArrowRight") next = idx - 1;
      else if (key === "ArrowLeft") next = idx + 1;
      else if (key === "ArrowUp") next = idx - cols;
      else if (key === "ArrowDown") next = idx + cols;

      if (next >= 0 && next < items.length) {
        items[idx].setAttribute("tabindex", "-1");
        items[next].setAttribute("tabindex", "0");
        items[next].focus();
      }
    },
    [],
  );

  return (
    <div className={styles.container}>
      <div className={styles.filters}>
        <input
          type="search"
          className={styles.searchInput}
          placeholder="חיפוש הצגה..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="חיפוש הצגה"
        />
        <select
          className={styles.theatreSelect}
          value={theatreFilter}
          onChange={(e) => setTheatreFilter(e.target.value)}
          aria-label="סינון לפי תיאטרון"
        >
          <option value="">כל התיאטראות</option>
          {theatres.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {hasResults ? (
        <div
          ref={gridRef}
          className={styles.grid}
          role="grid"
          aria-label="בחירת הצגות"
          onKeyDown={handleGridKeyDown}
        >
          {filtered.map((show, i) => (
            <div key={show.id} role="gridcell">
              <SelectableShowCard
                show={show}
                selected={selectedIds.has(show.id)}
                alreadyReviewed={reviewedIds.has(show.id)}
                maxReached={maxReached && !selectedIds.has(show.id)}
                onToggle={handleToggle}
                tabIndex={i === 0 ? 0 : -1}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <p className={styles.emptyText}>
            {theatreFilter && !search.trim()
              ? "אין הצגות פעילות לתיאטרון הזה כרגע"
              : search.trim() && theatreFilter
                ? "לא מצאנו הצגות — נסו חיפוש אחר או שנו את הסינון"
                : "לא מצאנו הצגות — נסו חיפוש אחר"}
          </p>
        </div>
      )}
    </div>
  );
}
