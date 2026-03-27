import Link from "next/link";
import Card from "@/components/ui/Card/Card";
import FallbackImage from "@/components/ui/FallbackImage/FallbackImage";
import { getShowImagePath } from "@/utils/getShowImagePath";
import { formatRelativeDate } from "@/utils/formatDate";
import { showPath } from "@/constants/routes";
import type { LatestReviewItem } from "@/types";
import styles from "./LatestReviewCard.module.css";

const TEXT_TRUNCATE_LENGTH = 120;

interface LatestReviewCardProps {
  review: LatestReviewItem;
}

export default function LatestReviewCard({ review }: LatestReviewCardProps) {
  const truncatedText =
    review.text.length > TEXT_TRUNCATE_LENGTH
      ? review.text.slice(0, TEXT_TRUNCATE_LENGTH).trimEnd() + "..."
      : review.text;

  return (
    <Link href={showPath(review.showSlug)} className={styles.link}>
      <Card as="article" className={styles.card}>
        <div className={styles.showInfo}>
          <div className={styles.poster}>
            <FallbackImage
              src={getShowImagePath(review.showTitle)}
              alt={review.showTitle}
              fill
              sizes="64px"
              className={styles.posterImage}
            />
          </div>
          <div className={styles.showMeta}>
            <h3 className={styles.showTitle}>{review.showTitle}</h3>
            <p className={styles.theatre}>{review.showTheatre}</p>
          </div>
          <span className={styles.rating} aria-label={`דירוג ${review.rating} מתוך 5`}>
            ★{review.rating}
          </span>
        </div>
        {review.title && <p className={styles.reviewTitle}>{review.title}</p>}
        <p className={styles.text}>{truncatedText}</p>
        <div className={styles.footer}>
          <span className={styles.author}>{review.author}</span>
          <span className={styles.dot} aria-hidden>•</span>
          <span className={styles.date}>
            {formatRelativeDate(review.createdAt)}
          </span>
        </div>
      </Card>
    </Link>
  );
}
