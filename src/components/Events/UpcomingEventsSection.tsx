import Link from "next/link";
import ROUTES from "@/constants/routes";
import { getUpcomingEventsVaried } from "@/lib/data/homepage";
import { showPath } from "@/constants/routes";
import SectionHeader from "@/components/SectionHeader/SectionHeader";
import Card from "@/components/Card/Card";
import FallbackImage from "@/components/FallbackImage/FallbackImage";
import ShowCarousel from "@/components/ShowCarousel/ShowCarousel";
import { getShowImagePath } from "@/utils/getShowImagePath";
import { getShowImageAlt } from "@/lib/seo";
import styles from "./UpcomingEventsSection.module.css";

export default async function UpcomingEventsSection() {
  const events = await getUpcomingEventsVaried();
  if (events.length === 0) return null;

  return (
    <section className={styles.section}>
      <SectionHeader
        kicker="לוח הופעות"
        title="הצגות הקרובות"
        linkHref={ROUTES.EVENTS}
        linkText="לכל ההופעות"
      />
      <ShowCarousel label="הצגות הקרובות">
        {events.map((event, index) => (
          <div
            key={`${event.showSlug}-${event.date}-${event.hour}`}
            className={styles.slide}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} מתוך ${events.length}`}
          >
            <Link
              className={styles.cardLink}
              href={showPath(event.showSlug)}
            >
              <Card as="article" className={styles.card}>
                <div className={styles.thumb}>
                  <FallbackImage
                    src={getShowImagePath(event.showTitle)}
                    alt={getShowImageAlt(event.showTitle)}
                    fill
                    sizes="(max-width: 640px) 80vw, (max-width: 1024px) 33vw, 25vw"
                    className={styles.thumbImage}
                  />
                  <time className={styles.dateBadge}>
                    <span className={styles.dateLabel}>
                      {event.dateLabel ?? ""}
                    </span>
                    <span className={styles.dateHour}>{event.hour}</span>
                  </time>
                </div>
                <div className={styles.body}>
                  <h3 className={styles.cardTitle}>{event.showTitle}</h3>
                  <p className={styles.venue}>
                    {event.venueName}, {event.venueCity}
                  </p>
                  <div className={styles.rating}>
                    {event.showAvgRating !== null ? (
                      <>
                        {event.showAvgRating.toFixed(1)}
                        <span className={styles.star}>★</span>
                        {event.showReviewCount > 0 && (
                          <span className={styles.reviewCount}>
                            {event.showReviewCount} ביקורות
                          </span>
                        )}
                      </>
                    ) : (
                      <span className={styles.noRating}>טרם דורג</span>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        ))}
      </ShowCarousel>
    </section>
  );
}
