"use client";

import React, { useState } from "react";
import type { DateGroup } from "./EventsList";
import type { EventCardProps } from "./EventCard";
import EventDayCard from "./EventDayCard";
import styles from "./DayView.module.css";

const TIME_SLOTS = [
  { key: "morning", label: "בוקר", minHour: 8, maxHour: 12 },
  { key: "afternoon", label: "אחר הצהריים", minHour: 13, maxHour: 18 },
  { key: "evening", label: "ערב", minHour: 19, maxHour: 20 },
  { key: "night", label: "לילה", minHour: 21, maxHour: 23 },
] as const;

type SlotKey = (typeof TIME_SLOTS)[number]["key"];

function getSlotKey(hour: string): SlotKey {
  const h = parseInt(hour.split(":")[0], 10);
  for (const slot of TIME_SLOTS) {
    if (h >= slot.minHour && h <= slot.maxHour) return slot.key;
  }
  return h < 8 ? "morning" : "night";
}

interface SlotData {
  key: SlotKey;
  label: string;
  events: EventCardProps[];
}

function groupBySlot(events: EventCardProps[]): SlotData[] {
  const buckets: Record<SlotKey, EventCardProps[]> = {
    morning: [],
    afternoon: [],
    evening: [],
    night: [],
  };

  for (const event of events) {
    buckets[getSlotKey(event.hour)].push(event);
  }

  const result: SlotData[] = [];
  for (const slot of TIME_SLOTS) {
    if (buckets[slot.key].length > 0) {
      result.push({ key: slot.key, label: slot.label, events: buckets[slot.key] });
    }
  }
  return result;
}

interface DayViewProps {
  group: DateGroup;
}

export default function DayView({ group }: DayViewProps) {
  const slots = groupBySlot(group.events);

  const [openSlots, setOpenSlots] = useState<Set<SlotKey>>(
    () => new Set(slots.map((s) => s.key)),
  );

  const toggleSlot = (key: SlotKey) => {
    setOpenSlots((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className={styles.wrapper}>
      {slots.map((slot) => {
        const isOpen = openSlots.has(slot.key);
        return (
          <section key={slot.key} className={styles.slotSection}>
            <button
              type="button"
              className={styles.slotLabel}
              onClick={() => toggleSlot(slot.key)}
              aria-expanded={isOpen}
            >
              <span className={styles.slotToggle}>
                {isOpen ? "▾" : "◂"}
              </span>
              {slot.label}
              <span className={styles.slotCount}>
                {slot.events.length} הופעות
              </span>
            </button>

            {isOpen && (
              <div className={styles.slotGrid}>
                {slot.events.map((event, i) => (
                  <EventDayCard
                    key={`${event.showSlug}-${event.hour}-${i}`}
                    hour={event.hour}
                    showTitle={event.showTitle}
                    showSlug={event.showSlug}
                    showAvgRating={event.showAvgRating}
                    showReviewCount={event.showReviewCount}
                    venueName={event.venueName}
                    venueCity={event.venueCity}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
