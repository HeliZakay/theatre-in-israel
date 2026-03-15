import ROUTES from "@/constants/routes";
import { getUpcomingEventsVaried } from "@/lib/data/homepage";
import SectionHeader from "@/components/SectionHeader/SectionHeader";
import EventCard from "./EventCard";
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
      <div className={styles.list}>
        {events.map((event) => (
          <EventCard
            key={`${event.showSlug}-${event.date}-${event.hour}`}
            hour={event.hour}
            showTitle={event.showTitle}
            showSlug={event.showSlug}
            showTheatre={event.showTheatre}
            showAvgRating={event.showAvgRating}
            showReviewCount={event.showReviewCount}
            venueName={event.venueName}
            venueCity={event.venueCity}
            dateLabel={event.dateLabel}
          />
        ))}
      </div>
    </section>
  );
}
