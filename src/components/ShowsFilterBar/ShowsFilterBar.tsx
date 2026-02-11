"use client";

import { usePathname, useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import styles from "./ShowsFilterBar.module.css";
import AppSelect from "@/components/AppSelect/AppSelect";
import SearchInput from "@/components/SearchInput/SearchInput";
import { buildShowsQueryString } from "@/utils/showsQuery";
import type { ShowFilters } from "@/types";

interface ShowsFilterBarProps {
  theatres: string[];
  allGenres: string[];
  filters: ShowFilters;
  onPendingChange?: (pending: boolean) => void;
}

export default function ShowsFilterBar({
  theatres,
  allGenres,
  filters,
  onPendingChange,
}: ShowsFilterBarProps) {
  const ALL_THEATRES_VALUE = "__all_theatres__";
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // Optimistic genre state so chips toggle immediately
  const [optimisticGenres, setOptimisticGenres] = useOptimistic(filters.genres);

  // Wrap navigation in a transition for non-blocking updates
  const navigate = (href: string, optimisticUpdate?: () => void) => {
    startTransition(() => {
      optimisticUpdate?.();
      router.push(href);
    });
    onPendingChange?.(true);
  };

  // Keep parent in sync when transition completes
  if (!isPending) {
    onPendingChange?.(false);
  }

  // Build a URL that applies the given overrides on top of the current
  // filters, omitting page so any filter change resets to page 1.
  const buildHref = (overrides: Partial<ShowFilters>) => {
    const { page, ...current } = filters;
    return `${pathname}${buildShowsQueryString({ ...current, ...overrides })}`;
  };

  const toggleGenre = (genre: string) => {
    const current = new Set(optimisticGenres);
    if (current.has(genre)) current.delete(genre);
    else current.add(genre);
    return Array.from(current);
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
    <div className={styles.filterBar}>
      <div className={styles.filterForm}>
        <label className={styles.filterLabel} htmlFor="query">
          חיפוש
        </label>
        <SearchInput
          defaultValue={filters.query}
          filters={filters}
          className={styles.searchInput}
        />
        <label className={styles.filterLabel} htmlFor="theatre">
          תיאטרון
        </label>
        <AppSelect
          id="theatre"
          name="theatre"
          className={styles.select}
          ariaLabel="תיאטרון"
          value={filters.theatre || ALL_THEATRES_VALUE}
          onValueChange={(value) =>
            navigate(
              buildHref({
                theatre: value === ALL_THEATRES_VALUE ? "" : value,
              }),
            )
          }
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
          value={filters.sort}
          onValueChange={(value) => navigate(buildHref({ sort: value }))}
          options={sortOptions}
        />
      </div>
      <div className={styles.chipRow}>
        <span className={styles.filterLabel}>ז&apos;אנר</span>
        <button
          type="button"
          className={`${styles.chip} ${
            optimisticGenres.length ? "" : styles.chipActive
          }`}
          aria-current={optimisticGenres.length ? undefined : "true"}
          onClick={() =>
            navigate(buildHref({ genres: [] }), () => setOptimisticGenres([]))
          }
        >
          הכל
        </button>
        {allGenres.map((genre) => {
          const isActive = optimisticGenres.includes(genre);
          return (
            <button
              type="button"
              key={genre}
              className={`${styles.chip} ${isActive ? styles.chipActive : ""}`}
              aria-current={isActive ? "true" : undefined}
              onClick={() => {
                const next = toggleGenre(genre);
                navigate(buildHref({ genres: next }), () =>
                  setOptimisticGenres(next),
                );
              }}
            >
              {genre}
            </button>
          );
        })}
      </div>
    </div>
  );
}
