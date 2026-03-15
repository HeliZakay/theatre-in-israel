import { REGION_SLUGS, DEFAULT_DATE_PRESET } from "@/lib/eventsConstants";
import { buildFilterUrl } from "./buildFilterUrl";
import styles from "./RegionChips.module.css";

interface RegionChipsProps {
  region?: string;
  city?: string;
  datePreset: string;
  regionCounts: Record<string, number>;
}

export default function RegionChips({
  region,
  city,
  datePreset,
  regionCounts,
}: RegionChipsProps) {
  const isDefaultDate = datePreset === DEFAULT_DATE_PRESET;

  return (
    <nav
      role="radiogroup"
      aria-label="סינון לפי אזור"
      className={styles.chipRow}
    >
      <a
        role="radio"
        aria-checked={!region && !city}
        href={buildFilterUrl(isDefaultDate ? undefined : datePreset, undefined)}
        className={`${styles.chip} ${!region && !city ? styles.chipActive : ""}`}
      >
        הכל
      </a>
      {Object.entries(REGION_SLUGS).map(([slug, label]) => {
        const count = regionCounts[slug] ?? 0;
        const isActive = region === slug;
        const href = buildFilterUrl(
          isDefaultDate ? undefined : datePreset,
          slug,
        );
        const disabled = count === 0;
        return (
          <a
            key={slug}
            role="radio"
            aria-checked={isActive}
            aria-disabled={disabled || undefined}
            tabIndex={disabled ? -1 : undefined}
            href={href}
            className={`${styles.chip} ${isActive ? styles.chipActive : ""} ${disabled ? styles.chipDisabled : ""}`}
          >
            {label}
            <span className={styles.chipBadge}>{count}</span>
          </a>
        );
      })}
    </nav>
  );
}
