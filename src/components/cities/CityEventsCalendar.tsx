"use client";

import { useMemo, useState } from "react";
import EventsClientView from "@/components/events/EventsClientView";
import {
  buildDateGroupsAndTabs,
  type EventForGroups,
} from "@/lib/data/eventsGroups";
import styles from "./CityEventsCalendar.module.css";

interface Venue {
  name: string;
  upcomingEventCount: number;
}

interface CityEventsCalendarProps {
  cityName: string;
  venues: Venue[];
  events: EventForGroups[];
}

export default function CityEventsCalendar({
  cityName,
  venues,
  events,
}: CityEventsCalendarProps) {
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);

  const filteredEvents = useMemo(
    () =>
      selectedVenue
        ? events.filter((e) => e.venueName === selectedVenue)
        : events,
    [events, selectedVenue],
  );

  const { dateGroupsFormatted, dateTabs } = useMemo(
    () => buildDateGroupsAndTabs(filteredEvents),
    [filteredEvents],
  );

  const showReset = venues.length > 1 || selectedVenue !== null;

  return (
    <>
      {venues.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>אולמות ב{cityName}</h2>
          {showReset && (
            <div className={styles.resetRow}>
              <span className={styles.filterLabel}>סינון לפי אולם:</span>
              <button
                type="button"
                className={styles.resetChip}
                onClick={() => setSelectedVenue(null)}
                aria-pressed={selectedVenue === null}
              >
                {selectedVenue === null ? "כל האולמות ✓" : "כל האולמות"}
              </button>
            </div>
          )}
          <div className={styles.venueGrid}>
            {venues.map((v) => {
              const active = v.name === selectedVenue;
              return (
                <button
                  key={v.name}
                  type="button"
                  className={
                    active
                      ? `${styles.venueButton} ${styles.venueButtonActive}`
                      : styles.venueButton
                  }
                  aria-pressed={active}
                  onClick={() =>
                    setSelectedVenue((current) =>
                      current === v.name ? null : v.name,
                    )
                  }
                >
                  <span className={styles.venueName}>{v.name}</span>
                  <span className={styles.venueEvents}>
                    {v.upcomingEventCount} הופעות קרובות
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          לוח הופעות ב{selectedVenue ?? cityName}
        </h2>
        {filteredEvents.length === 0 ? (
          <p className={styles.empty}>
            אין הופעות קרובות{selectedVenue ? ` ב${selectedVenue}` : ""}.
          </p>
        ) : (
          <div className={styles.calendar}>
            <EventsClientView
              key={selectedVenue ?? "all"}
              groups={dateGroupsFormatted}
              dateTabs={dateTabs}
              datePreset="all"
            />
          </div>
        )}
      </section>
    </>
  );
}
