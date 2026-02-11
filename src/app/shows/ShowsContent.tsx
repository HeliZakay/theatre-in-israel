"use client";

import { useCallback, useState } from "react";
import ShowCard from "@/components/ShowCard/ShowCard";
import ShowsFilterBar from "@/components/ShowsFilterBar/ShowsFilterBar";
import Pagination from "@/components/Pagination/Pagination";
import Link from "next/link";
import styles from "./page.module.css";
import type { ShowFilters, EnrichedShow } from "@/types";
import ROUTES from "@/constants/routes";

interface ShowsContentProps {
  shows: EnrichedShow[];
  theatres: string[];
  genres: string[];
  filters: ShowFilters;
}

export default function ShowsContent({
  shows,
  theatres,
  genres,
  filters,
}: ShowsContentProps) {
  const [isPending, setIsPending] = useState(false);

  const handlePendingChange = useCallback((pending: boolean) => {
    setIsPending(pending);
  }, []);

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>הצגות</h1>
        <p className={styles.subtitle}>בחרו הצגה וקראו ביקורות של הקהל</p>
        <ShowsFilterBar
          theatres={theatres}
          allGenres={genres}
          filters={filters}
          onPendingChange={handlePendingChange}
        />
        <div className={styles.filterRow}>
          {filters.theatre || filters.query || filters.genres.length ? (
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
              <span className={styles.filterCount}>{shows.length} תוצאות</span>
              <Link className={styles.clearLink} href={ROUTES.SHOWS}>
                נקה סינון
              </Link>
            </>
          ) : (
            <span className={styles.filterPlaceholder} aria-hidden="true">
              מסונן לפי:
            </span>
          )}
        </div>
      </header>
      <section
        className={styles.grid}
        style={{
          opacity: isPending ? 0.6 : 1,
          transition: "opacity 0.2s ease",
          pointerEvents: isPending ? "none" : "auto",
        }}
      >
        {shows.length ? (
          shows.map((show) => <ShowCard key={show.id} show={show} />)
        ) : (
          <p className={styles.emptyState}>לא נמצאו הצגות לפי החיפוש.</p>
        )}
      </section>
      <Pagination filters={filters} />
    </>
  );
}
