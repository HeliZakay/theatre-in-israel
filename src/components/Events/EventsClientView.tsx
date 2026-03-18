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
}

export default function EventsClientView({ groups, dateTabs }: EventsClientViewProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    dateTabs[0]?.dateKey ?? "",
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
      {selectedGroup && <DayView group={selectedGroup} />}
    </>
  );
}
