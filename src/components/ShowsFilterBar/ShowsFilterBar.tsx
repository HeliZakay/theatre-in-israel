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

  // Let the optimistic UI paint first, then start route transition.
  const navigate = (href: string) => {
    requestAnimationFrame(() => {
      startTransition(() => {
        router.push(href);
      });
    });
  };

  // Build a URL that applies the given overrides on top of the current
  // filters, omitting page so any filter change resets to page 1.
  const buildHref = (overrides: Partial<ShowFilters>) => {
    const { page, ...current } = optimisticFilters;
    return `${pathname}${buildShowsQueryString({ ...current, ...overrides })}`;
  };

  const toggleGenre = (genre: string) => {
    const current = new Set(optimisticFilters.genres);
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
    <div className={styles.filterBar} aria-busy={isPending}>
      <div className={styles.filterForm}>
        <label className={styles.filterLabel} htmlFor="query">
          חיפוש
        </label>
        <SearchInput
          defaultValue={optimisticFilters.query}
          filters={optimisticFilters}
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
          value={optimisticFilters.theatre || ALL_THEATRES_VALUE}
          onValueChange={(value) => {
            const theatre = value === ALL_THEATRES_VALUE ? "" : value;
            setOptimisticFilters({ theatre });
            navigate(buildHref({ theatre }));
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
            setOptimisticFilters({ sort: value });
            navigate(buildHref({ sort: value }));
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
            setOptimisticFilters({ genres: [] });
            navigate(buildHref({ genres: [] }));
          }}
        >
          הכל
        </button>
        {allGenres.map((genre) => {
          const isActive = optimisticFilters.genres.includes(genre);
          return (
            <button
              type="button"
              key={genre}
              className={`${styles.chip} ${isActive ? styles.chipActive : ""}`}
              aria-current={isActive ? "true" : undefined}
              onClick={() => {
                const next = toggleGenre(genre);
                setOptimisticFilters({ genres: next });
                navigate(buildHref({ genres: next }));
              }}
            >
              {genre}
            </button>
          );
        })}
      </div>
      <div className={styles.status} role="status" aria-live="polite">
        {isPending ? (
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
