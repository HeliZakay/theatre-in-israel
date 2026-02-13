import styles from "./ReviewCard.module.css";
import { formatDate } from "@/utils/formatDate";
import type { Review } from "@/types";

interface ReviewCardProps {
  review: Review;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const shouldTruncate = review.text.trim().length > 320;

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <div className={styles.meta}>
          <span className={styles.author} title={review.author}>
            {review.author}
          </span>
          {review.date ? (
            <>
              <span className={styles.dot}>•</span>
              <span>{formatDate(review.date)}</span>
            </>
          ) : null}
        </div>
        <span className={styles.rating}>★{review.rating}</span>
      </div>
      {shouldTruncate ? (
        <details className={styles.details}>
          <summary className={styles.readMoreBtn}>
            <p className={`${styles.text} ${styles.textTruncated}`}>
              {review.text}
            </p>
            <span
              className={styles.readMoreLabel}
              data-open="קרא פחות"
              data-closed="קרא עוד"
            />
          </summary>
        </details>
      ) : (
        <p className={styles.text}>{review.text}</p>
      )}
    </article>
  );
}
