"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { useRouter } from "next/navigation";
import SearchSuggestions, {
  buildCategoryLookup,
} from "../SearchSuggestions/SearchSuggestions";
import styles from "./HeaderSearch.module.css";
import { useCombobox } from "@/hooks/useCombobox";
import ROUTES from "@/constants/routes";
import type { Suggestions } from "@/types";

const EMPTY_SUGGESTIONS: Suggestions = {
  shows: [],
  theatres: [],
  genres: [],
};

export default function HeaderSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] =
    useState<Suggestions>(EMPTY_SUGGESTIONS);
  const suggestionsRef = useRef<Suggestions | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchSuggestions = useCallback(async () => {
    if (suggestionsRef.current) {
      setSuggestions(suggestionsRef.current);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/suggestions");
      const data: Suggestions = await res.json();
      suggestionsRef.current = data;
      setSuggestions(data);
    } catch {
      // Silently fail — search still works without suggestions
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (nextOpen) {
        setValue("");
        fetchSuggestions();
      }
    },
    [fetchSuggestions],
  );

  const allItems = useMemo(
    () => [
      ...(suggestions.shows || []),
      ...(suggestions.theatres || []),
      ...(suggestions.genres || []),
    ],
    [suggestions],
  );

  const categoryLookup = useMemo(
    () => buildCategoryLookup(suggestions),
    [suggestions],
  );

  const navigate = useCallback(
    (query: string) => {
      if (!query.trim()) return;
      router.push(`${ROUTES.SHOWS}#results?query=${encodeURIComponent(query.trim())}`);
      setOpen(false);
    },
    [router],
  );

  const {
    activeIndex,
    filteredItems,
    handleKeyDown,
    isOpen: suggestionsOpen,
    listboxId,
    rootRef,
    selectItem,
    setIsOpen: setSuggestionsOpen,
    setActiveIndex,
  } = useCombobox<HTMLFormElement>({
    items: allItems,
    value,
    onSelect: (item) => {
      setValue(item);
      navigate(item);
    },
    listboxId: "header-search-suggestions",
    maxItems: 50,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(value);
  };

  const showSuggestions = !loading && suggestionsOpen && filteredItems.length > 0;

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className={styles.trigger}
          aria-label="חיפוש"
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            className={styles.triggerIcon}
            aria-hidden="true"
          >
            <path
              d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm0-2a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11Zm8.2 4.6-4.2-4.2 1.4-1.4 4.2 4.2-1.4 1.4Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content
          className={styles.content}
          aria-label="חיפוש הצגות"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
        >
          <VisuallyHidden.Root>
            <Dialog.Title>חיפוש הצגות</Dialog.Title>
            <Dialog.Description>
              חפש.י הצגה, תיאטרון או ז׳אנר
            </Dialog.Description>
          </VisuallyHidden.Root>

          <form
            className={styles.searchForm}
            role="search"
            aria-label="חיפוש הצגות"
            onSubmit={handleSubmit}
            ref={rootRef}
          >
            <div className={styles.searchShell}>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className={styles.close}
                  aria-label="סגירת חיפוש"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    aria-hidden="true"
                  >
                    <path
                      fill="currentColor"
                      d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3z"
                    />
                  </svg>
                </button>
              </Dialog.Close>

              <input
                ref={inputRef}
                type="search"
                dir="rtl"
                placeholder="חפש.י הצגה, תיאטרון או ז׳אנר..."
                className={styles.searchInput}
                autoComplete="off"
                name="query"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setSuggestionsOpen(true);
                }}
                onFocus={() => setSuggestionsOpen(true)}
                onKeyDown={handleKeyDown}
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={suggestionsOpen}
                aria-controls={listboxId}
                aria-activedescendant={
                  activeIndex >= 0
                    ? `${listboxId}-option-${activeIndex}`
                    : undefined
                }
              />

              <span className={styles.searchIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path
                    d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm0-2a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11Zm8.2 4.6-4.2-4.2 1.4-1.4 4.2 4.2-1.4 1.4Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
            </div>

            {loading && (
              <div className={styles.loading}>טוען...</div>
            )}

            {showSuggestions && (
              <>
                <div className={styles.divider} />
                <SearchSuggestions
                  filteredItems={filteredItems}
                  categoryLookup={categoryLookup}
                  activeIndex={activeIndex}
                  listboxId={listboxId}
                  onSelect={selectItem}
                  onHover={setActiveIndex}
                  className={styles.suggestionsInline}
                />
              </>
            )}

            {!loading && suggestionsOpen && filteredItems.length === 0 && value.trim() && (
              <>
                <div className={styles.divider} />
                <SearchSuggestions
                  filteredItems={filteredItems}
                  categoryLookup={categoryLookup}
                  activeIndex={activeIndex}
                  listboxId={listboxId}
                  onSelect={selectItem}
                  onHover={setActiveIndex}
                  className={styles.suggestionsInline}
                />
              </>
            )}
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
