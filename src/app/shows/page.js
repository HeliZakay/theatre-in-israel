import ShowCard from "@/components/ShowCard/ShowCard";
import ShowsFilterBar from "@/components/ShowsFilterBar/ShowsFilterBar";
import styles from "./page.module.css";
import { getShowsForList } from "@/lib/showsData";
import BackLink from "@/components/BackLink/BackLink";
import Link from "next/link";

export default async function ShowsPage({ searchParams }) {
  const { shows, theatres, genres, filters } = await getShowsForList(
    await searchParams,
  );
  const { theatreFilter, query, genreFilters, selectedSort } = filters;

  return (
    <main className={styles.page} id="main-content">
      <BackLink href="/" />
      <header className={styles.header}>
        <h1 className={styles.title}>הצגות</h1>
        <p className={styles.subtitle}>בחרו הצגה וקראו ביקורות של הקהל</p>
        <ShowsFilterBar
          theatres={theatres}
          genres={genres}
          theatreFilter={theatreFilter ?? ""}
          genreFilters={genreFilters}
          query={query ?? ""}
          selectedSort={selectedSort}
        />
        <div className={styles.filterRow}>
          {theatreFilter || query || genreFilters.length ? (
            <>
              <span className={styles.filterLabel}>מסונן לפי:</span>
              {theatreFilter ? (
                <span className={styles.filterChip}>{theatreFilter}</span>
              ) : null}
              {genreFilters.map((genre) => (
                <span key={genre} className={styles.filterChip}>
                  {genre}
                </span>
              ))}
              {query ? (
                <span className={styles.filterChip}>"{query}"</span>
              ) : null}
              <span className={styles.filterCount}>{shows.length} תוצאות</span>
              <Link className={styles.clearLink} href="/shows">
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
      <section className={styles.grid}>
        {shows.length ? (
          shows.map((show) => <ShowCard key={show.id} show={show} />)
        ) : (
          <p className={styles.emptyState}>לא נמצאו הצגות לפי החיפוש.</p>
        )}
      </section>
    </main>
  );
}
