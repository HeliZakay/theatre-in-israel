import Link from "next/link";
import styles from "./ShowCard.module.css";
import Tag from "@/components/Tag/Tag";
import Card from "@/components/Card/Card";
import FallbackImage from "@/components/FallbackImage/FallbackImage";
import { getShowStats } from "@/utils/showStats";
import { getShowImagePath } from "@/utils/getShowImagePath";
import type { Show } from "@/types";

interface ShowCardProps {
  show: Show;
}

export default function ShowCard({ show }: ShowCardProps) {
  const { reviewCount, avgRating } = getShowStats(show);

  return (
    <Link href={`/shows/${show.id}`} className={styles.cardLink}>
      <Card as="article" className={styles.card} aria-label={show.title}>
        <div className={styles.imageWrapper}>
          <FallbackImage
            src={getShowImagePath(show.title)}
            alt={show.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={styles.image}
          />
        </div>
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
            <Tag key={item}>{item}</Tag>
          ))}
        </div>

        <div className={styles.rating}>
          {avgRating !== null ? (
            <span className={styles.ratingValue}>{avgRating.toFixed(1)}</span>
          ) : (
            <span className={styles.ratingEmpty}>עדיין אין דירוגים</span>
          )}
        </div>
      </Card>
    </Link>
  );
}
