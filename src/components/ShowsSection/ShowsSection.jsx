import Link from "next/link";
import Image from "next/image";
import styles from "./ShowsSection.module.css";
import Tag from "@/components/Tag/Tag";
import Card from "@/components/Card/Card";
import SectionHeader from "@/components/SectionHeader/SectionHeader";
import { getShowImagePath } from "@/utils/getShowImagePath";

export default function ShowsSection({
  kicker,
  title,
  shows,
  linkHref,
  linkText,
}) {
  return (
    <section className={styles.section}>
      <SectionHeader
        kicker={kicker}
        title={title}
        linkHref={linkHref}
        linkText={linkText}
      />
      <div className={styles.grid}>
        {shows.map((show) => (
          <Link
            key={show.id}
            className={styles.cardLink}
            href={`/shows/${show.id}`}
          >
            <Card as="article" className={styles.card}>
              <div className={styles.thumb}>
                <Image
                  src={getShowImagePath(show.title)}
                  alt={show.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className={styles.thumbImage}
                />
              </div>
              <div className={styles.body}>
                <h3 className={styles.cardTitle}>{show.title}</h3>
                <p className={styles.meta}>{show.theatre}</p>
                <div className={styles.genreRow}>
                  {(show.genre ?? []).slice(0, 2).map((item) => (
                    <Tag key={item}>{item}</Tag>
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
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
