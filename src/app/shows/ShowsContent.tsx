"use client";

import { useEffect, useRef } from "react";
import ShowCard from "@/components/shows/ShowCard/ShowCard";
import ShowsFilterBar from "@/components/shows/ShowsFilterBar/ShowsFilterBar";
import ShowCardSkeleton from "@/components/shows/ShowCardSkeleton/ShowCardSkeleton";
import Link from "next/link";
import styles from "./page.module.css";
import type { ShowFilters, ShowListItem } from "@/types";
import ROUTES from "@/constants/routes";
import { useInfiniteShows } from "@/hooks/useInfiniteShows";

interface ShowsContentProps {
  shows: ShowListItem[];
  theatres: string[];
  genres: string[];
  availableGenres: string[];
  filters: ShowFilters;
  hasMore: boolean;
}

export default function ShowsContent({
  shows: initialShows,
  theatres,
  genres,
  availableGenres,
  filters,
  hasMore: initialHasMore,
}: ShowsContentProps) {
  const {
    shows,
    isLoading,
    hasMore,
    error,
    retry,
    sentinelRef,
    announcement,
  } = useInfiniteShows({ initialShows, initialHasMore, filters });

  // Scroll to the results area when arriving via #results hash (e.g. from
  // the home page "all shows" link or the search bar).  The element no
  // longer carries id="results" so the browser / Next.js layout-router
  // can't auto-scroll to it — that auto-scroll was overriding the
  // sessionStorage-based scroll restoration on back-navigation.
  const resultsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.location.hash === "#results" && resultsRef.current) {
      resultsRef.current.scrollIntoView();
    }
    if (window.location.hash) {
      history.replaceState(
        history.state,
        "",
        window.location.pathname + window.location.search,
      );
    }
  }, []);

  const totalCount = filters.total ?? shows.length;
  const isFiltered =
    filters.theatre || filters.query || filters.genres.length > 0;

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>הצגות</h1>
        <p className={styles.subtitle}>בחרו הצגה וקראו ביקורות של הקהל</p>
        <ShowsFilterBar
          theatres={theatres}
          allGenres={genres}
          availableGenres={availableGenres}
          filters={filters}
        />
        <div ref={resultsRef} className={styles.filterRow}>
          {isFiltered ? (
            <>
              <span className={styles.filterLabel}>מסונן לפי:</span>
              {filters.theatre ? (
                <span className={styles.filterChip}>{filters.theatre}</span>
              ) : null}
              {filters.genres.map((genre) => (
                <span key={genre} className={styles.filterChip}>
                  {genre}
                </span>
              ))}
              {filters.query ? (
                <span className={styles.filterChip}>
                  &quot;{filters.query}&quot;
                </span>
              ) : null}
              <span className={styles.filterCount}>
                {totalCount} תוצאות
              </span>
              <Link
                className={styles.clearLink}
                href={ROUTES.SHOWS}
                scroll={false}
              >
                נקה סינון
              </Link>
            </>
          ) : (
            <span className={styles.filterCount}>
              {totalCount} הצגות
            </span>
          )}
        </div>
      </header>

      <section className={styles.grid}>
        {shows.length ? (
          shows.map((show, index) => (
            <ShowCard key={show.id} show={show} priority={index < 4} />
          ))
        ) : (
          <p className={styles.emptyState}>לא נמצאו הצגות לפי החיפוש.</p>
        )}
        {isLoading
          ? Array.from({ length: 4 }, (_, i) => (
              <ShowCardSkeleton key={`skeleton-${i}`} />
            ))
          : null}
      </section>

      {error ? (
        <div className={styles.errorRow}>
          <span>{error}</span>
          <button type="button" className={styles.retryButton} onClick={retry}>
            נסו שוב
          </button>
        </div>
      ) : null}

      {!hasMore && shows.length > 0 && !isLoading ? (
        <p className={styles.endOfList}>הגעתם לסוף הרשימה</p>
      ) : null}

      {hasMore ? (
        <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
      ) : null}

      <div role="status" aria-live="polite" className={styles.srOnly}>
        {announcement}
      </div>
    </>
  );
}
