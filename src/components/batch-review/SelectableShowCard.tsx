"use client";

import FallbackImage from "@/components/ui/FallbackImage/FallbackImage";
import { getShowImagePath } from "@/utils/getShowImagePath";
import styles from "./SelectableShowCard.module.css";
import type { BatchShowItem } from "@/lib/data/batchReview";

interface SelectableShowCardProps {
  show: BatchShowItem;
  selected: boolean;
  alreadyReviewed: boolean;
  maxReached: boolean;
  onToggle: (showId: number) => void;
  tabIndex?: number;
}

export default function SelectableShowCard({
  show,
  selected,
  alreadyReviewed,
  maxReached,
  onToggle,
  tabIndex = 0,
}: SelectableShowCardProps) {
  const disabled = alreadyReviewed || maxReached;

  const handleClick = () => {
    if (!disabled) {
      onToggle(show.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === " ") && !disabled) {
      e.preventDefault();
      onToggle(show.id);
    }
  };

  return (
    <div
      role="checkbox"
      aria-checked={selected}
      aria-disabled={disabled}
      aria-label={alreadyReviewed ? `${show.title} — כבר נכתבה ביקורת` : show.title}
      tabIndex={disabled ? -1 : tabIndex}
      className={`${styles.card} ${selected ? styles.selected : ""} ${disabled ? styles.reviewed : ""}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.imageWrapper}>
        <FallbackImage
          src={getShowImagePath(show.title)}
          alt={show.title}
          fill
          sizes="(max-width: 400px) 45vw, (max-width: 900px) 25vw, 200px"
          className={styles.image}
        />
        <div className={styles.gradient} />
        <span className={styles.title}>{show.title}</span>
      </div>

      {selected && (
        <span className={styles.checkmark} aria-hidden>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M3 8.5L6.5 12L13 4"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}

      {alreadyReviewed && (
        <span className={styles.reviewedBadge}>כבר נכתבה ביקורת</span>
      )}
    </div>
  );
}
