import Link from "next/link";
import styles from "./page.module.css";
import { notFound } from "next/navigation";
import { getShows } from "@/lib/shows";
import ReviewCard from "@/components/ReviewCard/ReviewCard";

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

  return (
    <main className={styles.page} id="main-content">
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
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        ) : (
          <p className={styles.emptyState}>עדיין אין ביקורות להצגה הזו.</p>
        )}
      </section>
    </main>
  );
}
