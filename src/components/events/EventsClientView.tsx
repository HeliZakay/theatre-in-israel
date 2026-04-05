"use client";

import { useState } from "react";
import DateStrip from "./DateStrip";
import type { DateTab } from "./DateStrip";
import DayView from "./DayView";
import type { DateGroup } from "./EventsList";
import styles from "./EventsClientView.module.css";

interface EventsClientViewProps {
  groups: DateGroup[];
  dateTabs: DateTab[];
  datePreset: string;
}

/**
 * Resolve which dateKey to initially select based on the URL date preset.
 * The preset indicates a scroll-to target, not a filter.
 */
function resolveInitialDate(preset: string, tabs: DateTab[]): string {
  if (tabs.length === 0) return "";
  if (preset === "all") return tabs[0].dateKey;

  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const todayKey = fmt.format(now);

  if (preset === "today") {
    return tabs.find((t) => t.dateKey === todayKey)?.dateKey ?? "";
  }

  if (preset === "tomorrow") {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowKey = fmt.format(tomorrow);
    return tabs.find((t) => t.dateKey === tomorrowKey)?.dateKey ?? "";
  }

  if (preset === "weekend") {
    // Israeli weekend: Thu-Sat. Find the nearest Thu/Fri/Sat.
    const weekdayIndex = (dateKey: string) => {
      const d = new Date(dateKey + "T00:00:00Z");
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "UTC",
        weekday: "short",
      }).format(d);
      const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      return map[parts] ?? -1;
    };
    const target = tabs.find((t) => {
      const dow = weekdayIndex(t.dateKey);
      return dow >= 4 && t.dateKey >= todayKey;
    });
    return target?.dateKey ?? "";
  }

  if (preset === "week") {
    // Current Israeli week: find the Sunday of the current week
    const dow = new Date(todayKey + "T00:00:00Z").getUTCDay();
    const sun = new Date(todayKey + "T00:00:00Z");
    sun.setUTCDate(sun.getUTCDate() - dow);
    const sunKey = sun.toISOString().slice(0, 10);
    // Find first tab on or after that Sunday
    const target = tabs.find((t) => t.dateKey >= sunKey);
    return target?.dateKey ?? "";
  }

  if (preset === "nextweek") {
    const dow = new Date(todayKey + "T00:00:00Z").getUTCDay();
    const sun = new Date(todayKey + "T00:00:00Z");
    sun.setUTCDate(sun.getUTCDate() - dow + 7);
    const sunKey = sun.toISOString().slice(0, 10);
    const target = tabs.find((t) => t.dateKey >= sunKey);
    return target?.dateKey ?? "";
  }

  return "";
}

export default function EventsClientView({ groups, dateTabs, datePreset }: EventsClientViewProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    () => resolveInitialDate(datePreset, dateTabs),
  );

  const selectedGroup = groups.find((g) => g.dateKey === selectedDate) ?? null;

  return (
    <>
      <DateStrip
        tabs={dateTabs}
        selected={selectedDate}
        onSelect={setSelectedDate}
      />
      <div className={styles.summary} aria-live="polite">
        {selectedGroup
          ? `${selectedGroup.events.length} הופעות`
          : "לא נמצאו הופעות"}
      </div>
      {selectedGroup && <DayView key={selectedDate} group={selectedGroup} />}
    </>
  );
}
