import Link from "next/link";
import { showPath } from "@/constants/routes";
import FallbackImage from "@/components/FallbackImage/FallbackImage";
import { getShowImagePath } from "@/utils/getShowImagePath";
import { getShowImageAlt } from "@/lib/seo";
import styles from "./EventCard.module.css";

export interface EventCardProps {
  hour: string;
  showTitle: string;
  showSlug: string;
  showTheatre: string;
  showAvgRating: number | null;
  showReviewCount: number;
  venueName: string;
  venueCity: string;
  dateLabel?: string;
}

export default function EventCard({
  hour,
  showTitle,
  showSlug,
  showTheatre,
  showAvgRating,
  showReviewCount,
  venueName,
  venueCity,
  dateLabel,
}: EventCardProps) {
  const venueText = `${venueName}, ${venueCity}`;

  return (
    <article className={styles.eventItem}>
      <time className={styles.eventTime}>
        {dateLabel && (
          <span className={styles.dateLabel}>{dateLabel}</span>
        )}
        {hour}
      </time>
      <div className={styles.thumbnail}>
        <FallbackImage
          src={getShowImagePath(showTitle)}
          alt={getShowImageAlt(showTitle)}
          fill
          sizes="96px"
          className={styles.thumbnailImage}
        />
      </div>
      <div className={styles.eventDetails}>
        <Link href={showPath(showSlug)} className={styles.eventTitle}>
          {showTitle}
        </Link>
        <span className={styles.eventVenue}>{venueText}</span>
        <div className={styles.eventRating}>
          {showAvgRating !== null ? (
            <span className={styles.ratingBadge}>
              {showAvgRating.toFixed(1)} ★
              {showReviewCount > 0 && (
                <span className={styles.reviewCount}>
                  {" "}· {showReviewCount} ביקורות
                </span>
              )}
            </span>
          ) : showReviewCount === 0 ? (
            <Link
              href={`/shows/${showSlug}/review`}
              className={styles.reviewCta}
              aria-label={`כתבו ביקורת על ${showTitle}`}
            >
              ראיתם? כתבו ביקורת &larr;
            </Link>
          ) : null}
        </div>
      </div>
      <span className={styles.arrow} aria-hidden="true">‹</span>
    </article>
  );
}
