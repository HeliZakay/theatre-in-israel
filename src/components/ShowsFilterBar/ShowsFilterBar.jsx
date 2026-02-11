"use client";

import Link from "next/link";
import styles from "./ShowsFilterBar.module.css";
import { useShowsFilters } from "@/hooks/useShowsFilters";
import AppSelect from "@/components/AppSelect/AppSelect";

// ShowsFilterBar renders the controls used to filter and sort the
// shows list. It delegates navigation to the hook helpers so the
// component remains focused on rendering and UX.
export default function ShowsFilterBar({
  theatres,
  genres,
  theatreFilter,
  genreFilters,
  query,
  selectedSort,
}) {
  const ALL_THEATRES_VALUE = "__all_theatres__";

  const {
    buildQueryString,
    handleSelectChange,
    pathname,
    searchValue,
    setSearchValue,
    getToggledGenres,
  } = useShowsFilters({
    query,
    theatreFilter,
    genreFilters,
    selectedSort,
  });

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
        <input
          id="query"
          name="query"
          className={styles.searchInput}
          type="search"
          placeholder="חפש.י הצגה, תיאטרון או ז'אנר"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
        />
        <label className={styles.filterLabel} htmlFor="theatre">
          תיאטרון
        </label>
        <AppSelect
          id="theatre"
          name="theatre"
          className={styles.select}
          ariaLabel="תיאטרון"
          value={theatreFilter || ALL_THEATRES_VALUE}
          onValueChange={(nextValue) =>
            handleSelectChange("theatre")(
              nextValue === ALL_THEATRES_VALUE ? "" : nextValue,
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
          value={selectedSort}
          onValueChange={handleSelectChange("sort")}
          options={sortOptions}
        />
      </div>
      <div className={styles.chipRow}>
        <span className={styles.filterLabel}>ז&apos;אנר</span>
        <Link
          className={`${styles.chip} ${
            genreFilters.length ? "" : styles.chipActive
          }`}
          aria-current={genreFilters.length ? undefined : "true"}
          href={`${pathname}${buildQueryString({ genres: [] })}`}
        >
          הכל
        </Link>
        {genres.map((genre) => (
          <Link
            key={genre}
            className={`${styles.chip} ${
              genreFilters.includes(genre) ? styles.chipActive : ""
            }`}
            aria-current={genreFilters.includes(genre) ? "true" : undefined}
            href={`${pathname}${buildQueryString({
              genres: getToggledGenres(genre),
            })}`}
          >
            {genre}
          </Link>
        ))}
      </div>
    </div>
  );
}
