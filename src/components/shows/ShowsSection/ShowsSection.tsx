import Link from "next/link";
import styles from "./ShowsSection.module.css";
import Tag from "@/components/ui/Tag/Tag";
import Card from "@/components/ui/Card/Card";
import SectionHeader from "@/components/ui/SectionHeader/SectionHeader";
import FallbackImage from "@/components/ui/FallbackImage/FallbackImage";
import ShowCarousel from "@/components/shows/ShowCarousel/ShowCarousel";
import WatchlistToggle from "@/components/shows/WatchlistToggle/WatchlistToggle";
import { getShowImagePath } from "@/utils/getShowImagePath";
import type { ShowListItem } from "@/types";

interface ShowsSectionProps {
  kicker?: string;
  title: string;
  shows: ShowListItem[];
  linkHref?: string;
  linkText?: string;
  className?: string;
  sectionGenres?: string[];
}

export default function ShowsSection({
  kicker,
  title,
  shows,
  linkHref,
  linkText,
  className,
  sectionGenres,
}: ShowsSectionProps) {
  return (
    <section className={[styles.section, className].filter(Boolean).join(" ")}>
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
            <div className={styles.cardWrapper}>
              <Link
                className={styles.cardLink}
                href={`/shows/${show.slug ?? show.id}`}
              >
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
                      {(() => {
                        const genres = show.genre ?? [];
                        const ordered = sectionGenres
                          ? [
                              ...genres.filter((g) => sectionGenres.includes(g)),
                              ...genres.filter((g) => !sectionGenres.includes(g)),
                            ]
                          : genres;
                        return ordered.slice(0, 3).map((item) => (
                          <Tag key={item}>{item}</Tag>
                        ));
                      })()}
                    </div>
                    <div className={styles.bottomRow}>
                      <div className={styles.rating}>
                        {show.avgRating !== null ? (
                          <>
                            {show.avgRating.toFixed(1)}
                            <span className={styles.star}>★</span>
                            {show.reviewCount > 0 && (
                              <span className={styles.reviewCount}>
                                {show.reviewCount} ביקורות
                              </span>
                            )}
                          </>
                        ) : (
                          <span className={styles.noRating}>טרם דורג</span>
                        )}
                      </div>
                      <WatchlistToggle
                        showId={show.id}
                        showSlug={show.slug ?? String(show.id)}
                        className={styles.inlineToggle}
                      />
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          </div>
        ))}
      </ShowCarousel>
    </section>
  );
}
