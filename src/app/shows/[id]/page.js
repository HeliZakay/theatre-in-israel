import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";
import { notFound } from "next/navigation";
import { getShowById } from "@/lib/showsData";
import ROUTES from "@/constants/routes";
import ReviewCard from "@/components/ReviewCard/ReviewCard";
import { getShowStats } from "@/utils/showStats";
import { getShowImagePath } from "@/utils/getShowImagePath";

export const dynamic = "force-dynamic";

export default async function ShowPage({ params }) {
  const { id: showId } = await params;
  const show = await getShowById(showId);

  if (!show) {
    notFound();
  }

  const { reviewCount, avgRating } = getShowStats(show);

  return (
    <main className={styles.page} id="main-content">
      <Link className={styles.backLink} href={ROUTES.SHOWS}>
        לכל ההצגות →
      </Link>
      <header className={styles.header}>
        <div className={styles.heroGrid}>
          <div className={styles.poster}>
            <Image
              src={getShowImagePath(show.title)}
              alt={show.title}
              fill
              sizes="(max-width: 640px) 100vw, 320px"
              className={styles.posterImage}
              priority
            />
          </div>
          <div className={styles.heroContent}>
            <h1 className={styles.title}>{show.title}</h1>
            <div className={styles.ratingRow}>
              {avgRating !== null ? (
                <span className={styles.metaRating}>
                  דירוג ממוצע
                  <span className={styles.metaRatingValue}>
                    {avgRating.toFixed(1)}
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
