import { DATE_SLUGS, DEFAULT_DATE_PRESET } from "@/lib/eventsConstants";
import { buildFilterUrl } from "./buildFilterUrl";
import styles from "./DateChips.module.css";

interface DateChipsProps {
  datePreset: string;
  locationSlug?: string;
}

export default function DateChips({ datePreset, locationSlug }: DateChipsProps) {
  return (
    <nav
      role="radiogroup"
      aria-label="סינון לפי תאריך"
      className={styles.chipRow}
    >
      {Object.entries(DATE_SLUGS).map(([slug, label]) => {
        const isActive =
          slug === datePreset ||
          (slug === DEFAULT_DATE_PRESET &&
            datePreset === DEFAULT_DATE_PRESET);
        const href = buildFilterUrl(
          slug === DEFAULT_DATE_PRESET ? undefined : slug,
          locationSlug,
        );
        return (
          <a
            key={slug}
            role="radio"
            aria-checked={isActive}
            href={href}
            className={`${styles.chip} ${isActive ? styles.chipActive : ""}`}
          >
            {label}
          </a>
        );
      })}
    </nav>
  );
}
