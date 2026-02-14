import Link from "next/link";
import styles from "./ShowsSection.module.css";
import Tag from "@/components/Tag/Tag";
import Card from "@/components/Card/Card";
import SectionHeader from "@/components/SectionHeader/SectionHeader";
import FallbackImage from "@/components/FallbackImage/FallbackImage";
import ShowCarousel from "@/components/ShowCarousel/ShowCarousel";
import { getShowImagePath } from "@/utils/getShowImagePath";
import type { EnrichedShow } from "@/types";

interface ShowsSectionProps {
  kicker?: string;
  title: string;
  shows: EnrichedShow[];
  linkHref?: string;
  linkText?: string;
}

export default function ShowsSection({
  kicker,
  title,
  shows,
  linkHref,
  linkText,
}: ShowsSectionProps) {
  return (
    <section className={styles.section}>
      <SectionHeader
        kicker={kicker}
        title={title}
        linkHref={linkHref}
        linkText={linkText}
      />
      <ShowCarousel label={title}>
        {shows.map((show, index) => (
          <div
            key={show.id}
            className={styles.slide}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} מתוך ${shows.length}`}
          >
            <Link className={styles.cardLink} href={`/shows/${show.id}`}>
              <Card as="article" className={styles.card}>
                <div className={styles.thumb}>
                  <FallbackImage
                    src={getShowImagePath(show.title)}
                    alt={show.title}
                    fill
                    sizes="(max-width: 640px) 80vw, (max-width: 1024px) 33vw, 20vw"
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
                    {(show.avgRating ?? 0).toFixed(1)}
                    <span className={styles.star}>★</span>
                  </div>
                  <p className={styles.reviewCount}>
                    {show.reviews.length} ביקורות
                  </p>
                </div>
              </Card>
            </Link>
          </div>
        ))}
      </ShowCarousel>
    </section>
  );
}
