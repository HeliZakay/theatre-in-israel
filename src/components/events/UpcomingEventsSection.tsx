import ROUTES from "@/constants/routes";
import { getUpcomingEventsVaried } from "@/lib/data/homepage";
import SectionHeader from "@/components/ui/SectionHeader/SectionHeader";
import ShowCarousel from "@/components/shows/ShowCarousel/ShowCarousel";
import EventDayCard from "./EventDayCard";
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
            <EventDayCard
              hour={event.hour}
              showTitle={event.showTitle}
              showSlug={event.showSlug}
              showAvgRating={event.showAvgRating}
              showReviewCount={event.showReviewCount}
              venueName={event.venueName}
              venueCity={event.venueCity}
              imageSizes="(max-width: 640px) 80vw, (max-width: 1024px) 33vw, 25vw"
            />
          </div>
        ))}
      </ShowCarousel>
    </section>
  );
}
