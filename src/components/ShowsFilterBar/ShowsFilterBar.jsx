"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./ShowsFilterBar.module.css";
import AppSelect from "@/components/AppSelect/AppSelect";
import SearchInput from "@/components/SearchInput/SearchInput";
import { buildShowsQueryString } from "@/utils/showsQuery";

// ShowsFilterBar renders the controls used to filter and sort the
// shows list.  Selects navigate immediately, genre chips are plain
// links, and the search input is handled by a dedicated component
// that debounces keystrokes independently.
export default function ShowsFilterBar({ theatres, allGenres, filters }) {
  const ALL_THEATRES_VALUE = "__all_theatres__";
  const router = useRouter();
  const pathname = usePathname();

  // Build a URL that applies the given overrides on top of the current
  // filters, omitting page so any filter change resets to page 1.
  const buildHref = (overrides) => {
    const { page, ...current } = filters;
    return `${pathname}${buildShowsQueryString({ ...current, ...overrides })}`;
  };

  const toggleGenre = (genre) => {
    const current = new Set(filters.genres);
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
            router.push(
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
          onValueChange={(value) => router.push(buildHref({ sort: value }))}
          options={sortOptions}
        />
      </div>
      <div className={styles.chipRow}>
        <span className={styles.filterLabel}>ז&apos;אנר</span>
        <Link
          className={`${styles.chip} ${
            filters.genres.length ? "" : styles.chipActive
          }`}
          aria-current={filters.genres.length ? undefined : "true"}
          href={buildHref({ genres: [] })}
        >
          הכל
        </Link>
        {allGenres.map((genre) => (
          <Link
            key={genre}
            className={`${styles.chip} ${
              filters.genres.includes(genre) ? styles.chipActive : ""
            }`}
            aria-current={filters.genres.includes(genre) ? "true" : undefined}
            href={buildHref({ genres: toggleGenre(genre) })}
          >
            {genre}
          </Link>
        ))}
      </div>
    </div>
  );
}
