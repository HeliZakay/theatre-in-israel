"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useOptimistic, useState, useTransition } from "react";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import styles from "./ShowsFilterBar.module.css";
import AppSelect from "@/components/AppSelect/AppSelect";
import SearchInput from "@/components/SearchInput/SearchInput";
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
  const [isSearchPending, setIsSearchPending] = useState(false);
  const [optimisticFilters, setOptimisticFilters] = useOptimistic(
    filters,
    (current, overrides: Partial<ShowFilters>) => ({
      ...current,
      ...overrides,
      page: 1,
    }),
  );
  const isUpdating = isPending || isSearchPending;

  const handleSearchPendingChange = useCallback((pending: boolean) => {
    setIsSearchPending(pending);
  }, []);

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
        <SearchInput
          defaultValue={optimisticFilters.query}
          filters={optimisticFilters}
          className={styles.searchInput}
          onPendingChange={handleSearchPendingChange}
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
          className={`${styles.chip} ${optimisticFilters.genres.length ? "" : styles.chipActive}`}
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
            <span className={styles.spinner} aria-hidden="true" />
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
