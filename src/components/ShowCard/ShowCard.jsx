import Link from "next/link";
import styles from "./ShowCard.module.css";

export default function ShowCard({ show }) {
  const reviewCount = show.reviews?.length ?? 0;
  const averageRating = reviewCount
    ? show.reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
    : null;

  return (
    <Link href={`/shows/${show.id}`} className={styles.cardLink}>
      <article className={styles.card} aria-label={show.title}>
        <div className={styles.imagePlaceholder} aria-hidden="true" />
        <header className={styles.header}>
          <h3 className={styles.title}>{show.title}</h3>
          <span className={styles.theatre}>{show.theatre}</span>
        </header>

        <div className={styles.meta}>
          <span className={styles.metaItem}>{show.durationMinutes} דקות</span>
          <span className={styles.metaDivider} aria-hidden>
            •
          </span>
          <span className={styles.metaItem}>{reviewCount} ביקורות</span>
        </div>

        <p className={styles.summary}>{show.summary}</p>

        <div className={styles.genreRow}>
          {(show.genre ?? []).slice(0, 3).map((item) => (
            <span key={item} className={styles.genreChip}>
              {item}
            </span>
          ))}
        </div>

        <div className={styles.rating}>
          {averageRating ? (
            <span className={styles.ratingValue}>
              {averageRating.toFixed(1)}
            </span>
          ) : (
            <span className={styles.ratingEmpty}>עדיין אין דירוגים</span>
          )}
        </div>
      </article>
    </Link>
  );
}
