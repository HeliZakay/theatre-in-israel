import Link from "next/link";
import {
  DATE_SLUGS,
  REGION_SLUGS,
  DEFAULT_DATE_PRESET,
} from "@/lib/eventsConstants";
import { buildFilterUrl } from "./buildFilterUrl";
import styles from "./EventsEmptyState.module.css";

const CITY_DISPLAY: Record<string, string> = {
  "tel-aviv": "תל אביב",
  haifa: "חיפה",
  "beer-sheva": "באר שבע",
};

interface EventsEmptyStateProps {
  datePreset: string;
  region?: string;
  city?: string;
  theatre?: string;
  nearestRegion: { slug: string; label: string; count: number } | null;
}

export default function EventsEmptyState({
  datePreset,
  region,
  city,
  theatre,
  nearestRegion,
}: EventsEmptyStateProps) {
  const isDefaultDate = datePreset === DEFAULT_DATE_PRESET;
  const hasNonDefaultFilter = !isDefaultDate || !!region || !!city;

  if (theatre) {
    return (
      <div className={styles.emptyState}>
        <p>אין הופעות קרובות של {theatre} כרגע.</p>
      </div>
    );
  }

  return (
    <div className={styles.emptyState}>
      {hasNonDefaultFilter && nearestRegion ? (
        <p>
          לא נמצאו הופעות
          {region ? ` ב${REGION_SLUGS[region]}` : ""}
          {city ? ` ב${CITY_DISPLAY[city] ?? city}` : ""}
          {!isDefaultDate ? ` ב${DATE_SLUGS[datePreset]}` : ""}.{" "}
          יש {nearestRegion.count} הופעות ב{nearestRegion.label}{" "}
          <Link href={buildFilterUrl(isDefaultDate ? undefined : datePreset, nearestRegion.slug)}>
            &larr;
          </Link>
        </p>
      ) : (
        <p>אין הופעות קרובות כרגע.</p>
      )}
    </div>
  );
}
