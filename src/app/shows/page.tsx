import ShowCard from "@/components/ShowCard/ShowCard";
import ShowsFilterBar from "@/components/ShowsFilterBar/ShowsFilterBar";
import styles from "./page.module.css";
import { getShowsForList } from "@/lib/showsData";
import BackLink from "@/components/BackLink/BackLink";
import ROUTES from "@/constants/routes";
import Link from "next/link";
import Pagination from "@/components/Pagination/Pagination";

export const dynamic = "force-dynamic";

interface ShowsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ShowsPage({ searchParams }: ShowsPageProps) {
  const { shows, theatres, genres, filters } = await getShowsForList(
    await searchParams,
  );

  return (
    <main className={styles.page} id="main-content">
      <BackLink href={ROUTES.HOME} />
      <header className={styles.header}>
        <h1 className={styles.title}>הצגות</h1>
        <p className={styles.subtitle}>בחרו הצגה וקראו ביקורות של הקהל</p>
        <ShowsFilterBar
          theatres={theatres}
          allGenres={genres}
          filters={filters}
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
      <section className={styles.grid}>
        {shows.length ? (
          shows.map((show) => <ShowCard key={show.id} show={show} />)
        ) : (
          <p className={styles.emptyState}>לא נמצאו הצגות לפי החיפוש.</p>
        )}
      </section>
      <Pagination filters={filters} />
    </main>
  );
}
