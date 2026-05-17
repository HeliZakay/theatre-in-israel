import Link from "next/link";
import { showPath } from "@/constants/routes";
import FallbackImage from "@/components/ui/FallbackImage/FallbackImage";
import { getShowImagePath } from "@/utils/getShowImagePath";
import { getShowImageAlt } from "@/lib/seo";
import styles from "./EventDayCard.module.css";

export interface EventDayCardProps {
  hour: string;
  showTitle: string;
  showSlug: string;
  showAvgRating: number | null;
  showReviewCount: number;
  venueName: string;
  venueCity: string;
  imageSizes?: string;
}

export default function EventDayCard({
  hour,
  showTitle,
  showSlug,
  showAvgRating,
  showReviewCount,
  venueName,
  venueCity,
  imageSizes = "(max-width: 640px) 100vw, 280px",
}: EventDayCardProps) {
  const venueText = `${venueName}, ${venueCity}`;

  return (
    <Link href={showPath(showSlug)} className={styles.card}>
      <div className={styles.cardImage}>
        <FallbackImage
          src={getShowImagePath(showTitle)}
          alt={getShowImageAlt(showTitle)}
          fill
          sizes={imageSizes}
          className={styles.cardImageInner}
        />
        {showAvgRating !== null && (
          <span className={styles.ratingBadge}>
            <span className={styles.ratingStar} aria-hidden="true">★</span>
            {showAvgRating.toFixed(1)}
            {showReviewCount > 0 && (
              <span className={styles.ratingBadgeCount}>
                {" · "}{showReviewCount} ביקורות
              </span>
            )}
          </span>
        )}
      </div>
      <div className={styles.cardBody}>
        <span className={styles.cardTitle}>{showTitle}</span>
        <span className={styles.cardVenue}>
          <svg
            className={styles.venueIcon}
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path
              fill="currentColor"
              d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"
            />
          </svg>
          <span className={styles.venueText}>{venueText}</span>
        </span>
        <span className={styles.timeTag}>
          <svg
            className={styles.timeTagIcon}
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 7v5l3 2M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z"
            />
          </svg>
          {hour}
        </span>
      </div>
    </Link>
  );
}
