import EventCard from "./EventCard";
import type { EventCardProps } from "./EventCard";
import styles from "./EventsList.module.css";

export interface DateGroup {
  dateKey: string;
  label: string;
  events: EventCardProps[];
}

interface EventsListProps {
  groups: DateGroup[];
}

export default function EventsList({ groups }: EventsListProps) {
  return (
    <div className={styles.eventList}>
      {groups.map((group) => (
        <section key={group.dateKey} className={styles.dateGroup}>
          <h2 className={styles.dateHeader}>{group.label}</h2>
          {group.events.map((event, i) => (
            <EventCard key={`${event.showSlug}-${event.hour}-${i}`} {...event} />
          ))}
        </section>
      ))}
    </div>
  );
}
