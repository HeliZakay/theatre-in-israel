import { Fragment } from "react";
import type { Suggestions } from "@/types";
import styles from "./SearchSuggestions.module.css";

export const CATEGORIES = [
  { key: "shows" as const, label: "הצגות" },
  { key: "theatres" as const, label: "תיאטראות" },
  { key: "genres" as const, label: "ז'אנרים" },
];

export function buildCategoryLookup(suggestions: Suggestions): Map<string, string> {
  const lookup = new Map<string, string>();
  for (const cat of CATEGORIES) {
    for (const item of suggestions[cat.key] || []) {
      if (!lookup.has(item)) lookup.set(item, cat.key);
    }
  }
  return lookup;
}

interface SearchSuggestionsProps {
  filteredItems: string[];
  categoryLookup: Map<string, string>;
  activeIndex: number;
  listboxId: string;
  onSelect: (item: string) => void;
  onHover: (index: number) => void;
  className?: string;
}

export default function SearchSuggestions({
  filteredItems,
  categoryLookup,
  activeIndex,
  listboxId,
  onSelect,
  onHover,
  className,
}: SearchSuggestionsProps) {
  return (
    <div className={`${styles.suggestions}${className ? ` ${className}` : ''}`} id={listboxId} role="listbox">
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
                <div className={styles.groupHeader} role="presentation">
                  {catLabel}
                </div>
              )}
              <div
                id={`${listboxId}-option-${index}`}
                className={`${styles.suggestion} ${
                  index === activeIndex ? styles.suggestionActive : ""
                }`}
                role="option"
                aria-selected={index === activeIndex}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => onHover(index)}
                onClick={() => onSelect(item)}
              >
                {item}
              </div>
            </Fragment>
          );
        })
      )}
    </div>
  );
}
