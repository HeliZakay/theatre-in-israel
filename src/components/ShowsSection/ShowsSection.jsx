import Link from "next/link";
import styles from "./ShowsSection.module.css";

export default function ShowsSection({
  kicker,
  title,
  shows,
  linkHref,
  linkText,
}) {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>{kicker}</p>
          <h2 className={styles.title}>{title}</h2>
        </div>
        {linkHref && linkText && (
          <Link className={styles.link} href={linkHref}>
            {linkText}
          </Link>
        )}
      </div>
      <div className={styles.grid}>
        {shows.map((show) => (
          <Link
            key={show.id}
            className={styles.cardLink}
            href={`/shows/${show.id}`}
          >
            <article className={styles.card}>
              <div className={styles.thumb} aria-hidden />
              <div className={styles.body}>
                <h3 className={styles.cardTitle}>{show.title}</h3>
                <p className={styles.meta}>{show.theatre}</p>
                <div className={styles.genreRow}>
                  {(show.genre ?? []).slice(0, 2).map((item) => (
                    <span key={item} className={styles.genreChip}>
                      {item}
                    </span>
                  ))}
                </div>
                <div className={styles.rating}>
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
  );
}
