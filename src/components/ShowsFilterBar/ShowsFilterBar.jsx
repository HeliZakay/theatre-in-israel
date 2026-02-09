"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import styles from "./ShowsFilterBar.module.css";

export default function ShowsFilterBar({
  theatres,
  genres,
  theatreFilter,
  genreFilters,
  query,
  selectedSort,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState(query ?? "");

  useEffect(() => {
    setSearchValue(query ?? "");
  }, [query]);

  const buildQueryString = useCallback(
    (overrides = {}) => {
      const params = new URLSearchParams();

      const nextQuery = overrides.query ?? query;
      const nextTheatre = overrides.theatre ?? theatreFilter;
      const nextGenres = overrides.genres ?? genreFilters;
      const nextSort = overrides.sort ?? selectedSort;

      if (nextQuery) params.set("query", nextQuery);
      if (nextTheatre) params.set("theatre", nextTheatre);
      if (nextGenres?.length) {
        nextGenres.forEach((genre) => {
          if (genre) {
            params.append("genre", genre);
          }
        });
      }
      if (nextSort && nextSort !== "rating") params.set("sort", nextSort);

      const queryString = params.toString();
      return queryString ? `?${queryString}` : "";
    },
    [query, theatreFilter, genreFilters, selectedSort],
  );

  const handleSelectChange = (key) => (event) => {
    const value = event.target.value;
    router.push(`${pathname}${buildQueryString({ [key]: value })}`);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const nextQuery = searchValue.trim();
      if (nextQuery === (query ?? "")) {
        return;
      }
      router.push(`${pathname}${buildQueryString({ query: nextQuery })}`);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchValue, query, pathname, router, buildQueryString]);

  const toggleGenre = (genre) => {
    const current = new Set(genreFilters);
    if (current.has(genre)) {
      current.delete(genre);
    } else {
      current.add(genre);
    }
    return Array.from(current);
  };

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
