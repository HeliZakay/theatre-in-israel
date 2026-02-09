"use client";

import Link from "next/link";
import styles from "./ShowsFilterBar.module.css";
import { useShowsFilters } from "@/hooks/useShowsFilters";

export default function ShowsFilterBar({
  theatres,
  genres,
  theatreFilter,
  genreFilters,
  query,
  selectedSort,
}) {
  const {
    buildQueryString,
    handleSelectChange,
    pathname,
    searchValue,
    setSearchValue,
    toggleGenre,
  } = useShowsFilters({
    query,
    theatreFilter,
    genreFilters,
    selectedSort,
  });

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
        <select
          id="theatre"
          name="theatre"
          className={styles.select}
          value={theatreFilter ?? ""}
          onChange={handleSelectChange("theatre")}
        >
          <option value="">הכל</option>
          {theatres.map((theatre) => (
            <option key={theatre} value={theatre}>
              {theatre}
            </option>
          ))}
        </select>
        <label className={styles.filterLabel} htmlFor="sort">
          מיון
        </label>
        <select
          id="sort"
          name="sort"
          className={styles.select}
          value={selectedSort}
          onChange={handleSelectChange("sort")}
        >
          <option value="rating">דירוג גבוה</option>
          <option value="rating-asc">דירוג נמוך</option>
        </select>
      </div>
      <div className={styles.chipRow}>
        <span className={styles.filterLabel}>ז'אנר</span>
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
              genres: toggleGenre(genre),
            })}`}
          >
            {genre}
          </Link>
        ))}
      </div>
    </div>
  );
}
