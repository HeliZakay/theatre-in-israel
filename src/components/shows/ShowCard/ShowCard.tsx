import Link from "next/link";
import styles from "./ShowCard.module.css";
import Tag from "@/components/ui/Tag/Tag";
import Card from "@/components/ui/Card/Card";
import FallbackImage from "@/components/ui/FallbackImage/FallbackImage";
import WatchlistToggle from "@/components/shows/WatchlistToggle/WatchlistToggle";
import NewBadge from "@/components/shows/NewBadge/NewBadge";
import { getShowImagePath } from "@/utils/getShowImagePath";
import { getShowImageAlt } from "@/lib/seo";
import { formatEventDate } from "@/utils/formatDate";
import type { ShowListItem } from "@/types";

interface ShowCardProps {
  show: ShowListItem;
  priority?: boolean;
}

export default function ShowCard({ show, priority }: ShowCardProps) {
  const { reviewCount, avgRating, nextEvent } = show;
  const slug = show.slug ?? String(show.id);

  return (
    <div className={styles.cardWrapper}>
      <Link href={`/shows/${slug}`} className={styles.cardLink}>
        <Card as="article" className={styles.card} aria-label={show.title}>
          <div className={styles.imageWrapper}>
            {show.isNew && <NewBadge />}
            <FallbackImage
              src={getShowImagePath(show.title)}
              alt={getShowImageAlt(show.title)}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className={styles.image}
              priority={priority}
            />
          </div>
          <header className={styles.header}>
            <h2 className={styles.title}>{show.title}</h2>
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

          {nextEvent && (
            <div className={styles.nextEvent}>
              <span className={styles.nextEventLabel}>ההצגה הקרובה:</span>{" "}
              {formatEventDate(nextEvent.date)}, {nextEvent.hour}
              {" · "}
              {nextEvent.venueName}, {nextEvent.venueCity}
            </div>
          )}

          <div className={styles.genreRow}>
            {(show.genre ?? []).slice(0, 3).map((item) => (
              <Tag key={item}>{item}</Tag>
            ))}
          </div>

          <div className={styles.bottomRow}>
            <div className={styles.rating}>
              {avgRating !== null ? (
                <span className={styles.ratingValue}>
                  {avgRating.toFixed(1)}
                </span>
              ) : (
                <span className={styles.ratingEmpty}>עדיין אין דירוגים</span>
              )}
            </div>
            <WatchlistToggle
              showId={show.id}
              showSlug={slug}
              variant="inline"
            />
          </div>
        </Card>
      </Link>
    </div>
  );
}
