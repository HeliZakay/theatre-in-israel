import styles from "./ReviewCard.module.css";
import { formatDate } from "@/utils/formatDate";
import Card from "@/components/ui/Card/Card";
import { cx } from "@/utils/cx";
import type { Review } from "@/types";

interface ReviewCardProps {
  review: Review;
  isOwn?: boolean;
}

export default function ReviewCard({ review, isOwn = false }: ReviewCardProps) {
  const shouldTruncate = review.text.trim().length > 320;

  return (
    <Card as="article" className={cx(styles.card, isOwn && styles.cardOwn)}>
      <div className={styles.header}>
        <div className={styles.meta}>
          <span className={styles.author} title={review.author}>
            {review.author}
            {isOwn && <span className={styles.ownBadge}>הביקורת שלי</span>}
            {!isOwn && review.userId === null && (
              <span className={styles.guestBadge}>(אורח/ת)</span>
            )}
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
      {review.title && <h3 className={styles.title}>{review.title}</h3>}
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
    </Card>
  );
}
