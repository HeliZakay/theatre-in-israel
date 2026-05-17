"use client";

import {
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import styles from "./ShowsFilterBar.module.css";
import { cx } from "@/utils/cx";
import AppSelect from "@/components/ui/AppSelect/AppSelect";
import CityCombobox from "@/components/events/CityCombobox";
import { useDebounce } from "@/hooks/useDebounce";
import { buildShowsQueryString } from "@/utils/showsQuery";
import type { ShowFilters } from "@/types";

interface ShowsFilterBarProps {
  theatres: string[];
  allGenres: string[];
  availableGenres: string[];
  filters: ShowFilters;
}

export default function ShowsFilterBar({
  theatres,
  allGenres,
  availableGenres,
  filters,
}: ShowsFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [optimisticFilters, setOptimisticFilters] = useOptimistic(
    filters,
    (current, overrides: Partial<ShowFilters>) => ({
      ...current,
      ...overrides,
      page: 1,
    }),
  );
  const isUpdating = isPending;

  const [genresOpen, setGenresOpen] = useState(filters.genres.length > 0);

  // --- Search input state (debounced → URL) ---
  const [searchValue, setSearchValue] = useState(filters.query);
  const debouncedSearch = useDebounce(searchValue, 350);
  const lastPushedRef = useRef(filters.query.trim());

  // Sync input when URL changes externally (e.g. "clear filters" link).
  // Skip while our own transition is in-flight — the arriving filters.query
  // may be from an older navigation and would clobber what the user is typing.
  useEffect(() => {
    if (isPending) return;
    if (filters.query !== lastPushedRef.current) {
      setSearchValue(filters.query);
      lastPushedRef.current = filters.query.trim();
    }
  }, [filters.query, isPending]);

  // Push to URL when the debounced value settles.
  useEffect(() => {
    const trimmed = debouncedSearch.trim();
    if (trimmed === lastPushedRef.current) return;
    lastPushedRef.current = trimmed;
    applyFilterUpdate({ query: trimmed });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Build a URL that applies the given overrides on top of the current
  // filters, omitting page so any filter change resets to page 1.
  const buildHref = (overrides: Partial<ShowFilters>) => {
    const { page, ...current } = optimisticFilters;
    return `${pathname}${buildShowsQueryString({ ...current, ...overrides })}`;
  };

  const applyFilterUpdate = (overrides: Partial<ShowFilters>) => {
    const href = buildHref(overrides);
    startTransition(() => {
      setOptimisticFilters(overrides);
      router.push(href, { scroll: false });
    });
  };

  const theatreOptions = theatres.map((theatre) => ({
    value: theatre,
    label: theatre,
  }));

  return (
    <div className={styles.filterBar} aria-busy={isUpdating}>
      <div className={styles.filterForm}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="query">
            חיפוש
          </label>
          <input
            id="query"
            name="query"
            type="search"
            className={styles.searchInput}
            placeholder="חפש.י הצגה, תיאטרון או ז׳אנר"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="theatre">
            תיאטרון
          </label>
          <CityCombobox
            id="theatre"
            ariaLabel="חיפוש תיאטרון"
            placeholder="כל התיאטראות"
            emptyLabel="לא נמצא תיאטרון תואם"
            clearAriaLabel="נקו בחירת תיאטרון"
            options={theatreOptions}
            value={optimisticFilters.theatre}
            onValueChange={(value) => applyFilterUpdate({ theatre: value })}
            onClear={() => applyFilterUpdate({ theatre: "" })}
          />
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="sort">
            מיון
          </label>
          <AppSelect
            id="sort"
            name="sort"
            className={styles.select}
            ariaLabel="מיון"
            value={optimisticFilters.sort}
            onValueChange={(value) => applyFilterUpdate({ sort: value })}
            options={[
              { value: "rating", label: "דירוג גבוה" },
              { value: "reviews", label: "הכי הרבה ביקורות" },
              { value: "newest", label: "הצגות חדשות" },
            ]}
          />
        </div>
        <button
          type="button"
          className={cx(
            styles.genreToggle,
            optimisticFilters.genres.length > 0 && styles.genreToggleActive,
          )}
          onClick={() => setGenresOpen((v) => !v)}
          aria-expanded={genresOpen}
          aria-controls="genre-chip-row"
        >
          <span>סינון לפי ז&apos;אנר</span>
          {optimisticFilters.genres.length > 0 && (
            <span className={styles.genreCount}>
              {optimisticFilters.genres.length}
            </span>
          )}
          <span className={styles.genreChevron} aria-hidden="true">
            {genresOpen ? "▴" : "▾"}
          </span>
        </button>
      </div>
      {genresOpen && (
        <div id="genre-chip-row" className={styles.chipRow}>
            <button
              type="button"
              className={cx(
                styles.chip,
                !optimisticFilters.genres.length && styles.chipActive,
              )}
              aria-current={
                optimisticFilters.genres.length ? undefined : "true"
              }
              onClick={() => {
                applyFilterUpdate({ genres: [] });
              }}
            >
              הכל
            </button>
            <ToggleGroup.Root
              type="multiple"
              value={optimisticFilters.genres}
              onValueChange={(genres) => applyFilterUpdate({ genres })}
              className={styles.chipGroup}
            >
              {allGenres.map((genre) => {
                const isAvailable = availableGenres.includes(genre);
                return (
                  <ToggleGroup.Item
                    key={genre}
                    value={genre}
                    className={cx(
                      styles.chip,
                      !isAvailable && styles.chipDisabled,
                    )}
                    disabled={!isAvailable}
                  >
                    {genre}
                  </ToggleGroup.Item>
                );
              })}
          </ToggleGroup.Root>
        </div>
      )}
      <div
        className={cx(styles.status, isUpdating && styles.statusVisible)}
        role="status"
        aria-live="polite"
      >
        {isUpdating ? (
          <>
            <span className={styles.spinner} aria-hidden="false" />
            <span>מעדכנים תוצאות...</span>
          </>
        ) : (
          <span className={styles.statusPlaceholder} aria-hidden="true">
            מעדכנים תוצאות...
          </span>
        )}
      </div>
    </div>
  );
}
