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
import AppSelect from "@/components/AppSelect/AppSelect";
import { useDebounce } from "@/hooks/useDebounce";
import { buildShowsQueryString } from "@/utils/showsQuery";
import type { ShowFilters } from "@/types";

interface ShowsFilterBarProps {
  theatres: string[];
  allGenres: string[];
  filters: ShowFilters;
}

export default function ShowsFilterBar({
  theatres,
  allGenres,
  filters,
}: ShowsFilterBarProps) {
  const ALL_THEATRES_VALUE = "__all_theatres__";
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
      router.push(href);
    });
  };

  const theatreOptions = [
    { value: ALL_THEATRES_VALUE, label: "הכל" },
    ...theatres.map((theatre) => ({ value: theatre, label: theatre })),
  ];

  const sortOptions = [
    { value: "rating", label: "דירוג גבוה" },
    { value: "rating-asc", label: "דירוג נמוך" },
  ];

  return (
    <div className={styles.filterBar} aria-busy={isUpdating}>
      <div className={styles.filterForm}>
        <label className={styles.filterLabel} htmlFor="query">
          חיפוש
        </label>
        <input
          id="query"
          name="query"
          type="search"
          className={styles.searchInput}
          placeholder="חפש.י הצגה, תיאטרון או ז'אנר"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
        <label className={styles.filterLabel} htmlFor="theatre">
          תיאטרון
        </label>
        <AppSelect
          id="theatre"
          name="theatre"
          className={styles.select}
          ariaLabel="תיאטרון"
          value={optimisticFilters.theatre || ALL_THEATRES_VALUE}
          onValueChange={(value) => {
            const theatre = value === ALL_THEATRES_VALUE ? "" : value;
            applyFilterUpdate({ theatre });
          }}
          options={theatreOptions}
        />
        <label className={styles.filterLabel} htmlFor="sort">
          מיון
        </label>
        <AppSelect
          id="sort"
          name="sort"
          className={styles.select}
          ariaLabel="מיון"
          value={optimisticFilters.sort}
          onValueChange={(value) => {
            applyFilterUpdate({ sort: value });
          }}
          options={sortOptions}
        />
      </div>
      <div className={styles.chipRow}>
        <span className={styles.filterLabel}>ז&apos;אנר</span>
        <button
          type="button"
          className={cx(
            styles.chip,
            !optimisticFilters.genres.length && styles.chipActive,
          )}
          aria-current={optimisticFilters.genres.length ? undefined : "true"}
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
          {allGenres.map((genre) => (
            <ToggleGroup.Item key={genre} value={genre} className={styles.chip}>
              {genre}
            </ToggleGroup.Item>
          ))}
        </ToggleGroup.Root>
      </div>
      <div className={styles.status} role="status" aria-live="polite">
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
