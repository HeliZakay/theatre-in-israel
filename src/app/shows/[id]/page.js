import Link from "next/link";
import styles from "./page.module.css";
import { notFound } from "next/navigation";
import { getShows } from "@/lib/shows";

export async function generateStaticParams() {
  const shows = await getShows();
  return shows.map((show) => ({
    id: String(show.id),
  }));
}

export default async function ShowPage({ params }) {
  const { id: showId } = await params;
  const shows = await getShows();
  const show = shows.find((item) => String(item.id) === String(showId));

  if (!show) {
    notFound();
  }

  const reviewCount = show.reviews.length;
  const averageRating = reviewCount
    ? show.reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
    : null;

  const formatDate = (dateValue) => {
    const date = new Date(dateValue);
    return Number.isNaN(date.getTime())
      ? ""
      : date.toLocaleDateString("he-IL", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
        });
  };

  return (
    <main className={styles.page}>
      <Link className={styles.backLink} href="/shows">
        לכל ההצגות →
      </Link>
      <header className={styles.header}>
        <div className={styles.heroGrid}>
          <div className={styles.poster} aria-hidden />
          <div className={styles.heroContent}>
            <h1 className={styles.title}>{show.title}</h1>
            <div className={styles.ratingRow}>
              {averageRating ? (
                <span className={styles.metaRating}>
                  דירוג ממוצע
                  <span className={styles.metaRatingValue}>
                    {averageRating.toFixed(1)}
                    <span className={styles.metaRatingStar}>★</span>
                  </span>
                </span>
              ) : (
                <span className={styles.metaRatingEmpty}>אין דירוגים</span>
              )}
            </div>
            <div className={styles.meta}>
              <span>{show.theatre}</span>
              <span>{show.durationMinutes} דקות</span>
              <span>{reviewCount} ביקורות</span>
            </div>
            <div className={styles.genreRow}>
              {(show.genre ?? []).map((item) => (
                <span key={item} className={styles.genreChip}>
                  {item}
                </span>
              ))}
            </div>
            <p className={styles.description}>{show.summary}</p>
            <div className={styles.heroActions}>
              <Link
                className={styles.primaryBtn}
                href={`/shows/${show.id}/review`}
              >
                כתבי ביקורת
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>ביקורות אחרונות</h2>
        {show.reviews.length ? (
          <div className={styles.reviewList}>
            {show.reviews.map((review) => (
              <article key={review.id} className={styles.reviewCard}>
                <div className={styles.reviewHeader}>
                  <div className={styles.reviewMeta}>
                    <span>{review.author}</span>
                    {review.date ? (
                      <>
                        <span className={styles.dot}>•</span>
                        <span>{formatDate(review.date)}</span>
                      </>
                    ) : null}
                  </div>
                  <span className={styles.reviewRating}>{review.rating}★</span>
                </div>
                <p className={styles.reviewText}>{review.text}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className={styles.emptyState}>עדיין אין ביקורות להצגה הזו.</p>
        )}
      </section>
    </main>
  );
}
