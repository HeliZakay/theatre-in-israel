import Link from "next/link";
import Hero from "@/components/Hero/Hero";
import styles from "./page.module.css";
import { getShows } from "@/lib/shows";

function getAverageRating(reviews) {
  if (!reviews.length) {
    return null;
  }
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return total / reviews.length;
}

function getLatestReviewDate(reviews) {
  if (!reviews.length) {
    return null;
  }
  return reviews.reduce((latest, review) => {
    const reviewDate = new Date(review.date);
    if (Number.isNaN(reviewDate.getTime())) {
      return latest;
    }
    return !latest || reviewDate > latest ? reviewDate : latest;
  }, null);
}

export default async function Home() {
  const shows = await getShows();
  const topRated = [...shows]
    .map((show) => ({
      ...show,
      avgRating: getAverageRating(show.reviews),
    }))
    .filter((show) => show.avgRating !== null)
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, 6);
  const latestReviewed = [...shows]
    .map((show) => ({
      ...show,
      latestReviewDate: getLatestReviewDate(show.reviews),
      avgRating: getAverageRating(show.reviews),
    }))
    .filter((show) => show.latestReviewDate)
    .sort((a, b) => b.latestReviewDate - a.latestReviewDate)
    .slice(0, 6);
  return (
    <div className={styles.page}>
      <Hero />

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.kicker}>החודש</p>
            <h2 className={styles.sectionTitle}>דירוגים גבוהים</h2>
          </div>
          <Link className={styles.link} href="/shows">
            לכל ההצגות
          </Link>
        </div>
        <div className={styles.grid}>
          {topRated.map((show) => (
            <Link
              key={show.id}
              className={styles.showCardLink}
              href={`/shows/${show.id}`}
            >
              <article className={styles.showCard}>
                <div className={styles.showThumb} aria-hidden />
                <div className={styles.showBody}>
                  <h3 className={styles.showTitle}>{show.title}</h3>
                  <p className={styles.showMeta}>{show.theatre}</p>
                  <div className={styles.genreRow}>
                    {(show.genre ?? []).slice(0, 2).map((item) => (
                      <span key={item} className={styles.genreChip}>
                        {item}
                      </span>
                    ))}
                  </div>
                  <div className={styles.showRating}>
                    {show.avgRating.toFixed(1)}
                    <span className={styles.star}>★</span>
                  </div>
                  <p className={styles.reviewCount}>
                    {show.reviews.length} ביקורות
                  </p>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.kicker}>חדש</p>
            <h2 className={styles.sectionTitle}>ביקורות אחרונות</h2>
          </div>
          <Link className={styles.link} href="/shows">
            לכל ההצגות
          </Link>
        </div>
        <div className={styles.grid}>
          {latestReviewed.map((show) => (
            <Link
              key={show.id}
              className={styles.showCardLink}
              href={`/shows/${show.id}`}
            >
              <article className={styles.showCard}>
                <div className={styles.showThumb} aria-hidden />
                <div className={styles.showBody}>
                  <h3 className={styles.showTitle}>{show.title}</h3>
                  <p className={styles.showMeta}>{show.theatre}</p>
                  <div className={styles.genreRow}>
                    {(show.genre ?? []).slice(0, 2).map((item) => (
                      <span key={item} className={styles.genreChip}>
                        {item}
                      </span>
                    ))}
                  </div>
                  <div className={styles.showRating}>
                    {show.avgRating.toFixed(1)}
                    <span className={styles.star}>★</span>
                  </div>
                  <p className={styles.reviewCount}>
                    {show.reviews.length} ביקורות
                  </p>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.ctaStrip}>
        <div>
          <h2 className={styles.ctaTitle}>כתבו ביקורת ועזרו לאחרים לבחור</h2>
          <p className={styles.ctaText}>
            כמה דקות של כתיבה יכולות לחסוך לקהל ערב לא מוצלח.
          </p>
        </div>
        <Link className={styles.ctaButton} href="/reviews/new">
          כתיבת ביקורת
        </Link>
      </section>
    </div>
  );
}
