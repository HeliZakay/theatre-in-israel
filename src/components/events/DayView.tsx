"use client";

import React, { useState } from "react";
import Link from "next/link";
import { showPath } from "@/constants/routes";
import FallbackImage from "@/components/ui/FallbackImage/FallbackImage";
import { getShowImagePath } from "@/utils/getShowImagePath";
import { getShowImageAlt } from "@/lib/seo";
import type { DateGroup } from "./EventsList";
import type { EventCardProps } from "./EventCard";
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
                {slot.events.map((event, i) => {
                  const venueText = `${event.venueName}, ${event.venueCity}`;
                  return (
                    <Link
                      key={`${event.showSlug}-${event.hour}-${i}`}
                      href={showPath(event.showSlug)}
                      className={styles.card}
                    >
                      <div className={styles.cardImage}>
                        <FallbackImage
                          src={getShowImagePath(event.showTitle)}
                          alt={getShowImageAlt(event.showTitle)}
                          fill
                          sizes="(max-width: 640px) 100vw, 280px"
                          className={styles.cardImageInner}
                        />
                        <span className={styles.timeBadge}>{event.hour}</span>
                      </div>
                      <div className={styles.cardBody}>
                        <span className={styles.cardTitle}>
                          {event.showTitle}
                        </span>
                        <span className={styles.cardVenue}>{venueText}</span>
                        {event.showAvgRating !== null && (
                          <span className={styles.cardRating}>
                            {event.showAvgRating.toFixed(1)} ★
                            {event.showReviewCount > 0 && (
                              <span className={styles.reviewCount}>
                                {" "}· {event.showReviewCount} ביקורות
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
