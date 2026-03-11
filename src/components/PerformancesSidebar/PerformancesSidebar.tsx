"use client";

import { useState } from "react";
import type { ShowEvent } from "@/types";
import styles from "./PerformancesSidebar.module.css";

interface PerformancesSidebarProps {
  events: ShowEvent[];
  theatre: string;
}

interface DateGroup {
  dateKey: string;
  label: string;
  events: ShowEvent[];
}

function groupByDate(events: ShowEvent[]): DateGroup[] {
  const map = new Map<string, ShowEvent[]>();

  for (const event of events) {
    const dateKey = event.date.slice(0, 10);
    if (!map.has(dateKey)) {
      map.set(dateKey, []);
    }
    map.get(dateKey)!.push(event);
  }

  return Array.from(map.entries()).map(([dateKey, evts]) => ({
    dateKey,
    label: new Date(dateKey).toLocaleDateString("he-IL", {
      weekday: "short",
      day: "numeric",
      month: "long",
    }),
    events: evts,
  }));
}

const MAX_EVENTS = 8;
const COLLAPSED_GROUPS = 3;

export default function PerformancesSidebar({
  events,
  theatre,
}: PerformancesSidebarProps) {
  const [expanded, setExpanded] = useState(false);

  if (events.length === 0) return null;

  const dateGroups = groupByDate(events);
  const shouldCollapse = events.length > MAX_EVENTS;
  const visibleGroups =
    shouldCollapse && !expanded
      ? dateGroups.slice(0, COLLAPSED_GROUPS)
      : dateGroups;

  return (
    <section className={styles.card}>
      <h2 className={styles.title}>🎭 הופעות קרובות</h2>

      <div className={styles.dateList}>
        {visibleGroups.map((group) => (
          <div key={group.dateKey} className={styles.dateGroup}>
            <h3 className={styles.dateHeading}>{group.label}</h3>
            {group.events.map((event) => (
              <div key={event.id} className={styles.timeEntry}>
                <span className={styles.hour}>{event.hour}</span>
                <span className={styles.venue}>{event.venue.name}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {shouldCollapse && (
        <button
          className={styles.showMoreBtn}
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? "הצג פחות" : "הצג עוד"}
        </button>
      )}
    </section>
  );
}
