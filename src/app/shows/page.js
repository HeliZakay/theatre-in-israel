import Link from "next/link";
import ShowCard from "@/components/ShowCard/ShowCard";
import ShowsFilterBar from "@/components/ShowsFilterBar/ShowsFilterBar";
import styles from "./page.module.css";
import { getShows } from "@/lib/shows";

function normalize(value) {
  return value?.toString().trim().toLowerCase() ?? "";
}

function getAverageRating(reviews) {
  if (!reviews?.length) {
    return null;
  }
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return total / reviews.length;
}

export default async function ShowsPage({ searchParams }) {
  const {
    theatre: theatreFilter,
    query,
    genre: genreParam,
    sort,
  } = await searchParams;
  const queryNormalized = normalize(query);
  const theatreNormalized = normalize(theatreFilter);
  const genreFilters = Array.isArray(genreParam)
    ? genreParam
    : genreParam
      ? [genreParam]
      : [];
  const genreNormalized = genreFilters.map(normalize).filter(Boolean);
  const shows = await getShows();

  const theatres = Array.from(new Set(shows.map((show) => show.theatre)));
  const genres = Array.from(new Set(shows.flatMap((show) => show.genre ?? [])));

  const selectedSort = sort ?? "rating";

  const filteredShows = shows.filter((show) => {
    const matchesTheatre = theatreNormalized
      ? normalize(show.theatre) === theatreNormalized
      : true;

    const matchesQuery = queryNormalized
      ? [show.title, show.theatre, show.summary, (show.genre ?? []).join(" ")]
          .filter(Boolean)
          .some((field) => normalize(field).includes(queryNormalized))
      : true;

    const matchesGenre = genreNormalized.length
      ? (show.genre ?? []).some((genre) =>
          genreNormalized.includes(normalize(genre)),
        )
      : true;

    return matchesTheatre && matchesQuery && matchesGenre;
  });

  const sortedShows = [...filteredShows].sort((a, b) => {
    if (selectedSort !== "rating" && selectedSort !== "rating-asc") {
      return 0;
    }
    const ratingA = getAverageRating(a.reviews) ?? -1;
    const ratingB = getAverageRating(b.reviews) ?? -1;
    return selectedSort === "rating-asc"
      ? ratingA - ratingB
      : ratingB - ratingA;
  });

  return (
    <main className={styles.page}>
      <Link className={styles.homeLink} href="/">
        חזרה לעמוד הבית →
      </Link>
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
              <span className={styles.filterCount}>
                {sortedShows.length} תוצאות
              </span>
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
        {sortedShows.length ? (
          sortedShows.map((show) => <ShowCard key={show.id} show={show} />)
        ) : (
          <p className={styles.emptyState}>לא נמצאו הצגות לפי החיפוש.</p>
        )}
      </section>
    </main>
  );
}
